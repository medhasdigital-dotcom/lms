import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    // User & Course Reference
    userId: { type: String, required: true, ref: "User" },
    courseId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true, 
      ref: "Course" 
    },
    
    // Rating Details
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, default: "" },
    
    // Verification
    isVerifiedPurchase: { type: Boolean, default: false },
    
    // Status
    status: { 
      type: String, 
      enum: ["pending", "published", "hidden"], 
      default: "published" 
    },
    
    // Helpful votes
    helpfulCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Indexes
ratingSchema.index({ courseId: 1, status: 1 });
ratingSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Static method: Get average rating for a course
ratingSchema.statics.getCourseRating = async function(courseId) {
  const result = await this.aggregate([
    {
      $match: {
        courseId: new mongoose.Types.ObjectId(courseId),
        status: "published"
      }
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 }
      }
    }
  ]);
  
  if (result.length === 0) {
    return { average: 0, count: 0 };
  }
  
  return {
    average: Math.round(result[0].avgRating * 10) / 10, // Round to 1 decimal
    count: result[0].count
  };
};

// Static method: Check if user has already rated
ratingSchema.statics.hasUserRated = async function(userId, courseId) {
  const rating = await this.findOne({ userId, courseId });
  return rating !== null;
};

const Rating = mongoose.model("Rating", ratingSchema);

export default Rating;
