import { Webhook } from "svix";
import User from "../models/User.js";
import Stripe from "stripe";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";

// API Controller Function to Manage Clerk User with database
export const clerkWebhooks = async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    await whook.verify(JSON.stringify(req.body), {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    const { data, type } = req.body;

    switch (type) {
      case "user.created": {
        const userData = {
          _id: data.id,
          email: data.email_addresses[0].email_address,
          name: data.first_name + " " + data.last_name,
          imageUrl: data.image_url,
        };
        await User.create(userData);
        res.json({});
        break;
      }

      case "user.updated": {
        const userData = {
          email: data.email_address[0].email_address,
          name: data.first_name + " " + data.last_name,
          imageUrl: data.image_url,
        };
        await User.findByIdAndUpdate(data.id, userData);
        res.json({});
        break;
      }

      case "user.deleted": {
        await User.findByIdAndDelete(data.id);
        res.json({});
        break;
      }

      default:
        break;
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
export const stripeWebhooks = async (request, response) => {
  const sig = request.headers["stripe-signature"];

  let event;

  try {
    event = Stripe.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle stripe webhooks
  try {
    console.log(event);

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const paymentIntentId = paymentIntent.id;

        const session = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntentId,
        });
        const { purchaseId, planType } = session.data[0].metadata;

        const purchaseData = await Purchase.findById(purchaseId);
        if (!purchaseData) break;

        const userData = await User.findById(purchaseData.userId);
        if (!userData) break;

        // Check if this is an upgrade (metadata has isUpgrade flag)
        const isUpgrade = session.data[0].metadata.isUpgrade === 'true';

        if (isUpgrade) {
          // Upgrade existing enrollment to premium
          const enrollment = await Enrollment.findOne({
            userId: userData._id,
            courseId: purchaseData.courseId,
            status: "active"
          });

          if (enrollment) {
            enrollment.planType = "premium";
            enrollment.upgradedFrom = enrollment._id;
            enrollment.upgradedAt = new Date();
            enrollment.purchaseId = purchaseData._id;
            await enrollment.save();
          }
        } else {
          // Create new enrollment
          await Enrollment.create({
            userId: userData._id,
            courseId: purchaseData.courseId,
            planType: purchaseData.planType || planType || "standard",
            purchaseId: purchaseData._id,
            status: "active",
            enrolledAt: new Date(),
            expiresAt: null,
            progress: {
              completedLessons: [],
              progressPercentage: 0
            }
          });
        }

        // Update legacy arrays for backward compatibility (temporary during migration)
        await Course.findByIdAndUpdate(purchaseData.courseId.toString(), {
          $addToSet: { enrolledStudents: userData._id },
        });

        // Update user's enrolled courses
        const userUpdate = {
          $addToSet: { enrolledCourses: purchaseData.courseId },
        };

        // If premium plan, also add to premiumCourses array
        if (planType === 'premium' || purchaseData.planType === 'premium') {
          userUpdate.$addToSet = {
            ...userUpdate.$addToSet,
            premiumCourses: purchaseData.courseId,
          };
        }

        await User.findByIdAndUpdate(userData._id, userUpdate);

        // Update course stats
        const enrollmentStats = await Enrollment.getEnrollmentStats(purchaseData.courseId);
        await Course.findByIdAndUpdate(purchaseData.courseId, {
          $set: {
            "stats.totalEnrollments": enrollmentStats.total,
            "stats.standardEnrollments": enrollmentStats.standard,
            "stats.premiumEnrollments": enrollmentStats.premium
          }
        });

        purchaseData.status = "completed";
        purchaseData.completedAt = new Date();
        await purchaseData.save();

        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const paymentIntentId = paymentIntent.id;

        const session = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntentId,
        });

        const { purchaseId } = session.data[0].metadata;
        const purchaseData = await Purchase.findById(purchaseId);
        if (purchaseData) {
          purchaseData.status = "failed";
          await purchaseData.save();
        }

        break;
      }
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (err) {
    console.error("Stripe webhook handling error:", err);
  }

  // Return a response to acknowledge receipt of the event
  response.json({ received: true });
};
