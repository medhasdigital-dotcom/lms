import { clerkClient } from "@clerk/express";
import Course from "../models/Course.js";
import { v2 as cloudinary } from "cloudinary";
import { Purchase } from "../models/Purchase.js";
import User from "../models/User.js";
import Enrollment from "../models/Enrollment.js";

// Update role to educator
export const updateRoleToEducator = async (req, res) => {
  try {
    const userId = req.auth.userId;

    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: "educator",
      },
    });

    res.json({ success: true, message: "You can publish a course now" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Add New Course
export const addCourse = async (req, res) => {
  try {
    console.log(req.body)
    const { courseData } = req.body;
    const imageFile = req.file;
    const educatorId = req.auth.userId;

    if (!courseData) {
      return res.json({ success: false, message: "Course data missing" });
    }

    // Parse JSON safely
    let parsedCourseData;
    try {
      parsedCourseData = JSON.parse(courseData);
    } catch (err) {
      return res.json({ success: false, message: "Invalid course data format" });
    }

    // Check if it's a draft - drafts don't require thumbnail
    const isDraft = parsedCourseData.status === "DRAFT" || parsedCourseData.status === "draft";
    
    if (!isDraft && !imageFile) {
      return res.json({ success: false, message: "Thumbnail not attached" });
    }

    // 🔥 Normalize lectureDuration (string → number)
    parsedCourseData.courseContent?.forEach(chapter => {
      chapter.chapterContent?.forEach(lecture => {
        lecture.lectureDuration = Number(lecture.lectureDuration);
      });
    });
// "[{"chapterId":"mkm1910z",
// "chapterTitle":"ve expend and colapse",
// "learningObjective":"",
// "chapterContent":[
// {"lectureId","lectureTitle","lectureDuration","lectureUrl","lectureContent":"ach lecture. and section ","lectureType":"article","isPreviewFree":false,"isExpanded":false},{"lectureId":"mkm19717","lectureTitle":" button in each l","lectureDuration":0,"lectureUrl":" button in e","lectureContent":"","lectureType":"video","isPreviewFree":false,"isExpanded":false}],"collapsed":false},{"chapterId":"mkm15e8u","chapterTitle":"in "Curriculum","learningObjective":"","chapterContent":[{"lectureId":"mkm1611k","lectureTitle":"lecture creation. and","lectureDuration":0,"lectureUrl":" also give expend and colapse button in each lecture. and section ","lectureContent":" also gi","lectureType":"video","isPreviewFree":false,"isExpanded":false},{"lectureId":"mkm15jro","lectureTitle":"" tab when add new lectu","lectureDuration":0,"lectureUrl":"re then it will forget in at new ","lectureContent":"","lectureType":"video","isPreviewFree":false,"isExpanded":false}],"collapsed":false}]"
    // Attach educator
    parsedCourseData.educator = educatorId;

    // Upload thumbnail if provided
    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path);
      parsedCourseData.courseThumbnail = imageUpload.secure_url;
    }
    
    console.log(JSON.stringify(parsedCourseData, null, 2));
    // Create course
    await Course.create(parsedCourseData);

    res.json({ success: true, message: "Course added successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// Get Educator Courses (Published only)
export const getEducatorCourses = async (req, res) => {
  try {
    const educator = req.auth.userId;
    const courses = await Course.find({ 
      educator, 
      status: { $in: ["published", "PUBLISHED"] } // Support both formats
    });
    res.json({ success: true, courses });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get Single Course for Editing
export const getCourse = async (req, res) => {
  try {
    const educator = req.auth.userId;
    const { courseId } = req.params;
    
    const course = await Course.findOne({ _id: courseId, educator });
    
    if (!course) {
      return res.json({ success: false, message: "Course not found or unauthorized" });
    }
    
    res.json({ success: true, course });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Update Course
export const updateCourse = async (req, res) => {
  try {
    const { courseData } = req.body;
    const imageFile = req.file;
    const educatorId = req.auth.userId;
    const { courseId } = req.params;

    if (!courseData) {
      return res.json({ success: false, message: "Course data missing" });
    }

    // Find existing course
    const existingCourse = await Course.findOne({ _id: courseId, educator: educatorId });
    
    if (!existingCourse) {
      return res.json({ success: false, message: "Course not found or unauthorized" });
    }

    // Parse JSON safely
    let parsedCourseData;
    try {
      parsedCourseData = JSON.parse(courseData);
    } catch (err) {
      return res.json({ success: false, message: "Invalid course data format" });
    }

    // Check if it's a draft - drafts don't require thumbnail
    const isDraft = parsedCourseData.status === "DRAFT" || parsedCourseData.status === "draft";
    
    if (!isDraft && !imageFile && !existingCourse.courseThumbnail) {
      return res.json({ success: false, message: "Thumbnail required for published courses" });
    }

    // 🔥 Normalize lectureDuration (string → number)
    parsedCourseData.courseContent?.forEach(chapter => {
      chapter.chapterContent?.forEach(lecture => {
        lecture.lectureDuration = Number(lecture.lectureDuration);
      });
    });

    // Upload new thumbnail if provided
    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path);
      parsedCourseData.courseThumbnail = imageUpload.secure_url;
    }
    
    console.log("Updating course:", JSON.stringify(parsedCourseData, null, 2));
    
    // Update course
    await Course.findByIdAndUpdate(courseId, parsedCourseData);

    res.json({ success: true, message: isDraft ? "Draft updated successfully" : "Course updated successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Educator Draft Courses
export const getDraftCourses = async (req, res) => {
  try {
    const educator = req.auth.userId;
    const drafts = await Course.find({ 
      educator, 
      status: { $in: ["draft", "DRAFT"] } // Support both formats
    }).sort({ updatedAt: -1 });
    res.json({ success: true, drafts });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Delete Course
export const deleteCourse = async (req, res) => {
  try {
    const educator = req.auth.userId;
    const { courseId } = req.params;
    
    const course = await Course.findOne({ _id: courseId, educator });
    
    if (!course) {
      return res.json({ success: false, message: "Course not found or unauthorized" });
    }
    
    await Course.findByIdAndDelete(courseId);
    res.json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Publish Draft Course
export const publishCourse = async (req, res) => {
  try {
    const educator = req.auth.userId;
    const { courseId } = req.params;
    
    const course = await Course.findOne({ _id: courseId, educator });
    
    if (!course) {
      return res.json({ success: false, message: "Course not found or unauthorized" });
    }
    
    if (!course.courseThumbnail) {
      return res.json({ success: false, message: "Please upload a thumbnail before publishing" });
    }
    
    course.status = "published"; // Use lowercase
    await course.save();
    
    res.json({ success: true, message: "Course published successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get Educator Dashboard Data (Total Earning, Enrolled Students, No. of Courses)
export const educatorDashboard = async (req, res) => {
  try {
    const educator = req.auth.userId;
    const courses = await Course.find({ educator, status: { $ne: "draft" } });
    const totalCourses = courses.length;

    const courseIds = courses.map((course) => course._id);

    // Calculate total earnings from purchases
    const purchases = await Purchase.find({
      courseId: { $in: courseIds },
      status: "completed",
    });

    const totalEarnings = purchases.reduce(
      (sum, purchase) => sum + purchase.amount,
      0
    );

    // Get enrollments from Enrollment model
    const enrollments = await Enrollment.find({
      courseId: { $in: courseIds },
      status: "active"
    })
    .populate("courseId", "courseTitle")
    .populate({
      path: "userId",
      model: "User",
      select: "name imageUrl"
    })
    .sort({ enrolledAt: -1 });

    // Collect unique enrolled student data
    const enrolledStudentsData = enrollments.map(enrollment => ({
      courseTitle: enrollment.courseId.courseTitle,
      student: enrollment.userId,
      planType: enrollment.planType,
      enrolledAt: enrollment.enrolledAt
    }));

    res.json({
      success: true,
      dashboardData: {
        totalEarnings,
        enrolledStudentsData,
        totalCourses,
      },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get Enrolled Students Data with Purchase Data
export const getEnrolledStudentsData = async (req, res) => {
  try {
    const educator = req.auth.userId;
    const courses = await Course.find({ educator });
    const courseIds = courses.map((course) => course._id);

    // Get enrollments with user and course details
    const enrollments = await Enrollment.find({
      courseId: { $in: courseIds },
      status: "active"
    })
    .populate({
      path: "userId",
      model: "User",
      select: "name imageUrl"
    })
    .populate("courseId", "courseTitle")
    .sort({ enrolledAt: -1 });

    const enrolledStudents = enrollments.map((enrollment) => ({
      student: enrollment.userId,
      courseTitle: enrollment.courseId.courseTitle,
      purchaseDate: enrollment.enrolledAt,
      planType: enrollment.planType,
      progress: enrollment.progress
    }));

    res.json({ success: true, enrolledStudents });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
