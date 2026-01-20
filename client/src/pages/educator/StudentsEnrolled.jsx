import React, { useContext, useEffect, useState } from "react";
import Loading from "../../components/student/Loading";
import { AppContext } from "../../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { 
  Users, Search, Filter, ChevronDown, Mail, Calendar, 
  BookOpen, Clock, MoreVertical, ExternalLink, User,
  TrendingUp, DollarSign, Award, Eye, X, Copy, Check
} from "lucide-react";

const StudentsEnrolled = () => {
  const { backendUrl, getToken, isEducator, currency } = useContext(AppContext);
  const [enrolledStudents, setEnrolledStudents] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchEnrolledStudents = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(
        backendUrl + "/api/educator/enrolled-students",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        setEnrolledStudents(data.enrolledStudents.reverse());
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (isEducator) {
      fetchEnrolledStudents();
    }
  }, [isEducator]);

  // Get unique courses for filter
  const uniqueCourses = enrolledStudents 
    ? [...new Set(enrolledStudents.map(item => item.courseTitle))]
    : [];

  // Filter students
  const filteredStudents = enrolledStudents?.filter(item => {
    if (!item.student) return false;
    const matchesSearch = 
      item.student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = filterCourse === "all" || item.courseTitle === filterCourse;
    return matchesSearch && matchesCourse;
  });

  // Get unique students count
  const uniqueStudentsCount = enrolledStudents 
    ? new Set(enrolledStudents.filter(item => item.student).map(item => item.student._id)).size 
    : 0;

  // Copy to clipboard
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time ago
  const timeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return enrolledStudents ? (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Students Enrolled</h1>
          <p className="text-gray-500 mt-1">View and manage your enrolled students</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Enrollments</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{enrolledStudents.length}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Unique Students</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{uniqueStudentsCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Courses Enrolled</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{uniqueCourses.length}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">This Week</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {enrolledStudents.filter(item => {
                    const daysDiff = (new Date() - new Date(item.purchaseDate)) / (1000 * 60 * 60 * 24);
                    return daysDiff <= 7;
                  }).length}
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
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              />
            </div>

            {/* Filter by Course */}
            <div className="relative min-w-[200px]">
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none cursor-pointer"
              >
                <option value="all">All Courses</option>
                {uniqueCourses.map((course, idx) => (
                  <option key={idx} value={course}>{course}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Students Table */}
        {filteredStudents && filteredStudents.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Enrolled</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={item.student.imageUrl}
                              alt={item.student.name}
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.student.name}</p>
                            <p className="text-xs text-gray-500 md:hidden">{item.student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{item.student.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium max-w-[200px] truncate">
                          <BookOpen className="w-3 h-3 mr-1.5 flex-shrink-0" />
                          {item.courseTitle}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900">{formatDate(item.purchaseDate)}</span>
                          <span className="text-xs text-gray-500">{timeAgo(item.purchaseDate)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedStudent(item)}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye size={18} />
                          </button>
                          <a
                            href={`mailto:${item.student.email}`}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Send email"
                          >
                            <Mail size={18} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Info */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing <span className="font-medium text-gray-900">{filteredStudents.length}</span> of{' '}
                <span className="font-medium text-gray-900">{enrolledStudents.length}</span> enrollments
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-500">
              {searchTerm || filterCourse !== "all" 
                ? "Try adjusting your search or filter criteria" 
                : "Students will appear here once they enroll in your courses"}
            </p>
          </div>
        )}

        {/* Student Detail Modal */}
        {selectedStudent && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setSelectedStudent(null)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="relative bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-t-2xl">
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedStudent.student.imageUrl}
                      alt={selectedStudent.student.name}
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-white/30 shadow-lg"
                    />
                    <div className="text-white">
                      <h2 className="text-xl font-bold">{selectedStudent.student.name}</h2>
                      <p className="text-white/80 text-sm">{selectedStudent.student.email}</p>
                    </div>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-5">
                  {/* Student ID */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Student ID</p>
                        <p className="text-sm font-mono text-gray-700 break-all">{selectedStudent.student._id}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(selectedStudent.student._id, 'id')}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        {copiedId === 'id' ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Mail size={14} />
                        <span className="text-xs font-medium uppercase tracking-wider">Email</span>
                      </div>
                      <p className="text-sm text-gray-900 font-medium truncate">{selectedStudent.student.email}</p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Calendar size={14} />
                        <span className="text-xs font-medium uppercase tracking-wider">Enrolled</span>
                      </div>
                      <p className="text-sm text-gray-900 font-medium">{formatDate(selectedStudent.purchaseDate)}</p>
                    </div>
                  </div>

                  {/* Course Enrolled */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                    <div className="flex items-center gap-2 text-indigo-600 mb-2">
                      <BookOpen size={14} />
                      <span className="text-xs font-medium uppercase tracking-wider">Course Enrolled</span>
                    </div>
                    <p className="text-gray-900 font-semibold">{selectedStudent.courseTitle}</p>
                  </div>

                  {/* Account Created */}
                  {selectedStudent.student.createdAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Account Created</span>
                      <span className="text-gray-900 font-medium">
                        {formatDate(selectedStudent.student.createdAt)}
                      </span>
                    </div>
                  )}

                  {/* Last Active */}
                  {selectedStudent.student.updatedAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Last Active</span>
                      <span className="text-gray-900 font-medium">
                        {timeAgo(selectedStudent.student.updatedAt)}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <a
                      href={`mailto:${selectedStudent.student.email}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                    >
                      <Mail size={18} />
                      Send Email
                    </a>
                    <button
                      onClick={() => copyToClipboard(selectedStudent.student.email, 'email')}
                      className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                    >
                      {copiedId === 'email' ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                      Copy Email
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default StudentsEnrolled;
