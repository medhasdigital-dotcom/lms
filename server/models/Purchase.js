import mongoose from "mongoose";

const PurchaseSchema = new mongoose.Schema(
  {
    // User & Course
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    userId: { type: String, ref: "User", required: true },
    
    // Payment Details
    amount: { type: Number, required: true }, // Final amount paid (in cents)
    currency: { type: String, default: "USD" },
    originalPrice: { type: Number }, // Price before discounts
    discount: { type: Number, default: 0 }, // Amount discounted
    
    // Plan Type
    planType: {
      type: String,
      enum: ["standard", "premium"],
      default: "standard",
    },
    
    // Payment Provider
    stripeSessionId: { type: String, unique: true, sparse: true },
    stripePaymentIntentId: { type: String },
    paymentMethod: { type: String, default: "card" },
    
    // Status
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    
    // Special Cases
    isUpgrade: { type: Boolean, default: false }, // true if upgrading standard → premium
    upgradedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase" }, // Previous purchase if upgrade
    
    // Metadata
    metadata: {
      ip: { type: String },
      userAgent: { type: String },
      referrer: { type: String }
    },
    
    // Timestamps
    completedAt: { type: Date },
    refundedAt: { type: Date }
  },
  { timestamps: true }
);

// Indexes
PurchaseSchema.index({ userId: 1, createdAt: -1 });
PurchaseSchema.index({ courseId: 1, status: 1 });
PurchaseSchema.index({ stripeSessionId: 1 });
PurchaseSchema.index({ status: 1 });

export const Purchase = mongoose.model("Purchase", PurchaseSchema);
