import mongoose from "mongoose";

const coursePlanSchema = new mongoose.Schema(
  {
    // Course Reference
    courseId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true, 
      ref: "Course" 
    },
    
    // Plan Details
    planType: { 
      type: String, 
      enum: ["standard", "premium"], 
      required: true 
    },
    
    // Pricing (stored in cents for precision)
    price: { type: Number, required: true, min: 0 }, // In cents (e.g., 4999 = $49.99)
    currency: { type: String, default: "USD" },
    
    // Discounts
    discount: {
      type: { 
        type: String, 
        enum: ["percentage", "fixed"], 
        default: "percentage" 
      },
      value: { type: Number, default: 0, min: 0 },
      validFrom: { type: Date },
      validUntil: { type: Date }
    },
    
    // Access Rules
    features: [{ type: String }], // e.g., ["lifetime_access", "certificate", "mobile_access"]
    
    // Premium-specific features
    premiumBenefits: [{ type: String }], // e.g., ["1-on-1 mentorship", "Code reviews"]
    
    // Lesson Access Control
    lessonAccessLevel: { 
      type: String, 
      enum: ["free", "standard", "premium"], 
      default: "standard" 
    },
    
    // Status
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Indexes
coursePlanSchema.index({ courseId: 1, planType: 1 }, { unique: true });
coursePlanSchema.index({ isActive: 1 });

// Static method: Get active plans for a course
coursePlanSchema.statics.getActivePlans = async function(courseId) {
  return await this.find({
    courseId,
    isActive: true
  }).sort({ planType: 1 }); // standard first, then premium
};

// Static method: Get final price after discount
coursePlanSchema.methods.getFinalPrice = function() {
  if (!this.discount || this.discount.value === 0) {
    return this.price;
  }
  
  const now = new Date();
  
  // Check if discount is valid
  if (this.discount.validFrom && now < this.discount.validFrom) {
    return this.price;
  }
  if (this.discount.validUntil && now > this.discount.validUntil) {
    return this.price;
  }
  
  // Calculate discount
  if (this.discount.type === "percentage") {
    return Math.round(this.price - (this.price * this.discount.value / 100));
  } else {
    return Math.max(0, this.price - this.discount.value);
  }
};

const CoursePlan = mongoose.model("CoursePlan", coursePlanSchema);

export default CoursePlan;
