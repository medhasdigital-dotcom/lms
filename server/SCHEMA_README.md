# 🎓 LMS Schema Redesign - Production Ready

## 📋 Overview

This schema redesign transforms the LMS from a monolithic embedded document structure to a normalized, scalable architecture that can handle millions of users and thousands of courses.

## 🏗️ Architecture

### Before (Problematic)
```
Course Document
├── enrolledStudents: [userId1, userId2, ...] ❌ Grows infinitely
├── courseRatings: [{userId, rating}, ...] ❌ Bloats document
├── coursePrice, discount, premiumPrice ❌ Mixed concerns
└── courseContent: [chapters with lectures] ❌ Hard to query
```

### After (Scalable)
```
courses ────┐
            ├──→ enrollments (who has access)
            ├──→ course_plans (pricing tiers)
            ├──→ sections (curriculum structure)
            ├──→ lessons (individual content)
            ├──→ ratings (reviews)
            └──→ purchases (payment history)
```

---

## 📊 New Collections

### 1. `courses`
**Purpose**: Course metadata and content structure (NOT enrollments)

**Key Fields**:
- `courseTitle`, `courseDescription`, `courseThumbnail`
- `educator` (instructor ID)
- `status`: `draft` | `published` | `archived`
- `slug` (SEO-friendly URL)
- `stats` (denormalized counters updated by cron)

**Indexes**:
- `{ educator: 1, status: 1 }`
- `{ slug: 1 }` (unique)
- `{ "stats.totalEnrollments": -1 }`

---

### 2. `enrollments` ⭐ MOST IMPORTANT
**Purpose**: Source of truth for who has access to what

**Key Fields**:
- `userId`, `courseId`
- `planType`: `standard` | `premium`
- `status`: `active` | `expired` | `refunded` | `suspended`
- `purchaseId` (reference to purchase)
- `progress` (completed lessons, percentage)
- `upgradedFrom`, `upgradedAt` (for tracking upgrades)

**Indexes**:
- `{ userId: 1, courseId: 1 }` (unique)
- `{ courseId: 1, status: 1 }`
- `{ userId: 1, status: 1 }`

**Static Methods**:
- `hasAccess(userId, courseId)` → boolean
- `hasPremiumAccess(userId, courseId)` → boolean
- `getEnrollmentStats(courseId)` → { total, standard, premium }

---

### 3. `course_plans`
**Purpose**: Pricing tiers and discount management

**Key Fields**:
- `courseId`, `planType`
- `price` (in cents for precision)
- `discount` (type, value, validity dates)
- `features`, `premiumBenefits`
- `lessonAccessLevel`: `free` | `standard` | `premium`

**Indexes**:
- `{ courseId: 1, planType: 1 }` (unique)

**Instance Methods**:
- `getFinalPrice()` → calculated price after discounts

---

### 4. `sections`
**Purpose**: Course curriculum structure (chapters)

**Key Fields**:
- `courseId`, `sectionId`
- `title`, `learningObjective`
- `order`, `isPublished`

---

### 5. `lessons`
**Purpose**: Individual lecture content with access control

**Key Fields**:
- `courseId`, `sectionId`, `lectureId`
- `title`, `type` (video | article | quiz)
- `content` (videoUrl, duration, resources)
- `accessLevel`: `free` | `standard` | `premium` ⭐
- `isPreviewFree`, `order`

**Static Methods**:
- `canAccess(lessonId, userId)` → boolean

---

### 6. `ratings`
**Purpose**: Course reviews and ratings

**Key Fields**:
- `userId`, `courseId`
- `rating` (1-5), `review`
- `isVerifiedPurchase`, `status`
- `helpfulCount`

**Indexes**:
- `{ userId: 1, courseId: 1 }` (unique - one rating per user)

**Static Methods**:
- `getCourseRating(courseId)` → { average, count }

---

### 7. `purchases`
**Purpose**: Payment history and transaction tracking

**Key Fields**:
- `userId`, `courseId`, `planType`
- `amount`, `originalPrice`, `discount`
- `stripeSessionId`, `stripePaymentIntentId`
- `status`: `pending` | `completed` | `failed` | `refunded`
- `isUpgrade`, `upgradedFrom`
- `metadata` (ip, userAgent, referrer)

**Indexes**:
- `{ stripeSessionId: 1 }` (unique)
- `{ userId: 1, createdAt: -1 }`

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Backup Your Database
```bash
mongodump --uri="mongodb://localhost:27017/lms" --out=./backup
```

### 3. Run Migration
```bash
node migrate-schema.js
```

This will:
- Create `enrollments` from `course.enrolledStudents` arrays
- Create `course_plans` from pricing fields
- Create `sections` and `lessons` from `courseContent`
- Create `ratings` from `course.courseRatings` arrays
- Update course stats

### 4. Verify Migration
Check the output for:
- Number of enrollments created
- Number of course plans created
- Number of sections/lessons migrated
- No errors

---

