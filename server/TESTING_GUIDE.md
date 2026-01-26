# 🚀 Quick Start - Testing the New Schema

## Prerequisites

✅ MongoDB running
✅ Server and client dependencies installed
✅ Environment variables configured

## Step-by-Step Testing

### 1. Backup Your Database (IMPORTANT!)

```bash
mongodump --uri="mongodb://localhost:27017/lms" --out=./backup-$(date +%Y%m%d)
```

### 2. Run Migration Script

```bash
cd server
node migrate-schema.js
```

**Expected Output:**
```
🚀 Starting schema migration...
✅ Connected to MongoDB

📚 Found X courses to migrate

📖 Migrating course: Course Name
  💰 Creating pricing plans...
    ✅ Standard plan created
    ✅ Premium plan created (if applicable)
  👥 Migrating X enrollments...
    ✅ X enrollments created
  ⭐ Migrating X ratings...
    ✅ X ratings created
  📑 Migrating X sections...
    ✅ Sections and lessons migrated
  📊 Calculating course stats...
    ✅ Stats updated
✅ Course "Course Name" migrated successfully!

🎉 Migration completed successfully!

📊 Summary:
  • Courses: X
  • Enrollments: X
  • Course Plans: X
  • Sections: X
  • Lessons: X
  • Ratings: X
```

### 3. Start the Server

```bash
cd server
npm start
```

Should see:
```
Server is running on port 5000
MongoDB Connected
```

### 4. Start the Client

```bash
cd client
npm run dev
```

### 5. Test User Flow

#### Test 1: View Courses
1. Open http://localhost:5173
2. Browse courses
3. **Verify:** All courses display correctly

#### Test 2: Purchase Course (Standard)
1. Login as a student
2. Click on a course
3. Select "Standard Plan"
4. Click "Enroll Now"
5. Complete Stripe checkout
6. **Verify:** 
   - Redirected to My Enrollments
   - Course appears in list
   - Shows "Standard Access" badge

#### Test 3: Check Backend Data
```javascript
// In MongoDB Compass or CLI
use lms

// Check enrollment was created
db.enrollments.find({ userId: "YOUR_USER_ID" }).pretty()

// Should show:
{
  userId: "user_xxx",
  courseId: ObjectId("xxx"),
  planType: "standard",
  status: "active",
  enrolledAt: ISODate("..."),
  progress: {
    completedLessons: [],
    progressPercentage: 0
  }
}
```

#### Test 4: Upgrade to Premium
1. Go to course details page (already enrolled)
2. **Verify:** See "Upgrade to Premium" banner
3. Click "Upgrade Now"
4. Complete Stripe checkout
5. **Verify:**
   - Course shows "Premium Access" badge
   - Upgrade price was correct (difference between plans)

#### Test 5: Check Upgrade in Database
```javascript
// Check enrollment was updated
db.enrollments.find({ userId: "YOUR_USER_ID" }).pretty()

// Should show:
{
  planType: "premium",  // Changed from "standard"
  upgradedFrom: ObjectId("..."),
  upgradedAt: ISODate("...")
}
```

#### Test 6: Educator Dashboard
1. Login as educator
2. Go to Dashboard
3. **Verify:**
   - Total enrollments count correct
   - Shows both standard and premium enrollments
   - Revenue displayed correctly
   - Student list shows plan types

#### Test 7: Add Rating
1. As enrolled student
2. Go to course details
3. Add a 5-star rating
4. **Verify:**
   - Rating saved successfully
   - Course average rating updated
   - Rating appears in database

```javascript
// Check rating was created
db.ratings.find({ userId: "YOUR_USER_ID" }).pretty()

// Check course stats updated
db.courses.find({ _id: ObjectId("COURSE_ID") }, { stats: 1 }).pretty()
```

### 6. Test Error Cases

#### Test: Cannot enroll twice
1. Try to purchase an already-enrolled course
2. **Verify:** Gets "Continue Learning" button instead

#### Test: Cannot upgrade if already premium
1. Try to upgrade when already have premium
2. **Verify:** Doesn't show upgrade banner

#### Test: Educator cannot see own courses as student
1. Educator tries to enroll in their own course
2. **Verify:** Appropriate handling (depends on business logic)

