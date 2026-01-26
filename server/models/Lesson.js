import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    // References
    courseId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true, 
      ref: "Course" 
    },
    sectionId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true, 
      ref: "Section" 
    },
    
    // Lesson Details
    lectureId: { type: String, required: true }, // For frontend compatibility
    title: { type: String, required: true },
    type: { 
      type: String, 
      enum: ["video", "article", "quiz", "assignment"], 
      default: "video" 
    },
    
    // Content
    content: {
      videoUrl: { type: String },
      duration: { type: Number, default: 0 }, // In seconds
      lectureContent: { type: String }, // Article content or description
      resources: [
        {
          name: { type: String },
          url: { type: String }
        }
      ]
    },
    
    // Access Control (CRITICAL FOR PLAN LOGIC)
    accessLevel: { 
      type: String, 
      enum: ["free", "standard", "premium"], 
      default: "standard",
      required: true
    },
    
    // Preview
    isPreviewFree: { type: Boolean, default: false },
    
    // Order
    order: { type: Number, required: true },
    
    // Status
    isPublished: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Indexes
lessonSchema.index({ courseId: 1, sectionId: 1, order: 1 });
lessonSchema.index({ courseId: 1, accessLevel: 1 });
lessonSchema.index({ lectureId: 1 });

// Static method: Check if user can access lesson
lessonSchema.statics.canAccess = async function(lessonId, userId) {
  const lesson = await this.findById(lessonId);
  
  if (!lesson) return false;
  
  // Free lessons are accessible to everyone
  if (lesson.accessLevel === "free" || lesson.isPreviewFree) {
    return true;
  }
  
  // Check enrollment
  const Enrollment = mongoose.model("Enrollment");
  const enrollment = await Enrollment.findOne({
    userId,
    courseId: lesson.courseId,
    status: "active"
  });
  
  if (!enrollment) return false;
  
  // Standard users can access standard lessons
  if (lesson.accessLevel === "standard") return true;
  
  // Premium lessons require premium access
  if (lesson.accessLevel === "premium" && enrollment.planType === "premium") {
    return true;
  }
  
  return false;
};

// Static method: Get all lessons for a section
lessonSchema.statics.getSectionLessons = async function(sectionId) {
  return await this.find({ 
    sectionId,
    isPublished: true 
  }).sort({ order: 1 });
};

const Lesson = mongoose.model("Lesson", lessonSchema);

export default Lesson;
