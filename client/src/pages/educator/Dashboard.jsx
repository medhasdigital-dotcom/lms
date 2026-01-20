import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets"; // Keeping your assets
import Loading from "../../components/student/Loading";
import axios from "axios";
import { toast } from "react-toastify";
// I recommend installing lucide-react for modern icons: npm i lucide-react
import { Users, BookOpen, DollarSign, TrendingUp } from "lucide-react"; 

const Dashboard = () => {
  const { currency, backendUrl, getToken, isEducator } = useContext(AppContext);
  const [dashboardData, setDashboardData] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(backendUrl + "/api/educator/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setDashboardData(data.dashboardData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (isEducator) {
      fetchDashboardData();
    }
  }, [isEducator]);

  if (!dashboardData) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-gray-900">Educator Dashboard</h1>
            <p className="text-gray-500 text-sm">Overview of your courses and student performance</p>
        </div>

        {/* Stats Grid - Using Grid instead of Flex for better structural integrity */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            icon={<Users className="w-6 h-6 text-blue-600" />}
            value={dashboardData.enrolledStudentsData.length}
            label="Total Enrollments"
            bgColor="bg-blue-50"
          />
          <StatCard 
            icon={<BookOpen className="w-6 h-6 text-indigo-600" />}
            value={dashboardData.totalCourses}
            label="Active Courses"
            bgColor="bg-indigo-50"
          />
          <StatCard 
            icon={<DollarSign className="w-6 h-6 text-green-600" />}
            value={`${currency}${dashboardData.totalEarnings}`}
            label="Total Earnings"
            bgColor="bg-green-50"
          />
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              Latest Enrollments
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium hidden sm:table-cell w-16">#</th>
                  <th className="px-6 py-4 font-medium">Student</th>
                  <th className="px-6 py-4 font-medium">Course Title</th>
                  <th className="px-6 py-4 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dashboardData.enrolledStudentsData.length > 0 ? (
                  dashboardData.enrolledStudentsData.map((item, index) => (
                    <tr 
                      key={index} 
                      className="hover:bg-gray-50 transition-colors duration-150 group"
                    >
                      <td className="px-6 py-4 text-gray-400 text-sm hidden sm:table-cell group-hover:text-gray-600">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.student.imageUrl}
                            alt={item.student.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{item.student.name}</p>
                            {/* Assuming email might be available, creates density */}
                            <p className="text-xs text-gray-400">Student</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {item.courseTitle}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-500">
                        {/* Placeholder for date if available, otherwise generic "Just now" */}
                        Just now
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                      No enrollments found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Component for cleaner code
const StatCard = ({ icon, value, label, bgColor }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`p-3 rounded-lg ${bgColor}`}>
       {/* If you don't use Lucide, put your <img src={assets...} /> here */}
       {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-500">{label}</p>
    </div>
  </div>
);

export default Dashboard;