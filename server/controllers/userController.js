import Stripe from "stripe";
import Course from "../models/Course.js";
import { Purchase } from "../models/Purchase.js";
import User from "../models/User.js";
import { CourseProgress } from "../models/CourseProgress.js";
import Enrollment from "../models/Enrollment.js";
import Rating from "../models/Rating.js";
import CoursePlan from "../models/CoursePlan.js";

// Get User Data
export const getUserData = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User Not Found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Users Enrolled Courses With Lecture Links
export const userEnrolledCourses = async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    // Get enrollments from Enrollment collection
    const enrollments = await Enrollment.find({
      userId,
      status: "active"
    })
    .populate("courseId")
    .sort({ enrolledAt: -1 });
    
    const enrolledCourses = enrollments.map(enrollment => ({
      ...enrollment.courseId._doc,
      planType: enrollment.planType,
      progress: enrollment.progress,
      enrolledAt: enrollment.enrolledAt
    }));

    res.json({ success: true, enrolledCourses });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Purchase Course
export const purchaseCourse = async (req, res) => {
  try {
    const { courseId, planType = "standard" } = req.body;
    const { origin } = req.headers;
    const userId = req.auth.userId;
    const userData = await User.findById(userId);
    const courseData = await Course.findById(courseId);

    if (!userData || !courseData) {
      return res.json({ success: false, message: "Data Not Found" });
    }

    // Validate planType
    if (!['standard', 'premium'].includes(planType)) {
      return res.json({ success: false, message: "Invalid plan type" });
    }

    // Calculate base price with discount
    const basePrice = courseData.coursePrice - (courseData.discount * courseData.coursePrice) / 100;
    
    // Premium plan costs 1.5x the standard price
    const finalPrice = planType === 'premium' ? (basePrice * 1.5).toFixed(2) : basePrice.toFixed(2);

    const purchaseData = {
      courseId: courseData._id,
      userId,
      amount: finalPrice,
      planType,
    };

    const newPurchase = await Purchase.create(purchaseData);

    // Stripe Gateway Initialize
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

    const currency = process.env.CURRENCY.toLowerCase();

    // Plan name for Stripe product
    const planLabel = planType === 'premium' ? ' (Premium)' : ' (Standard)';

    // Creating line items for Stripe
    const line_items = [
      {
        price_data: {
          currency,
          product_data: {
            name: courseData.courseTitle + planLabel,
            description: planType === 'premium' 
              ? 'Includes: Full Course Access, Certificate, 1-on-1 Mentorship, Code Review'
              : 'Includes: Full Course Access, Certificate of Completion',
          },
          unit_amount: Math.floor(newPurchase.amount * 100),
        },
        quantity: 1,
      },
    ];

    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/loading/my-enrollments`,
      cancel_url: `${origin}/`,
      line_items: line_items,
      mode: "payment",
      metadata: {
        purchaseId: newPurchase._id.toString(),
        planType: planType,
      },
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Update User Course Progress
export const updateUserCourseProgress = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { courseId, lectureId } = req.body;
    const progressData = await CourseProgress.findOne({ userId, courseId });

    if (progressData) {
      if (progressData.lectureCompleted.includes(lectureId)) {
        res.json({ success: true, message: "Lecture Already Completed" });
      }

      progressData.lectureCompleted.push(lectureId);
      await progressData.save();
    } else {
      await CourseProgress.create({
        userId,
        courseId,
        lectureCompleted: [lectureId],
      });
    }

    res.json({ success: true, message: "Progress Updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get User Course Progress
export const getUserCourseProgress = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { courseId } = req.body;
    const progressData = await CourseProgress.findOne({ userId, courseId });

    res.json({ success: true, progressData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Add User Ratings to Course
export const addUserRating = async (req, res) => {
  const userId = req.auth.userId;
  const { courseId, rating, review = "" } = req.body;

  if (!courseId || !userId || !rating || rating < 1 || rating > 5) {
    return res.json({ success: false, message: "Invalid Details" });
  }

  try {
    const course = await Course.findById(courseId);

    if (!course) {
      return res.json({ success: false, message: "Course not found" });
    }

    // Check if user is enrolled using Enrollment model
    const enrollment = await Enrollment.findOne({
      userId,
      courseId,
      status: "active"
    });

    if (!enrollment) {
      return res.json({
        success: false,
        message: "User has not purchased this course.",
      });
    }

    // Check if user already rated
    const existingRating = await Rating.findOne({ userId, courseId });

    if (existingRating) {
      existingRating.rating = rating;
      existingRating.review = review;
      await existingRating.save();
    } else {
      await Rating.create({
        userId,
        courseId,
        rating,
        review,
        isVerifiedPurchase: true,
        status: "published"
      });
    }

    // Update course stats
    const ratingStats = await Rating.getCourseRating(courseId);
    await Course.findByIdAndUpdate(courseId, {
      $set: {
        "stats.averageRating": ratingStats.average,
        "stats.totalRatings": ratingStats.count
      }
    });

    return res.json({ success: true, message: "Rating added" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Upgrade to Premium
export const upgradeToPremium = async (req, res) => {
  try {
    const { courseId } = req.body;
    const { origin } = req.headers;
    const userId = req.auth.userId;
    const userData = await User.findById(userId);
    const courseData = await Course.findById(courseId);

    if (!userData || !courseData) {
      return res.json({ success: false, message: "Data Not Found" });
    }

    // Check enrollment using Enrollment model
    const enrollment = await Enrollment.findOne({
      userId,
      courseId,
      status: "active"
    });

    if (!enrollment) {
      return res.json({ success: false, message: "You must be enrolled first" });
    }

    // Check if already has premium
    if (enrollment.planType === "premium") {
      return res.json({ success: false, message: "You already have premium access" });
    }

    // Calculate upgrade price (difference between premium and standard)
    const standardPrice = courseData.coursePrice - (courseData.discount * courseData.coursePrice) / 100;
    const premiumPrice = courseData.premiumPrice || courseData.coursePrice * 1.5;
    const premiumDiscount = courseData.premiumDiscount || 0;
    const premiumFinalPrice = premiumPrice - (premiumPrice * premiumDiscount / 100);
    
    const upgradePrice = (premiumFinalPrice - standardPrice).toFixed(2);

    const purchaseData = {
      courseId: courseData._id,
      userId,
      amount: upgradePrice,
      planType: 'premium',
      isUpgrade: true,
    };

    const newPurchase = await Purchase.create(purchaseData);

    // Stripe Gateway Initialize
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    const currency = process.env.CURRENCY.toLowerCase();

    // Creating line items for Stripe
    const line_items = [
      {
        price_data: {
          currency,
          product_data: {
            name: `${courseData.courseTitle} - Upgrade to Premium`,
            description: 'Unlock: 1-on-1 Mentorship, Personal Code Reviews, Priority Support',
          },
          unit_amount: Math.floor(newPurchase.amount * 100),
        },
        quantity: 1,
      },
    ];

    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/loading/my-enrollments`,
      cancel_url: `${origin}/course/${courseId}`,
      line_items: line_items,
      mode: "payment",
      metadata: {
        purchaseId: newPurchase._id.toString(),
        planType: 'premium',
        isUpgrade: 'true',
      },
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
