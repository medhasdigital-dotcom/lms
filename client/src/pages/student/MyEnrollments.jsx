import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { Line } from "rc-progress";
import Footer from "../../components/student/Footer";
import axios from "axios";
import { toast } from "react-toastify";
import { Crown, BookOpen } from "lucide-react";

const MyEnrollments = () => {
  const {
    enrolledCourses,
    calculateCourseDuration,
    navigate,
    userData,
    fetchUserEnrolledCourses,
    backendUrl,
    getToken,
    calculateNoOfLectures,
  } = useContext(AppContext);

  const [progressArray, setProgressArray] = useState([]);

  // Check if course has premium access
  const isPremiumCourse = (courseId) => {
    return userData?.premiumCourses?.includes(courseId);
  };

  const getCourseProgress = async () => {
    try {
      const token = await getToken();
      const tempProgressArray = await Promise.all(
        enrolledCourses.map(async (course) => {
          const { data } = await axios.post(
            `${backendUrl}/api/user/get-course-progress`,
            { courseId: course._id },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const totalLectures = calculateNoOfLectures(course);
          const lectureCompleted = data.progressData
            ? data.progressData.lectureCompleted.length
            : 0;

          return { totalLectures, lectureCompleted };
        })
      );
      setProgressArray(tempProgressArray);
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (userData) fetchUserEnrolledCourses();
  }, [userData]);

  useEffect(() => {
    if (enrolledCourses.length > 0) getCourseProgress();
  }, [enrolledCourses]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-cyan-50 via-white to-cyan-100">
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-16">
        <h1 className="text-2xl font-semibold mb-8">
          My Enrollments
        </h1>

        {/* EMPTY STATE */}
        {enrolledCourses.length === 0 && (
          <div className="w-full py-20 flex flex-col items-center text-gray-700">
            <p className="text-xl font-semibold">No enrollments yet</p>
            <p className="mt-2 text-sm text-center max-w-sm">
              You haven’t enrolled in any courses yet.
            </p>
            <button
              onClick={() => navigate("/course-list")}
              className="mt-6 px-5 py-2 bg-blue-600 text-white rounded-md"
            >
              Browse Courses
            </button>
          </div>
        )}

        {/* MOBILE CARDS */}
        <div className="md:hidden space-y-4">
          {enrolledCourses.map((course, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl shadow-sm p-4 space-y-3 relative overflow-hidden ${isPremiumCourse(course._id) ? 'border border-amber-200' : ''}`}
            >
              {/* Premium/Standard Badge */}
              {isPremiumCourse(course._id) ? (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                  <Crown size={10} /> PREMIUM
                </div>
              ) : (
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                  <BookOpen size={10} /> STANDARD
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <img
                  src={course.courseThumbnail}
                  alt={course.courseTitle}
                  className="w-20 h-16 object-cover rounded"
                />

                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    {course.courseTitle}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {calculateCourseDuration(course)}
                  </p>
                </div>
              </div>

              <Line
                strokeWidth={2}
                strokeColor={isPremiumCourse(course._id) ? "#f59e0b" : "#2563eb"}
                percent={
                  progressArray[index]
                    ? (progressArray[index].lectureCompleted * 100) /
                      progressArray[index].totalLectures
                    : 0
                }
                className="bg-gray-200 rounded-full"
              />

              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>
                  {progressArray[index] &&
                    `${progressArray[index].lectureCompleted}/${progressArray[index].totalLectures}`}{" "}
                  lectures
                </span>

                <button
                  onClick={() => navigate("/player/" + course._id)}
                  className={`px-4 py-1.5 text-white rounded text-sm ${isPremiumCourse(course._id) ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-blue-600'}`}
                >
                  {progressArray[index] &&
                  progressArray[index].lectureCompleted /
                    progressArray[index].totalLectures ===
                    1
                    ? "Completed"
                    : "Continue"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* DESKTOP TABLE */}
        {enrolledCourses.length > 0 && (
          <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow-sm">
            <table className="w-full table-auto">
              <thead className="border-b text-sm text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">Course</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Duration</th>
                  <th className="px-4 py-3 text-left">Completed</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {enrolledCourses.map((course, index) => (
                  <tr key={index} className={`border-b ${isPremiumCourse(course._id) ? 'bg-gradient-to-r from-amber-50/50 to-transparent' : ''}`}>
                    <td className="px-4 py-4 flex gap-4">
                      <div className="relative">
                        <img
                          src={course.courseThumbnail}
                          alt={course.courseTitle}
                          className={`w-24 rounded ${isPremiumCourse(course._id) ? 'ring-2 ring-amber-400' : ''}`}
                        />
                      </div>
                      <div>
                        <p className="font-medium">
                          {course.courseTitle}
                        </p>
                        <Line
                          strokeWidth={2}
                          strokeColor={isPremiumCourse(course._id) ? "#f59e0b" : "#2563eb"}
                          percent={
                            progressArray[index]
                              ? (progressArray[index].lectureCompleted * 100) /
                                progressArray[index].totalLectures
                              : 0
                          }
                          className="bg-gray-200 rounded-full mt-2"
                        />
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {isPremiumCourse(course._id) ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
                          <Crown size={12} /> Premium
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          <BookOpen size={12} /> Standard
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {calculateCourseDuration(course)}
                    </td>

                    <td className="px-4 py-4">
                      {progressArray[index] &&
                        `${progressArray[index].lectureCompleted}/${progressArray[index].totalLectures}`}{" "}
                      lectures
                    </td>

                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => navigate("/player/" + course._id)}
                        className={`px-5 py-2 text-white rounded-md text-sm ${isPremiumCourse(course._id) ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                        {progressArray[index] &&
                        progressArray[index].lectureCompleted /
                          progressArray[index].totalLectures ===
                          1
                          ? "Completed"
                          : "Continue"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MyEnrollments;
