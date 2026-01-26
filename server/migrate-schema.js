import mongoose from "mongoose";
import Course from "./models/Course.js";
import Enrollment from "./models/Enrollment.js";
import CoursePlan from "./models/CoursePlan.js";
import Section from "./models/Section.js";
import Lesson from "./models/Lesson.js";
import Rating from "./models/Rating.js";
import { Purchase } from "./models/Purchase.js";

/**
 * Migration Script: Old Schema → New Schema
 * 
 * This script migrates from the old embedded schema to the new normalized schema.
 * Run this ONCE after deploying the new models.
 * 
 * IMPORTANT: Backup your database before running this script!
 * 
 * Usage:
 *   node migrate-schema.js
 */

async function migrateData() {
  try {
    console.log("🚀 Starting schema migration...\n");
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/lms");
    console.log("✅ Connected to MongoDB\n");
    
    // Get all courses
    const courses = await Course.find({});
    console.log(`📚 Found ${courses.length} courses to migrate\n`);
    
    for (const course of courses) {
      console.log(`\n📖 Migrating course: ${course.courseTitle}`);
      
      // 1. Create Course Plans
      console.log("  💰 Creating pricing plans...");
      
      // Standard plan
      const standardPlan = await CoursePlan.findOne({ 
        courseId: course._id, 
        planType: "standard" 
      });
      
      if (!standardPlan) {
        await CoursePlan.create({
          courseId: course._id,
          planType: "standard",
          price: Math.round(course.coursePrice * 100), // Convert to cents
          currency: "USD",
          discount: {
            type: "percentage",
            value: course.discount || 0
          },
          features: ["lifetime_access", "certificate", "mobile_access"],
          lessonAccessLevel: "standard",
          isActive: true
        });
        console.log("    ✅ Standard plan created");
      }
      
      // Premium plan (if exists)
      if (course.premiumPrice && course.premiumPrice > 0) {
        const premiumPlan = await CoursePlan.findOne({ 
          courseId: course._id, 
          planType: "premium" 
        });
        
        if (!premiumPlan) {
          await CoursePlan.create({
            courseId: course._id,
            planType: "premium",
            price: Math.round(course.premiumPrice * 100), // Convert to cents
            currency: "USD",
            discount: {
              type: "percentage",
              value: course.premiumDiscount || 0
            },
            features: ["lifetime_access", "certificate", "mobile_access"],
            premiumBenefits: course.premiumFeatures || [
              "1-on-1 Mentorship Sessions",
              "Personal Code Reviews",
              "Priority Support"
            ],
            lessonAccessLevel: "premium",
            isActive: true
          });
          console.log("    ✅ Premium plan created");
        }
      }
      
      // 2. Migrate Enrollments
      if (course.enrolledStudents && course.enrolledStudents.length > 0) {
        console.log(`  👥 Migrating ${course.enrolledStudents.length} enrollments...`);
        
        for (const userId of course.enrolledStudents) {
          // Check if enrollment already exists
          const existingEnrollment = await Enrollment.findOne({
            userId,
            courseId: course._id
          });
          
          if (!existingEnrollment) {
            await Enrollment.create({
              userId,
              courseId: course._id,
              planType: "standard", // Default to standard
              status: "active",
              enrolledAt: course.createdAt,
              expiresAt: null, // Lifetime access
              progress: {
                completedLessons: [],
                progressPercentage: 0
              }
            });
          }
        }
        console.log(`    ✅ ${course.enrolledStudents.length} enrollments created`);
      }
      
      // 3. Migrate Ratings
      if (course.courseRatings && course.courseRatings.length > 0) {
        console.log(`  ⭐ Migrating ${course.courseRatings.length} ratings...`);
        
        for (const rating of course.courseRatings) {
          // Check if rating already exists
          const existingRating = await Rating.findOne({
            userId: rating.userId,
            courseId: course._id
          });
          
          if (!existingRating) {
            await Rating.create({
              userId: rating.userId,
              courseId: course._id,
              rating: rating.rating,
              review: "",
              isVerifiedPurchase: true,
              status: "published"
            });
          }
        }
        console.log(`    ✅ ${course.courseRatings.length} ratings created`);
      }
      
      // 4. Migrate Sections and Lessons
      if (course.courseContent && course.courseContent.length > 0) {
        console.log(`  📑 Migrating ${course.courseContent.length} sections...`);
        
        for (const chapter of course.courseContent) {
          // Check if section already exists
          let section = await Section.findOne({
            courseId: course._id,
            sectionId: chapter.chapterId
          });
          
          if (!section) {
            section = await Section.create({
              courseId: course._id,
              sectionId: chapter.chapterId,
              title: chapter.chapterTitle,
              learningObjective: chapter.learningObjective || "",
              order: chapter.chapterOrder,
              isPublished: true
            });
          }
          
          // Migrate lectures
          if (chapter.chapterContent && chapter.chapterContent.length > 0) {
            for (const lecture of chapter.chapterContent) {
              // Check if lesson already exists
              const existingLesson = await Lesson.findOne({
                courseId: course._id,
                lectureId: lecture.lectureId
              });
              
              if (!existingLesson) {
                await Lesson.create({
                  courseId: course._id,
                  sectionId: section._id,
                  lectureId: lecture.lectureId,
                  title: lecture.lectureTitle,
                  type: lecture.lectureType || "video",
                  content: {
                    videoUrl: lecture.lectureUrl,
                    duration: lecture.lectureDuration * 60, // Convert to seconds
                    lectureContent: lecture.lectureContent || ""
                  },
                  accessLevel: "standard", // Default access
                  isPreviewFree: lecture.isPreviewFree,
                  order: lecture.lectureOrder,
                  isPublished: true
                });
              }
            }
          }
        }
        console.log(`    ✅ Sections and lessons migrated`);
      }
      
      // 5. Update Course Stats
      console.log("  📊 Calculating course stats...");
      const enrollmentStats = await Enrollment.getEnrollmentStats(course._id);
      const ratingStats = await Rating.getCourseRating(course._id);
      
      await Course.findByIdAndUpdate(course._id, {
        $set: {
          "stats.totalEnrollments": enrollmentStats.total,
          "stats.standardEnrollments": enrollmentStats.standard,
          "stats.premiumEnrollments": enrollmentStats.premium,
          "stats.averageRating": ratingStats.average,
          "stats.totalRatings": ratingStats.count,
          status: course.status === "DRAFT" ? "draft" : "published"
        }
      });
      console.log("    ✅ Stats updated");
      
      console.log(`✅ Course "${course.courseTitle}" migrated successfully!`);
    }
    
    console.log("\n\n🎉 Migration completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`  • Courses: ${courses.length}`);
    console.log(`  • Enrollments: ${await Enrollment.countDocuments()}`);
    console.log(`  • Course Plans: ${await CoursePlan.countDocuments()}`);
    console.log(`  • Sections: ${await Section.countDocuments()}`);
    console.log(`  • Lessons: ${await Lesson.countDocuments()}`);
    console.log(`  • Ratings: ${await Rating.countDocuments()}`);
    
    console.log("\n⚠️  NEXT STEPS:");
    console.log("  1. Test the new schema with your application");
    console.log("  2. Update controllers to use Enrollment.find() instead of course.enrolledStudents");
    console.log("  3. Update purchase flow to create Enrollment documents");
    console.log("  4. Once confirmed working, you can remove legacy fields from Course model");
    console.log("     (enrolledStudents, courseRatings, coursePrice, discount, etc.)");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

// Run migration
migrateData();
