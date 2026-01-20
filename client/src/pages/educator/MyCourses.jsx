import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import Loading from "../../components/student/Loading";
import axios from "axios";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { 
  Edit3, Eye, EyeOff, MoreVertical, Users, DollarSign, 
  Calendar, TrendingUp, Search, Filter, Plus, Globe, Lock,
  ChevronDown, Trash2, Copy, BarChart3
} from "lucide-react";

const MyCourses = () => {
  const { currency, backendUrl, isEducator, getToken } = useContext(AppContext);

  const [courses, setCourses] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  const fetchEducatorCourses = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(backendUrl + "/api/educator/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });

      data.success && setCourses(data.courses);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const toggleCourseVisibility = async (courseId, currentStatus) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + "/api/educator/toggle-visibility",
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(`Course ${currentStatus ? 'hidden' : 'published'} successfully`);
        fetchEducatorCourses();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
    setOpenDropdown(null);
  };

  useEffect(() => {
    if (isEducator) {
      fetchEducatorCourses();
    }
  }, [isEducator]);

  // Filter and search courses
  const filteredCourses = courses?.filter(course => {
    const matchesSearch = course.courseTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || 
      (filterStatus === "public" && course.isPublished !== false) ||
      (filterStatus === "private" && course.isPublished === false);
    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const totalEarnings = courses?.reduce((acc, course) => {
    return acc + Math.floor(course.enrolledStudents.length * (course.coursePrice - (course.discount * course.coursePrice) / 100));
  }, 0) || 0;

  const totalStudents = courses?.reduce((acc, course) => acc + course.enrolledStudents.length, 0) || 0;

  return courses ? (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Courses</h1>
            <p className="text-gray-500 mt-1">Manage and track your course performance</p>
          </div>
          <Link 
            to="/educator/add-course"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-medium"
          >
            <Plus size={20} />
            Create New Course
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{courses.length}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Students</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{currency}{totalEarnings.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Avg. per Course</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {currency}{courses.length > 0 ? Math.floor(totalEarnings / courses.length).toLocaleString() : 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-3">
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none cursor-pointer"
                >
                  <option value="all">All Courses</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>

              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === "grid" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === "list" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Grid/List */}
        {filteredCourses && filteredCourses.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => {
                const earnings = Math.floor(
                  course.enrolledStudents.length *
                    (course.coursePrice - (course.discount * course.coursePrice) / 100)
                );
                const isPublic = course.isPublished !== false;

                return (
                  <div
                    key={course._id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={course.courseThumbnail}
                        alt={course.courseTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Status Badge */}
                      <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                        isPublic 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {isPublic ? <Globe size={12} /> : <Lock size={12} />}
                        {isPublic ? 'Public' : 'Private'}
                      </div>
                      
                      {/* Discount Badge */}
                      {course.discount > 0 && (
                        <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                          {course.discount}% OFF
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[48px]">
                        {course.courseTitle}
                      </h3>

                      {/* Stats Row */}
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1.5">
                          <Users size={14} />
                          <span>{course.enrolledStudents.length} students</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign size={14} />
                          <span>{currency}{earnings}</span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl font-bold text-gray-900">
                          {currency}{Math.floor(course.coursePrice - (course.discount * course.coursePrice) / 100)}
                        </span>
                        {course.discount > 0 && (
                          <span className="text-sm text-gray-400 line-through">
                            {currency}{course.coursePrice}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Link
                          to={`/educator/edit-course/${course._id}`}
                          className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2.5 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-sm"
                        >
                          <Edit3 size={16} />
                          Edit
                        </Link>
                        <button
                          onClick={() => toggleCourseVisibility(course._id, isPublic)}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                            isPublic
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {isPublic ? <EyeOff size={16} /> : <Eye size={16} />}
                          {isPublic ? 'Hide' : 'Publish'}
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === course._id ? null : course._id)}
                            className="p-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {/* Dropdown Menu */}
                          {openDropdown === course._id && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <Copy size={14} />
                                Duplicate Course
                              </button>
                              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <BarChart3 size={14} />
                                View Analytics
                              </button>
                              <hr className="my-2 border-gray-100" />
                              <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                <Trash2 size={14} />
                                Delete Course
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
                        <Calendar size={12} />
                        Created {new Date(course.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Students</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Earnings</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCourses.map((course) => {
                      const earnings = Math.floor(
                        course.enrolledStudents.length *
                          (course.coursePrice - (course.discount * course.coursePrice) / 100)
                      );
                      const isPublic = course.isPublished !== false;

                      return (
                        <tr key={course._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <img
                                src={course.courseThumbnail}
                                alt={course.courseTitle}
                                className="w-20 h-12 object-cover rounded-lg"
                              />
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate max-w-xs">{course.courseTitle}</p>
                                {course.discount > 0 && (
                                  <span className="text-xs text-red-500 font-medium">{course.discount}% discount</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                              isPublic 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {isPublic ? <Globe size={12} /> : <Lock size={12} />}
                              {isPublic ? 'Public' : 'Private'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Users size={14} />
                              {course.enrolledStudents.length}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-gray-900">{currency}{earnings.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {currency}{Math.floor(course.coursePrice - (course.discount * course.coursePrice) / 100)}
                              </span>
                              {course.discount > 0 && (
                                <span className="text-xs text-gray-400 line-through">{currency}{course.coursePrice}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-sm">
                            {new Date(course.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/educator/edit-course/${course._id}`}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Edit course"
                              >
                                <Edit3 size={18} />
                              </Link>
                              <button
                                onClick={() => toggleCourseVisibility(course._id, isPublic)}
                                className={`p-2 rounded-lg transition-colors ${
                                  isPublic
                                    ? 'text-gray-500 hover:bg-gray-100'
                                    : 'text-green-600 hover:bg-green-50'
                                }`}
                                title={isPublic ? 'Hide course' : 'Publish course'}
                              >
                                {isPublic ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                              <div className="relative">
                                <button
                                  onClick={() => setOpenDropdown(openDropdown === course._id ? null : course._id)}
                                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  <MoreVertical size={18} />
                                </button>
                                {openDropdown === course._id && (
                                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                      <Copy size={14} />
                                      Duplicate Course
                                    </button>
                                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                      <BarChart3 size={14} />
                                      View Analytics
                                    </button>
                                    <hr className="my-2 border-gray-100" />
                                    <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                      <Trash2 size={14} />
                                      Delete Course
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterStatus !== "all" 
                ? "Try adjusting your search or filter criteria" 
                : "Create your first course to get started"}
            </p>
            {!searchTerm && filterStatus === "all" && (
              <Link
                to="/educator/add-course"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-all font-medium"
              >
                <Plus size={20} />
                Create Your First Course
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {openDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setOpenDropdown(null)}
        />
      )}
    </div>
  ) : (
    <Loading />
  );
};

export default MyCourses;
