import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    // User & Course Reference
    userId: { type: String, required: true, ref: "User" },
    courseId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Course" },
    
    // Plan Type
    planType: { 
      type: String, 
      enum: ["standard", "premium"], 
      default: "standard",
      required: true 
    },
    
    // Purchase Reference
    purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase" },
    
    // Status
    status: { 
      type: String, 
      enum: ["active", "expired", "refunded", "suspended"], 
      default: "active",
      required: true 
    },
    
    // Access Control
    enrolledAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null }, // null = lifetime access
    
    // Progress Tracking (denormalized for performance)
    progress: {
      completedLessons: [{ type: String }], // Array of lesson IDs
      lastAccessedLesson: { type: String },
      progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
      lastAccessedAt: { type: Date }
    },
    
    // Upgrade Tracking
    upgradedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment" },
    upgradedAt: { type: Date }
  },
  { timestamps: true }
);

// Indexes for performance
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ courseId: 1, status: 1 });
enrollmentSchema.index({ userId: 1, status: 1 });
enrollmentSchema.index({ courseId: 1, planType: 1, status: 1 });

// Static method: Check if user has access to course
enrollmentSchema.statics.hasAccess = async function(userId, courseId) {
  const enrollment = await this.findOne({
    userId,
    courseId,
    status: "active"
  });
  return enrollment !== null;
};

// Static method: Check if user has premium access
enrollmentSchema.statics.hasPremiumAccess = async function(userId, courseId) {
  const enrollment = await this.findOne({
    userId,
    courseId,
    status: "active",
    planType: "premium"
  });
  return enrollment !== null;
};

// Static method: Get enrollment counts by plan
enrollmentSchema.statics.getEnrollmentStats = async function(courseId) {
  const stats = await this.aggregate([
    {
      $match: {
        courseId: new mongoose.Types.ObjectId(courseId),
        status: "active"
      }
    },
    {
      $group: {
        _id: "$planType",
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    total: 0,
    standard: 0,
    premium: 0
  };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });
  
  return result;
};

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

export default Enrollment;
