import express from "express";
import {
  addCourse,
  educatorDashboard,
  getEducatorCourses,
  getCourse,
  updateCourse,
  getDraftCourses,
  deleteCourse,
  publishCourse,
  getEnrolledStudentsData,
  updateRoleToEducator,
} from "../controllers/educatorController.js";
import upload from "../configs/multer.js";
import { protectEducator } from "../middlewares/authMiddleware.js";

const educatorRouter = express.Router();

// Add Educator Role
educatorRouter.get("/update-role", updateRoleToEducator);
educatorRouter.post(
  "/add-course",
  upload.single("image"),
  protectEducator,
  addCourse
);
educatorRouter.get("/courses", protectEducator, getEducatorCourses);
educatorRouter.get("/course/:courseId", protectEducator, getCourse);
educatorRouter.put(
  "/update-course/:courseId",
  upload.single("image"),
  protectEducator,
  updateCourse
);
educatorRouter.get("/drafts", protectEducator, getDraftCourses);
educatorRouter.delete("/course/:courseId", protectEducator, deleteCourse);
educatorRouter.put("/course/:courseId/publish", protectEducator, publishCourse);
educatorRouter.get("/dashboard", protectEducator, educatorDashboard);
educatorRouter.get(
  "/enrolled-students",
  protectEducator,
  getEnrolledStudentsData
);

export default educatorRouter;
