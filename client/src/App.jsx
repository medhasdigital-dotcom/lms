import React, { useContext, useEffect } from "react";
import { Route, Routes, useMatch, Navigate, useNavigate, useLocation } from "react-router-dom";
import Home from "./pages/student/Home";
import CoursesList from "./pages/student/CoursesList";
import CourseDetails from "./pages/student/CourseDetails";
import MyEnrollments from "./pages/student/MyEnrollments";
import Player from "./pages/student/Player";
import Loading from "./components/student/Loading";
import Educator from "./pages/educator/Educator";
import Dashboard from "./pages/educator/Dashboard";
import AddCourse from "./pages/educator/AddCourse";
import MyCourses from "./pages/educator/MyCourses";
import StudentsEnrolled from "./pages/educator/StudentsEnrolled";
import Navbar from "./components/student/Navbar";
import NotFound from "./pages/NotFound";
import "quill/dist/quill.snow.css";
import { ToastContainer } from "react-toastify";
import About from "./pages/student/About";
import Contact from "./pages/student/Contact";
import { AppContext } from "./context/AppContext";

const App = () => {
  const { isEducator, isEducatorLoading } = useContext(AppContext);
  // educators should be allowed to navigate student pages too;
  // keep route protection but do not force-redirect on login
  // so remove automatic navigation here.
  const location = useLocation();

  // Check if the current route is a Player route OR an Educator route
  const isPlayerRoute = location.pathname.startsWith('/player');
  const isEducatorRoute = location.pathname.startsWith('/educator');

  // Show loading while checking educator status for educator routes
  if (isEducatorRoute && isEducatorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-default min-h-screen bg-white">
      <ToastContainer />
      {!isPlayerRoute && !isEducatorRoute && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/course-list" element={<CoursesList />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/course-list/:input" element={<CoursesList />} />
        <Route path="/course/:id" element={<CourseDetails />} />
        <Route path="/my-enrollments" element={<MyEnrollments />} />
        <Route path="/player/:courseId" element={<Player />} />
        <Route path="/loading/:path" element={<Loading />} />
        <Route
          path="/educator"
          element={isEducator ? <Educator /> : <Navigate to="/" replace />}
        >
          <Route path="/educator" element={<Dashboard />} />
          <Route path="add-course" element={<AddCourse />} />
          <Route path="my-courses" element={<MyCourses />} />
          <Route path="student-enrolled" element={<StudentsEnrolled />} />
        </Route>
        
        {/* 404 Catch-all Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default App;
