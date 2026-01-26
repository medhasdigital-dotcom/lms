import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    // Course Reference
    courseId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true, 
      ref: "Course" 
    },
    
    // Section Details
    sectionId: { type: String, required: true }, // For frontend compatibility (chapterId)
    title: { type: String, required: true },
    learningObjective: { type: String, default: "" },
    
    // Order
    order: { type: Number, required: true },
    
    // Visibility
    isPublished: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Indexes
sectionSchema.index({ courseId: 1, order: 1 });
sectionSchema.index({ courseId: 1, sectionId: 1 }, { unique: true });

// Static method: Get all sections for a course
sectionSchema.statics.getCourseSections = async function(courseId) {
  return await this.find({ 
    courseId,
    isPublished: true 
  }).sort({ order: 1 });
};

const Section = mongoose.model("Section", sectionSchema);

export default Section;