## 📖 Usage Examples

### Check if User Has Access
```javascript
import Enrollment from "./models/Enrollment.js";

const hasAccess = await Enrollment.hasAccess(userId, courseId);
const hasPremium = await Enrollment.hasPremiumAccess(userId, courseId);
```

### Enroll User After Purchase
```javascript
import { createEnrollment } from "./utils/schemaHelpers.js";

await createEnrollment(userId, courseId, "premium", purchaseId);
```

### Get Course Pricing
```javascript
import { getCoursePricing } from "./utils/schemaHelpers.js";

const pricing = await getCoursePricing(courseId);
// { standard: { price: 4999, finalPrice: 3999, ... }, premium: { ... } }
```

### Calculate Upgrade Price
```javascript
import { calculateUpgradePrice } from "./utils/schemaHelpers.js";

const upgradePrice = await calculateUpgradePrice(courseId);
// Returns price difference (premium - standard)
```

### Update Course Stats (Background Job)
```javascript
import { updateCourseStats } from "./utils/schemaHelpers.js";

await updateCourseStats(courseId);
// Updates: totalEnrollments, averageRating, totalRevenue
```

---

## 🔄 Gradual Migration Strategy

### Phase 1: Dual-Mode (Current State)
- New models created ✅
- Legacy fields preserved in Course model
- Both systems work in parallel
- **Action**: Test new schema with read operations

### Phase 2: Write to Both
- New enrollments → create Enrollment document
- Also push to `course.enrolledStudents` (for safety)
- **Action**: Update purchase flow to use both

### Phase 3: Read from New Schema
- Switch all queries to use Enrollment model
- Keep writing to both systems
- **Action**: Update all controllers

### Phase 4: Remove Legacy Fields
- Stop writing to `course.enrolledStudents`
- Remove legacy fields from schema
- **Action**: Clean up code

---

## 📝 Controller Updates Required

### Files to Update:
1. `userController.js`
   - ✏️ `purchaseCourse` - create Enrollment after payment
   - ✏️ `getUserEnrolledCourses` - read from Enrollment
   - ✏️ `upgradeToPremium` - use upgradeEnrollment helper

2. `educatorController.js`
   - ✏️ `educatorDashboard` - use getEducatorStats helper
   - ✏️ `getEnrolledStudentsData` - read from Enrollment

3. `courseController.js`
   - ✏️ `getCourseData` - add enrollment check
   - ✏️ `addUserRating` - use Rating model

### Example: Update purchaseCourse
```javascript
// OLD
await Course.findByIdAndUpdate(courseId, {
  $push: { enrolledStudents: userId }
});

// NEW
import { createEnrollment } from "../utils/schemaHelpers.js";

await createEnrollment(userId, courseId, planType, purchase._id);
```

---

## 🎯 Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Scalability** | Limited by document size (16MB) | Unlimited enrollments |
| **Query Speed** | Scan entire course document | Indexed enrollment queries |
| **Pricing** | Hard-coded in course | Flexible plans with time-based discounts |
| **Access Control** | Binary (enrolled or not) | Granular (free/standard/premium per lesson) |
| **Upgrades** | Not supported | Built-in upgrade tracking |
| **Analytics** | Manual aggregation | Pre-computed stats |
| **Audit Trail** | Minimal | Complete purchase history |

---

## 🔧 Maintenance

### Background Job (Run Hourly)
```javascript
import { updateCourseStats } from "./utils/schemaHelpers.js";
import Course from "./models/Course.js";

const courses = await Course.find({ status: "published" });

for (const course of courses) {
  await updateCourseStats(course._id);
}
```

Add to `crons.js`:
```javascript
import cron from "node-cron";

// Update course stats every hour
cron.schedule("0 * * * *", async () => {
  console.log("Updating course stats...");
  await updateAllCourseStats();
});
```

---

## 🐛 Troubleshooting

### Migration fails with "Duplicate key error"
- Solution: Delete existing enrollments/plans and re-run

### Stats not updating
- Solution: Manually run `updateCourseStats(courseId)`

### Old queries still reading `enrolledStudents`
- Solution: Search codebase for `.enrolledStudents` and update

---

## 📚 Further Reading

- See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed controller updates
- See [schemaHelpers.js](./utils/schemaHelpers.js) for reusable functions
- See [migrate-schema.js](./migrate-schema.js) for migration logic

---

## ✅ Checklist

- [ ] Backup database
- [ ] Run migration script
- [ ] Verify enrollments created correctly
- [ ] Update purchaseCourse to create Enrollment
- [ ] Update enrollment queries to use Enrollment model
- [ ] Update dashboard to use getEducatorStats
- [ ] Test enrollment flow end-to-end
- [ ] Test upgrade flow
- [ ] Set up background job for stats updates
- [ ] Remove legacy fields after confirmation

---

## 🎉 Result

A production-ready LMS schema that scales to millions of users, supports flexible pricing, enables granular access control, and provides complete audit trails for all transactions.
