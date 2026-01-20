import { clerkClient } from "@clerk/express";
import Course from "../models/Course.js";
import { v2 as cloudinary } from "cloudinary";
import { Purchase } from "../models/Purchase.js";
import User from "../models/User.js";

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

    if (!imageFile) {
      return res.json({ success: false, message: "Thumbnail not attached" });
    }

    // Parse JSON safely
    let parsedCourseData;
    try {
      parsedCourseData = JSON.parse(courseData);
    } catch (err) {
      return res.json({ success: false, message: "Invalid course data format" });
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

    // Upload thumbnail first
    const imageUpload = await cloudinary.uploader.upload(imageFile.path);

    parsedCourseData.courseThumbnail = imageUpload.secure_url;
    console.log(JSON.stringify(parsedCourseData, null, 2));
    // Create course
    await Course.create(parsedCourseData);

    res.json({ success: true, message: "Course added successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// Get Educator Courses
export const getEducatorCourses = async (req, res) => {
  try {
    const educator = req.auth.userId;
    const courses = await Course.find({ educator });
    res.json({ success: true, courses });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get Educator Dashboard Data (Total Earning, Enrolled Students, No. of Courses)
export const educatorDashboard = async (req, res) => {
  try {
    const educator = req.auth.userId;
    const courses = await Course.find({ educator });
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

    // Collect unique enrolled student IDs with their course titles
    const enrolledStudentsData = [];
    for (const course of courses) {
      const students = await User.find(
        {
          _id: { $in: course.enrolledStudents },
        },
        "name imageUrl"
      );

      students.forEach((student) => {
        enrolledStudentsData.push({
          courseTitle: course.courseTitle,
          student,
        });
      });
    }

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

// Get Enrolled Studentd Data with Purchase Data
export const getEnrolledStudentsData = async (req, res) => {
  try {
    const educator = req.auth.userId;
    const courses = await Course.find({ educator });
    const courseIds = courses.map((course) => course._id);

    const purchases = await Purchase.find({
      courseId: { $in: courseIds },
      status: "completed",
    })
      .populate("userId", "name imageUrl")
      .populate("courseId", "courseTitle");

    const enrolledStudents = purchases.map((purchase) => ({
      student: purchase.userId,
      courseTitle: purchase.courseId.courseTitle,
      purchaseDate: purchase.createdAt,
    }));

    res.json({ success: true, enrolledStudents });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