### 7. Verify Stats Accuracy

```javascript
// Manual verification in MongoDB
use lms

// 1. Count actual enrollments
db.enrollments.aggregate([
  { $match: { courseId: ObjectId("COURSE_ID"), status: "active" } },
  { $group: { _id: "$planType", count: { $sum: 1 } } }
])

// 2. Compare with course.stats
db.courses.findOne(
  { _id: ObjectId("COURSE_ID") },
  { "stats.totalEnrollments": 1, "stats.standardEnrollments": 1, "stats.premiumEnrollments": 1 }
)

// Numbers should match!
```

### 8. Test Backward Compatibility

```javascript
// Verify legacy arrays still populated
db.courses.findOne(
  { _id: ObjectId("COURSE_ID") },
  { enrolledStudents: 1 }
)

db.users.findOne(
  { _id: "USER_ID" },
  { enrolledCourses: 1, premiumCourses: 1 }
)

// These should still contain data during transition
```

## 🐛 Common Issues & Solutions

### Issue: Migration fails with "Duplicate key error"
**Cause:** Enrollment already exists
**Solution:**
```javascript
// Clear enrollments and re-run
db.enrollments.deleteMany({})
db.course_plans.deleteMany({})
db.ratings.deleteMany({})
// Then re-run: node migrate-schema.js
```

### Issue: "Course not found" after migration
**Cause:** Status field mismatch
**Solution:** Check Course.status
```javascript
// Update all courses to lowercase status
db.courses.updateMany(
  { status: "PUBLISHED" },
  { $set: { status: "published" } }
)
db.courses.updateMany(
  { status: "DRAFT" },
  { $set: { status: "draft" } }
)
```

### Issue: Enrollments not showing
**Cause:** User._id vs userId mismatch
**Solution:** Check Enrollment.userId format
```javascript
// Should be string (Clerk user ID), not ObjectId
db.enrollments.find().limit(1).pretty()
// Verify userId is string like "user_xxx"
```

### Issue: Stats showing 0
**Cause:** Stats not calculated
**Solution:** Manually update stats
```javascript
// In Node.js console
const { updateCourseStats } = require('./utils/schemaHelpers.js');
await updateCourseStats('COURSE_ID');
```

## ✅ Success Criteria

Your migration is successful if:

- ✅ Existing users can see their enrolled courses
- ✅ New purchases create Enrollment documents
- ✅ Upgrades work correctly (standard → premium)
- ✅ Educator dashboard shows accurate data
- ✅ Ratings display correctly
- ✅ Course stats match actual enrollment counts
- ✅ No errors in server console
- ✅ Stripe webhooks process successfully

## 📊 Monitoring

### Check Logs
```bash
# Server logs
cd server
npm start | grep -E "(Enrollment|Rating|CoursePlan)"

# Webhook logs
# Check Stripe Dashboard → Webhooks for delivery status
```

### Database Queries for Monitoring

```javascript
// 1. Total enrollments
db.enrollments.countDocuments({ status: "active" })

// 2. Premium vs Standard ratio
db.enrollments.aggregate([
  { $match: { status: "active" } },
  { $group: { _id: "$planType", count: { $sum: 1 } } }
])

// 3. Recent enrollments
db.enrollments.find().sort({ enrolledAt: -1 }).limit(10).pretty()

// 4. Upgrade rate
db.enrollments.countDocuments({ upgradedFrom: { $ne: null } })

// 5. Courses with most enrollments
db.courses.find().sort({ "stats.totalEnrollments": -1 }).limit(5)
```

## 🎉 Next Steps After Testing

Once everything works:

1. ✅ Deploy to staging
2. ✅ Test on staging with real data
3. ✅ Monitor for 1-2 days
4. ✅ Deploy to production
5. ✅ Set up cron job for stats updates
6. ⏰ Plan to remove legacy fields (Phase 2 - after 30 days)

---

**Questions or issues?** Check:
- [CHANGES_APPLIED.md](./CHANGES_APPLIED.md) - What was changed
- [SCHEMA_README.md](./SCHEMA_README.md) - Architecture overview
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Detailed examples
