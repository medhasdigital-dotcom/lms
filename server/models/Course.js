import mongoose from "mongoose";

// Embedded schemas for backward compatibility during migration
const lectureSchema = new mongoose.Schema(
  {
    lectureId: { type: String, required: true },
    lectureTitle: { type: String, required: true },
    lectureDuration: { type: Number, required: true },
    lectureUrl: { type: String, required: true },
    lectureContent: { type: String, default: "" },
    lectureType: { type: String, default: "video" },
    isPreviewFree: { type: Boolean, required: true },
    lectureOrder: { type: Number, required: true },
  },
  { _id: false }
);

const chapterSchema = new mongoose.Schema(
  {
    chapterId: { type: String, required: true },
    chapterOrder: { type: Number, required: true },
    chapterTitle: { type: String, required: true },
    learningObjective: { type: String, default: "" },
    chapterContent: [lectureSchema],
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    // Basic Info
    courseTitle: { type: String, required: true },
    courseDescription: { type: String, required: true },
    courseThumbnail: { type: String },
    slug: { type: String, unique: true, sparse: true }, // SEO-friendly URL
    
    // Instructor
    educator: { type: String, ref: "User", required: true },
    
    // Lifecycle Management (replaced isPublished + status with single field)
    status: { 
      type: String, 
      enum: ["draft", "published", "archived"], 
      default: "draft" 
    },
    
    // Legacy pricing fields (keep for backward compatibility during migration)
    coursePrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    pricingTier: { type: String, enum: ["standard", "premium"], default: "standard" },
    premiumPrice: { type: Number, default: 0 },
    premiumDiscount: { type: Number, default: 0, min: 0, max: 100 },
    premiumFeatures: [{ type: String }],
    
    // Content (embedded for now, will migrate to separate collections)
    courseContent: [chapterSchema],
    
    // Legacy fields (deprecated - use separate collections)
    courseRatings: [
      { userId: { type: String }, rating: { type: Number, min: 1, max: 5 } },
    ],
    enrolledStudents: [{ type: String, ref: "User" }],
    
    // Category & Tags
    category: { type: String, default: "Uncategorized" },
    tags: [{ type: String }],
    level: { 
      type: String, 
      enum: ["beginner", "intermediate", "advanced"], 
      default: "beginner" 
    },
    language: { type: String, default: "en" },
    
    // Stats (denormalized for performance - updated via cron/events)
    stats: {
      totalEnrollments: { type: Number, default: 0 },
      standardEnrollments: { type: Number, default: 0 },
      premiumEnrollments: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      totalRatings: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 } // In cents
    },
    
    // Publishing date
    publishedAt: { type: Date }
  },
  { timestamps: true, minimize: false }
);

// Indexes for performance
courseSchema.index({ educator: 1, status: 1 });
courseSchema.index({ slug: 1 });
courseSchema.index({ status: 1, category: 1 });
courseSchema.index({ "stats.totalEnrollments": -1 });

// Pre-save hook to generate slug from title
courseSchema.pre("save", function(next) {
  if (this.isModified("courseTitle") && !this.slug) {
    this.slug = this.courseTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  
  // Normalize status (handle old DRAFT/PUBLISHED format)
  if (this.status === "DRAFT") {
    this.status = "draft";
  } else if (this.status === "PUBLISHED") {
    this.status = "published";
  }
  
  // Update publishedAt when status changes to published
  if (this.isModified("status") && this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

const Course = mongoose.model("Course", courseSchema);

export default Course;
