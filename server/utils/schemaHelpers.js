import Enrollment from "../models/Enrollment.js";
import CoursePlan from "../models/CoursePlan.js";
import Rating from "../models/Rating.js";
import Course from "../models/Course.js";
import { Purchase } from "../models/Purchase.js";
import mongoose from "mongoose";

/**
 * Helper functions for working with the new schema
 */

// ============================================
// ENROLLMENT HELPERS
// ============================================

/**
 * Create enrollment after successful purchase
 */
export async function createEnrollment(userId, courseId, planType, purchaseId) {
  return await Enrollment.create({
    userId,
    courseId,
    planType,
    purchaseId,
    status: "active",
    enrolledAt: new Date(),
    expiresAt: null, // lifetime access
    progress: {
      completedLessons: [],
      progressPercentage: 0
    }
  });
}

/**
 * Check if user has any access to course
 */
export async function hasAccess(userId, courseId) {
  return await Enrollment.hasAccess(userId, courseId);
}

/**
 * Check if user has premium access
 */
export async function hasPremiumAccess(userId, courseId) {
  return await Enrollment.hasPremiumAccess(userId, courseId);
}

/**
 * Get user's enrollment for a course
 */
export async function getUserEnrollment(userId, courseId) {
  return await Enrollment.findOne({
    userId,
    courseId,
    status: "active"
  });
}

/**
 * Get all enrolled courses for a user
 */
export async function getUserEnrolledCourses(userId) {
  const enrollments = await Enrollment.find({
    userId,
    status: "active"
  })
  .populate("courseId")
  .sort({ enrolledAt: -1 });
  
  return enrollments.map(enrollment => ({
    course: enrollment.courseId,
    planType: enrollment.planType,
    progress: enrollment.progress,
    enrolledAt: enrollment.enrolledAt
  }));
}

/**
 * Upgrade enrollment from standard to premium
 */
export async function upgradeEnrollment(userId, courseId, newPurchaseId) {
  const enrollment = await Enrollment.findOne({
    userId,
    courseId,
    status: "active"
  });
  
  if (!enrollment) {
    throw new Error("No active enrollment found");
  }
  
  if (enrollment.planType === "premium") {
    throw new Error("Already have premium access");
  }
  
  enrollment.planType = "premium";
  enrollment.upgradedFrom = enrollment._id;
  enrollment.upgradedAt = new Date();
  enrollment.purchaseId = newPurchaseId;
  
  await enrollment.save();
  
  return enrollment;
}

// ============================================
// PRICING HELPERS
// ============================================

/**
 * Get pricing plans for a course
 */
export async function getCoursePricing(courseId) {
  const plans = await CoursePlan.getActivePlans(courseId);
  
  const result = {
    standard: null,
    premium: null
  };
  
  for (const plan of plans) {
    result[plan.planType] = {
      price: plan.price, // in cents
      finalPrice: plan.getFinalPrice(), // in cents, after discount
      currency: plan.currency,
      discount: plan.discount,
      features: plan.features,
      premiumBenefits: plan.premiumBenefits
    };
  }
  
  return result;
}

/**
 * Calculate upgrade price
 */
export async function calculateUpgradePrice(courseId) {
  const standardPlan = await CoursePlan.findOne({ 
    courseId, 
    planType: "standard",
    isActive: true 
  });
  
  const premiumPlan = await CoursePlan.findOne({ 
    courseId, 
    planType: "premium",
    isActive: true 
  });
  
  if (!standardPlan || !premiumPlan) {
    throw new Error("Pricing plans not found");
  }
  
  const standardPrice = standardPlan.getFinalPrice();
  const premiumPrice = premiumPlan.getFinalPrice();
  
  return Math.max(0, premiumPrice - standardPrice); // Ensure non-negative
}

// ============================================
// STATS HELPERS
// ============================================

/**
 * Update course stats (call after enrollments/ratings change)
 */
export async function updateCourseStats(courseId) {
  // Get enrollment stats
  const enrollmentStats = await Enrollment.getEnrollmentStats(courseId);
  
  // Get rating stats
  const ratingStats = await Rating.getCourseRating(courseId);
  
  // Get revenue
  const purchases = await Purchase.aggregate([
    {
      $match: {
        courseId: new mongoose.Types.ObjectId(courseId),
        status: "completed"
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$amount" }
      }
    }
  ]);
  
  // Update course
  await Course.findByIdAndUpdate(courseId, {
    $set: {
      "stats.totalEnrollments": enrollmentStats.total,
      "stats.standardEnrollments": enrollmentStats.standard,
      "stats.premiumEnrollments": enrollmentStats.premium,
      "stats.averageRating": ratingStats.average,
      "stats.totalRatings": ratingStats.count,
      "stats.totalRevenue": purchases[0]?.totalRevenue || 0
    }
  });
  
  return {
    enrollments: enrollmentStats,
    ratings: ratingStats,
    revenue: purchases[0]?.totalRevenue || 0
  };
}

/**
 * Get educator dashboard stats
 */
export async function getEducatorStats(educatorId) {
  // Get all educator's courses
  const courses = await Course.find({ 
    educator: educatorId,
    status: "published" 
  });
  
  const courseIds = courses.map(c => c._id);
  
  // Get total enrollments
  const totalEnrollments = await Enrollment.countDocuments({
    courseId: { $in: courseIds },
    status: "active"
  });
  
  // Get total revenue
  const revenue = await Purchase.aggregate([
    {
      $match: {
        courseId: { $in: courseIds },
        status: "completed"
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" }
      }
    }
  ]);
  
  // Get recent enrollments with course titles
  const recentEnrollments = await Enrollment.find({
    courseId: { $in: courseIds },
    status: "active"
  })
  .populate("courseId", "courseTitle")
  .sort({ enrolledAt: -1 })
  .limit(10);
  
  return {
    totalCourses: courses.length,
    totalEnrollments,
    totalRevenue: revenue[0]?.total || 0,
    recentEnrollments: recentEnrollments.map(e => ({
      courseTitle: e.courseId.courseTitle,
      planType: e.planType,
      enrolledAt: e.enrolledAt,
      userId: e.userId
    }))
  };
}

// ============================================
// RATING HELPERS
// ============================================

/**
 * Add or update rating
 */
export async function addCourseRating(userId, courseId, rating, review = "") {
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
  await updateCourseStats(courseId);
}

/**
 * Get course ratings with pagination
 */
export async function getCourseRatings(courseId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  const ratings = await Rating.find({
    courseId,
    status: "published"
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
  
  const total = await Rating.countDocuments({
    courseId,
    status: "published"
  });
  
  return {
    ratings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

// ============================================
// BACKWARD COMPATIBILITY
// ============================================

/**
 * Get course data with legacy format (for gradual migration)
 * This function returns data in the old format but fetches from new schema
 */
export async function getCourseDataLegacyFormat(courseId) {
  const course = await Course.findById(courseId);
  
  if (!course) return null;
  
  // Get enrollments
  const enrollments = await Enrollment.find({
    courseId,
    status: "active"
  });
  
  // Get ratings
  const ratings = await Rating.find({
    courseId,
    status: "published"
  });
  
  // Return in old format
  return {
    ...course.toObject(),
    enrolledStudents: enrollments.map(e => e.userId),
    courseRatings: ratings.map(r => ({
      userId: r.userId,
      rating: r.rating
    }))
  };
}
