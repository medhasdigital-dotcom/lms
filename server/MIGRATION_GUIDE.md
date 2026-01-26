# Schema Migration Guide - Controller Updates

## 🎯 Quick Reference: How to Use New Models

### 1. Checking if User is Enrolled

**OLD WAY:**
```javascript
const course = await Course.findById(courseId);
const isEnrolled = course.enrolledStudents.includes(userId);
```

**NEW WAY:**
```javascript
import Enrollment from "../models/Enrollment.js";

const isEnrolled = await Enrollment.hasAccess(userId, courseId);
const hasPremium = await Enrollment.hasPremiumAccess(userId, courseId);
```

---

### 2. Enrolling a User (After Purchase)

**OLD WAY:**
```javascript
await Course.findByIdAndUpdate(courseId, {
  $push: { enrolledStudents: userId }
});
```

**NEW WAY:**
```javascript
import Enrollment from "../models/Enrollment.js";

await Enrollment.create({
  userId,
  courseId,
  planType: planType, // "standard" or "premium"
  purchaseId: purchase._id,
  status: "active",
  enrolledAt: new Date(),
  expiresAt: null, // null = lifetime
  progress: {
    completedLessons: [],
    progressPercentage: 0
  }
});
```

---

### 3. Getting User's Enrolled Courses

**OLD WAY:**
```javascript
const courses = await Course.find({
  enrolledStudents: userId
});
```

**NEW WAY:**
```javascript
import Enrollment from "../models/Enrollment.js";

const enrollments = await Enrollment.find({
  userId,
  status: "active"
}).populate("courseId");

const courses = enrollments.map(e => ({
  ...e.courseId._doc,
  planType: e.planType,
  progress: e.progress,
  enrolledAt: e.enrolledAt
}));
```

---

### 4. Counting Enrolled Students

**OLD WAY:**
```javascript
const course = await Course.findById(courseId);
const count = course.enrolledStudents.length;
```

**NEW WAY:**
```javascript
import Enrollment from "../models/Enrollment.js";

const stats = await Enrollment.getEnrollmentStats(courseId);
// Returns: { total: 1247, standard: 980, premium: 267 }
```

---

### 5. Adding a Rating

**OLD WAY:**
```javascript
await Course.findByIdAndUpdate(courseId, {
  $push: { courseRatings: { userId, rating: 5 } }
});
```

**NEW WAY:**
```javascript
import Rating from "../models/Rating.js";

await Rating.create({
  userId,
  courseId,
  rating: 5,
  review: "Great course!",
  isVerifiedPurchase: true,
  status: "published"
});

// Update course stats
const ratingStats = await Rating.getCourseRating(courseId);
await Course.findByIdAndUpdate(courseId, {
  $set: {
    "stats.averageRating": ratingStats.average,
    "stats.totalRatings": ratingStats.count
  }
});
```

---

### 6. Getting Course with Pricing

**OLD WAY:**
```javascript
const course = await Course.findById(courseId);
const price = course.coursePrice;
const finalPrice = price - (price * course.discount / 100);
```

**NEW WAY:**
```javascript
import CoursePlan from "../models/CoursePlan.js";

const course = await Course.findById(courseId);
const plans = await CoursePlan.getActivePlans(courseId);

const standardPlan = plans.find(p => p.planType === "standard");
const premiumPlan = plans.find(p => p.planType === "premium");

const standardPrice = standardPlan.getFinalPrice(); // In cents
const premiumPrice = premiumPlan?.getFinalPrice(); // In cents
```

---

### 7. Upgrading from Standard to Premium

**NEW:**
```javascript
import Enrollment from "../models/Enrollment.js";
import { Purchase } from "../models/Purchase.js";

// Find current enrollment
const enrollment = await Enrollment.findOne({
  userId,
  courseId,
  status: "active"
});

if (enrollment.planType === "standard") {
  // Calculate upgrade price
  const standardPlan = await CoursePlan.findOne({ courseId, planType: "standard" });
  const premiumPlan = await CoursePlan.findOne({ courseId, planType: "premium" });
  
  const upgradePrice = premiumPlan.getFinalPrice() - standardPlan.getFinalPrice();
  
  // Create upgrade purchase
  const purchase = await Purchase.create({
    userId,
    courseId,
    amount: upgradePrice,
    planType: "premium",
    isUpgrade: true,
    upgradedFrom: enrollment.purchaseId,
    status: "pending"
  });
  
  // After Stripe payment success:
  enrollment.planType = "premium";
  enrollment.upgradedFrom = enrollment._id;
  enrollment.upgradedAt = new Date();
  await enrollment.save();
}
```

---

### 8. Checking Lesson Access

**NEW:**
```javascript
import Lesson from "../models/Lesson.js";

const canAccess = await Lesson.canAccess(lessonId, userId);

if (!canAccess) {
  return res.status(403).json({ 
    success: false, 
    message: "Premium access required" 
  });
}
```

---

## 🔄 Background Jobs (Run Hourly/Daily)

### Update Course Stats

```javascript
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Rating from "../models/Rating.js";
import { Purchase } from "../models/Purchase.js";

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
}

// Run for all published courses
export async function updateAllCourseStats() {
  const courses = await Course.find({ status: "published" });
  
  for (const course of courses) {
    await updateCourseStats(course._id);
  }
  
  console.log(`Updated stats for ${courses.length} courses`);
}
```

---

## 📝 Key Controllers to Update

### Files that need changes:
- `userController.js` - purchaseCourse, getUserEnrolledCourses, upgradeToPremium
- `educatorController.js` - educatorDashboard, getEnrolledStudentsData
- `courseController.js` - getCourseData (add enrollment check)

### Import statements to add:
```javascript
import Enrollment from "../models/Enrollment.js";
import CoursePlan from "../models/CoursePlan.js";
import Rating from "../models/Rating.js";
import Section from "../models/Section.js";
import Lesson from "../models/Lesson.js";
```

---

## ⚠️ Migration Steps

1. **Backup Database**
   ```bash
   mongodump --uri="mongodb://localhost:27017/lms" --out=./backup
   ```

2. **Run Migration Script**
   ```bash
   cd server
   node migrate-schema.js
   ```

3. **Test New Schema**
   - Verify enrollments created
   - Check course stats
   - Test enrollment queries

4. **Update Controllers** (gradually)
   - Start with read operations
   - Then update write operations
   - Keep legacy fields until fully tested

5. **Remove Legacy Fields** (after confirmation)
   - Remove `enrolledStudents` from Course model
   - Remove `courseRatings` from Course model
   - Remove `coursePrice`, `discount` from Course model

---

## 🚀 Benefits After Migration

✅ Enrollments scale to millions without course document bloat
✅ Fast indexed queries for user enrollments
✅ Proper upgrade tracking (standard → premium)
✅ Lesson-level access control
✅ Flexible pricing with time-based discounts
✅ Complete purchase audit trail
✅ Separated concerns (content, pricing, enrollments)
