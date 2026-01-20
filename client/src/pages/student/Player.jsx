import React, { useContext, useEffect, useState, useRef } from "react";
import { AppContext } from "../../context/AppContext";
import { useParams, Link } from "react-router-dom";
import { assets } from "../../assets/assets";
import humanizeDuration from "humanize-duration";
import YouTube from "react-youtube";
import Footer from "../../components/student/Footer";
import Rating from "../../components/student/Rating";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../../components/student/Loading";
import { 
  Play, CheckCircle, ChevronDown, ChevronUp, FileText, 
  MessageCircle, Star, Info, X, ChevronRight, ChevronLeft,
  Share2, MoreVertical, Trophy // Added new icons
} from "lucide-react";

const Player = () => {
  const {
    enrolledCourses,
    calculateChapterTime,
    backendUrl,
    getToken,
    userData,
    fetchUserEnrolledCourses,
  } = useContext(AppContext);
  const { courseId } = useParams();
  
  const [courseData, setCourseData] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [playerData, setPlayerData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [initialRating, setInitialRating] = useState(0);
  
  // UI States
  const [activeTab, setActiveTab] = useState("overview"); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 

  // --- MOBILE-OPTIMIZED DRAG LOGIC ---
  const [dragPosition, setDragPosition] = useState({ top: "50%" });
  const isDragging = useRef(false);
  const dragStartY = useRef(0);

  const handleDragStart = (clientY) => {
    isDragging.current = false;
    dragStartY.current = clientY;
  };

  const handleDragMove = (clientY) => {
    const moveY = Math.abs(clientY - dragStartY.current);
    if (moveY > 5) {
        isDragging.current = true;
        const newTopPercent = (clientY / window.innerHeight) * 100;
        const clampedTop = Math.min(Math.max(newTopPercent, 10), 90);
        setDragPosition({ top: `${clampedTop}%` });
    }
  };

  const handleDragEnd = () => {
     if (!isDragging.current) {
        setIsSidebarOpen(prev => !prev);
     }
     isDragging.current = false;
  };

  const onMouseDown = (e) => {
      e.preventDefault();
      handleDragStart(e.clientY);
      const onMouseMove = (moveEvent) => handleDragMove(moveEvent.clientY);
      const onMouseUp = () => {
          handleDragEnd();
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
  };

  const onTouchStart = (e) => {
      handleDragStart(e.touches[0].clientY);
  };

  const onTouchMove = (e) => {
      if (e.cancelable) e.preventDefault(); 
      handleDragMove(e.touches[0].clientY);
  };

  const onTouchEnd = (e) => {
      handleDragEnd();
  };
  // -----------------------------

  const getCourseData = () => {
    enrolledCourses.map((course) => {
      if (course._id === courseId) {
        setCourseData(course);
        course.courseRatings.map((item) => {
          if (item.userId === userData._id) {
            setInitialRating(item.rating);
          }
        });
      }
    });
  };

  const toggleSection = (index) => {
    setOpenSections((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  useEffect(() => {
    if (enrolledCourses.length > 0) {
      getCourseData();
    }
  }, [enrolledCourses]);

  const markLectureAsCompleted = async (lectureId) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + "/api/user/update-course-progress",
        { courseId, lectureId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        getCourseProgress();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getCourseProgress = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + "/api/user/get-course-progress",
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setProgressData(data.progressData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRate = async (rating) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + "/api/user/add-rating",
        { courseId, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success(data.message);
        fetchUserEnrolledCourses();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    getCourseProgress();
  }, []);

  useEffect(() => {
    if (courseData && courseData.courseContent.length > 0 && !playerData) {
        setPlayerData({
            ...courseData.courseContent[0].chapterContent[0],
            chapter: 1,
            lecture: 1
        })
    }
  }, [courseData]);

  return courseData ? (
    <div className="flex flex-col h-screen bg-gray-900 font-sans text-gray-800">
      
      {/* --- CUSTOM NAVBAR --- */}
      <div className="h-16 bg-gray-900 text-white flex items-center justify-between px-4 lg:px-6 flex-shrink-0 border-b border-gray-800 z-50">
        <div className="flex items-center gap-4">
           {/* Back Button */}
           <Link to="/my-enrollments" className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors">
              <ChevronLeft size={24} />
              <span className="font-bold text-lg hidden md:block">Back</span>
           </Link>
           {/* Vertical Divider */}
           <div className="h-6 w-px bg-gray-700 hidden md:block"></div>
           {/* Course Title */}
           <h1 className="text-sm md:text-base font-medium max-w-[200px] md:max-w-xl truncate text-gray-100">
             {courseData.courseTitle}
           </h1>
        </div>
        
        {/* Right Side Icons */}
        <div className="flex items-center gap-4 text-sm">
           <button className="hidden md:flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
              <Star size={18} /> <span>Leave a rating</span>
           </button>
           <button className="hidden md:flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
              <Trophy size={18} /> <span>Your progress</span>
           </button>
           <button className="hidden md:flex items-center gap-2 border border-gray-600 px-3 py-1.5 rounded hover:bg-gray-800 transition-colors">
              Share <Share2 size={16} />
           </button>
           <button className="text-gray-300 hover:text-white transition-colors">
              <MoreVertical size={24} />
           </button>
        </div>
      </div>

      {/* Mobile Floating Toggle Button */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden fixed bottom-6 right-6 z-[60] bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
        >
          <FileText size={24} />
        </button>
      )}

      {/* --- MAIN CONTENT AREA (Flex container for Video + Sidebar) --- */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-gray-50 relative">
        
        {/* --- LEFT COLUMN: Video & Tabs --- */}
        <div className="flex-1 flex flex-col md:overflow-y-auto h-full transition-all duration-300">
          
          {/* Video Player Container */}
          <div className="bg-black w-full relative group flex-shrink-0">
              
              {/* Draggable Toggle Arrow - Hidden on mobile when sidebar is open */}
              <div 
                className={`absolute right-0 z-[60] cursor-pointer transform -translate-y-1/2 touch-none ${isSidebarOpen ? 'hidden md:block' : 'block'}`}
                style={{ top: dragPosition.top, touchAction: 'none' }}
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                 <div className="bg-black bg-opacity-50 md:bg-opacity-30 hover:bg-opacity-80 text-white p-3 md:p-3 rounded-l-lg transition-colors duration-200 backdrop-blur-sm border-l border-t border-b border-white/10 shadow-lg select-none">
                    {isSidebarOpen ? (
                      <ChevronRight size={24} className="text-white pointer-events-none" />
                    ) : (
                      <ChevronLeft size={24} className="text-white pointer-events-none" />
                    )}
                 </div>
              </div>

              {/* Video Wrapper */}
              <div className={`mx-auto transition-all duration-300 ${isSidebarOpen ? 'max-w-full' : 'max-w-6xl'}`}>
                  {playerData ? (
                  <div className="aspect-video">
                      <YouTube
                      videoId={playerData.lectureUrl.split("/").pop()}
                      opts={{
                          width: '100%',
                          height: '100%',
                          playerVars: { autoplay: 1 },
                      }}
                      className="w-full h-full"
                      iframeClassName="w-full h-full"
                      />
                  </div>
                  ) : (
                  <div className="aspect-video bg-gray-900 flex items-center justify-center text-white">
                      Loading...
                  </div>
                  )}
              </div>
          </div>

          {/* Content Below Video (Scrollable Part) */}
          <div className="flex-1 bg-white">
              {/* Tabs */}
              <div className="border-b border-gray-200 sticky top-0 bg-white z-10 px-6 md:px-10 shadow-sm">
                  <div className="flex gap-8 text-sm font-medium overflow-x-auto no-scrollbar">
                      {['overview', 'qna', 'notes', 'reviews'].map((tab) => (
                          <button 
                              key={tab}
                              onClick={() => setActiveTab(tab)}
                              className={`py-4 flex items-center gap-2 border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                          >
                              {tab}
                          </button>
                      ))}
                  </div>
              </div>

              {/* Tab Content */}
              <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-[500px]"> {/* min-h added to ensure scrolling feel */}
                  {activeTab === 'overview' && (
                      <div className="space-y-6">
                          <div>
                              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                  {playerData?.chapter}.{playerData?.lecture} {playerData?.lectureTitle}
                              </h1>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                               <h3 className="font-semibold text-gray-900 mb-2">Lecture Description</h3>
                               <div className="text-gray-600 text-sm" dangerouslySetInnerHTML={{__html: courseData.courseDescription.substring(0, 300)}} />
                          </div>
                      </div>
                  )}
              </div>
              <Footer />
          </div>
        </div>

        {/* --- RIGHT COLUMN: Sidebar (Fixed & Independent Scroll) --- */}
        <div 
          className={`fixed top-16 bottom-0 right-0 md:top-0 md:static bg-white border-l border-gray-200 flex flex-col shadow-2xl md:shadow-none z-50 md:z-40 transition-all duration-300 ease-in-out transform ${isSidebarOpen ? 'translate-x-0 w-full md:w-96' : 'translate-x-full w-0 overflow-hidden'}`}
        >
           {/* Sidebar Header */}
           <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between shadow-sm flex-shrink-0">
              <h2 className="font-bold text-lg text-gray-900">Course Content</h2>
              <button 
                  onClick={() => setIsSidebarOpen(false)} 
                  className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
              >
                  <X size={20}/>
              </button>
           </div>

           {/* List of Sections */}
           <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
              {courseData.courseContent.map((chapter, index) => (
                <div key={index} className="border-b border-gray-100">
                  <div
                    className="bg-gray-50 hover:bg-gray-100 cursor-pointer py-4 px-5 transition-colors flex justify-between items-start"
                    onClick={() => toggleSection(index)}
                  >
                    <div className="flex-1 pr-4">
                       <h3 className="font-semibold text-gray-800 text-sm mb-1">
                          Section {index + 1}: {chapter.chapterTitle}
                       </h3>
                       <p className="text-xs text-gray-500">
                          {chapter.chapterContent.length} lectures • {calculateChapterTime(chapter)}
                       </p>
                    </div>
                    <div className="mt-1 text-gray-500">
                       {openSections[index] ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </div>
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openSections[index] ? "max-h-[2000px]" : "max-h-0"
                    }`}
                  >
                    <ul className="text-gray-700 bg-white">
                      {chapter.chapterContent.map((lecture, i) => {
                        const isCompleted = progressData?.lectureCompleted.includes(lecture.lectureId);
                        const isActive = playerData?.lectureId === lecture.lectureId;

                        return (
                          <li 
                              key={i} 
                              className={`flex items-start gap-3 py-3 px-5 cursor-pointer hover:bg-gray-50 border-b border-gray-50 ${isActive ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}
                              onClick={() => setPlayerData({ ...lecture, chapter: index + 1, lecture: i + 1 })}
                          >
                              <div className={`mt-1 w-5 h-5 border-2 rounded-sm flex items-center justify-center ${isCompleted ? 'bg-indigo-600 border-indigo-600' : 'border-gray-400'}`}>
                                  {isCompleted && <CheckCircle size={12} className="text-white" />}
                              </div>
                              <div className="flex-1">
                                  <p className={`text-sm ${isActive ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{i+1}. {lecture.lectureTitle}</p>
                                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                      <Play size={12} className="opacity-60" />
                                      {humanizeDuration(lecture.lectureDuration * 60 * 1000, { units: ["m", "s"] })}
                                  </div>
                              </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default Player;