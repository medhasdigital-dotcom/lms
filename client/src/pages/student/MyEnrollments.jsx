import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { Line } from "rc-progress";
import Footer from "../../components/student/Footer";
import axios from "axios";
import { toast } from "react-toastify";

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
              className="bg-white rounded-xl shadow-sm p-4 space-y-3"
            >
              <div className="flex gap-4">
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
                  className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm"
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
                  <th className="px-4 py-3 text-left">Duration</th>
                  <th className="px-4 py-3 text-left">Completed</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {enrolledCourses.map((course, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-4 flex gap-4">
                      <img
                        src={course.courseThumbnail}
                        alt={course.courseTitle}
                        className="w-24 rounded"
                      />
                      <div>
                        <p className="font-medium">
                          {course.courseTitle}
                        </p>
                        <Line
                          strokeWidth={2}
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
                        className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm"
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
