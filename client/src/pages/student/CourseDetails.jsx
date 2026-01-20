import React, { useContext, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import Loading from "../../components/student/Loading";
import { assets } from "../../assets/assets";
import humanizeDuration from "humanize-duration";
import Footer from "../../components/student/Footer";
import YouTube from "react-youtube";
import axios from "axios";
import { toast } from "react-toastify";
import { CheckCircle, Zap, ShieldCheck } from "lucide-react";

const CourseDetails = () => {
  const { id } = useParams();

  const [courseData, setCourseData] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);
  const [playerData, setPlayerData] = useState(null);
  
  const [selectedPlan, setSelectedPlan] = useState('standard');

  const {
    calculateRating,
    calculateChapterTime,
    currency,
    backendUrl,
    userData,
    getToken,
  } = useContext(AppContext);

  const fetchCourseData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/course/" + id);
      if (data.success) {
        setCourseData(data.courseData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const enrollCourse = async () => {
    try {
      if (!userData) {
        return toast.warn("Login to Enroll");
      }
      if (isAlreadyEnrolled) {
        return toast.warn("Already Enrolled");
      }

      const token = await getToken();

      const { data } = await axios.post(
        backendUrl + "/api/user/purchase",
        { courseId: courseData._id, planType: selectedPlan }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        const { session_url } = data;
        window.location.replace(session_url);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, []);

  useEffect(() => {
    if (userData && courseData) {
      setIsAlreadyEnrolled(userData.enrolledCourses.includes(courseData._id));
    }
  }, [userData, courseData]);

  const toggleSection = (index) => {
    setOpenSections((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const getPrice = () => {
      const basePrice = courseData.coursePrice - (courseData.discount * courseData.coursePrice) / 100;
      return selectedPlan === 'premium' ? (basePrice * 1.5).toFixed(2) : basePrice.toFixed(2);
  };

  const getOriginalPrice = () => {
      return selectedPlan === 'premium' ? (courseData.coursePrice * 1.5).toFixed(2) : courseData.coursePrice;
  };

  return courseData ? (
    <>
      <div className="flex md:flex-row flex-col-reverse gap-10 relative items-start justify-between md:px-36 px-8 md:pt-30 pt-20 text-left">
        <div className="absolute top-0 left-0 w-full h-section-height -z-1 bg-gradient-to-b from-cyan-100/70"></div>

        {/* --- LEFT COLUMN: Course Info --- */}
        <div className="max-w-xl z-10 text-gray-500">
          <h1 className="md:text-course-details-heading-large text-course-details-heading-small font-semibold text-gray-800">
            {courseData.courseTitle}
          </h1>
          <p
            className="pt-4 md:text-base text-sm"
            dangerouslySetInnerHTML={{
              __html: courseData.courseDescription.slice(0, 200),
            }}
          ></p>

          {/* Ratings & Stats */}
          <div className="flex items-center space-x-2 pt-3 pb-1 text-sm">
            <p className="font-bold text-amber-500">{calculateRating(courseData)}</p>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <img
                  key={i}
                  src={i < Math.floor(calculateRating(courseData)) ? assets.star : assets.star_blank}
                  alt="star"
                  className="w-3.5 h-3.5"
                />
              ))}
            </div>
            <p className="text-gray-500">({courseData.courseRatings.length} ratings)</p>
            <p>{courseData.enrolledStudents.length} students</p>
          </div>
          <p className="text-sm">Course by <span className="text-blue-600 underline">{courseData.educator.name}</span></p>

          <div className="pt-8 text-gray-800">
            <h2 className="text-xl font-semibold">Course Structure</h2>
            <div className="pt-5">
              {courseData.courseContent.map((chapter, index) => (
                <div key={index} className="border border-gray-300 bg-white mb-2 rounded">
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                    onClick={() => toggleSection(index)}
                  >
                    <div className="flex items-center gap-2">
                      <img className={`transform transition-transform ${openSections[index] ? "rotate-180" : ""}`} src={assets.down_arrow_icon} alt="arrow" />
                      <p className="font-medium md:text-base text-sm">{chapter.chapterTitle}</p>
                    </div>
                    <p className="text-sm md:text-default">{chapter.chapterContent.length} lectures - {calculateChapterTime(chapter)}</p>
                  </div>

                  <div className={`overflow-hidden transition-all duration-300 ${openSections[index] ? "max-h-96" : "max-h-0"}`}>
                    <ul className="list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t border-gray-300">
                      {chapter.chapterContent.map((lecture, i) => (
                        <li key={i} className="flex items-start gap-2 py-1">
                          <img src={assets.play_icon} alt="play" className="w-4 h-4 mt-1" />
                          <div className="flex items-center justify-between w-full text-gray-800 text-xs md:text-default">
                            <p>{lecture.lectureTitle}</p>
                            <div className="flex gap-2">
                              {lecture.isPreviewFree && (
                                <p onClick={() => setPlayerData({ videoId: lecture.lectureUrl.split("/").pop() })} className="text-blue-500 cursor-pointer">Preview</p>
                              )}
                              <p>{humanizeDuration(lecture.lectureDuration * 60 * 1000, { units: ["h", "m"] })}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="py-20 text-sm md:text-default">
            <h3 className="text-xl font-semibold text-gray-800">Course Description</h3>
            <p className="pt-3 rich-text" dangerouslySetInnerHTML={{ __html: courseData.courseDescription }}></p>
          </div>
        </div>

        {/* --- RIGHT COLUMN: COMPACT CARD --- */}
        <div className="max-w-[380px] w-full z-10 shadow-custom-card rounded-t md:rounded-lg overflow-hidden bg-white">
           
            {/* Video Preview */}
            {playerData ? (
                 <div className="aspect-video bg-black">
                    <YouTube videoId={playerData.videoId} opts={{ playerVars: { autoplay: 1 }}} iframeClassName="w-full h-full" />
                 </div>
            ) : (
                <div className="relative group cursor-pointer" onClick={() => setPlayerData({ videoId: courseData.courseContent[0]?.chapterContent[0]?.lectureUrl.split('/').pop() })}>
                    <img src={courseData.courseThumbnail} alt="" className="w-full object-cover"/>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-all">
                        <img src={assets.play_icon} alt="play" className="w-12 h-12 bg-white rounded-full p-3 shadow-lg"/>
                    </div>
                </div>
            )}

            <div className="p-4">
                {/* Selector Tabs - Compact */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-lg mb-4">
                    <button 
                        onClick={() => setSelectedPlan('standard')}
                        className={`py-1.5 rounded-md text-xs font-semibold transition-all ${selectedPlan === 'standard' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Standard
                    </button>
                    <button 
                        onClick={() => setSelectedPlan('premium')}
                        className={`py-1.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1 ${selectedPlan === 'premium' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-amber-600'}`}
                    >
                        Premium <Zap size={12} className="fill-current"/>
                    </button>
                </div>

                {/* Price Area */}
                <div className="flex items-end gap-2 mb-4">
                    <span className="text-3xl font-bold text-gray-900">{currency}{getPrice()}</span>
                    <div className="flex flex-col mb-1">
                        <span className="text-xs text-gray-400 line-through decoration-gray-400">{currency}{getOriginalPrice()}</span>
                        <span className="text-[10px] font-bold text-green-600">{courseData.discount}% OFF</span>
                    </div>
                </div>

                {/* Enrollment Button */}
                <button 
                    onClick={enrollCourse}
                    className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition-all transform active:scale-95 mb-4 text-sm
                        ${selectedPlan === 'premium' 
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-200' 
                            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                        }`}
                >
                    {isAlreadyEnrolled ? "Go to Course" : selectedPlan === 'premium' ? "Enroll Premium" : "Enroll Now"}
                </button>

                {/* Features List */}
                <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                        {selectedPlan === 'premium' ? 'Premium Features:' : 'Plan Includes:'}
                    </p>
                    
                    <ul className="space-y-2 text-xs text-gray-600">
                        <li className="flex items-start gap-2">
                            <CheckCircle size={14} className={selectedPlan === 'premium' ? "text-amber-500" : "text-green-500"}/> 
                            <span>Full Course Access</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle size={14} className={selectedPlan === 'premium' ? "text-amber-500" : "text-green-500"}/> 
                            <span>Certificate of Completion</span>
                        </li>
                        
                        {/* Premium Only Features */}
                        {selectedPlan === 'premium' && (
                            <>
                                <li className="flex items-start gap-2 animate-in fade-in">
                                    <Zap size={14} className="text-amber-500 fill-amber-100"/> 
                                    <span className="font-semibold text-gray-800">1-on-1 Mentorship</span>
                                </li>
                                <li className="flex items-start gap-2 animate-in fade-in">
                                    <Zap size={14} className="text-amber-500 fill-amber-100"/> 
                                    <span className="font-semibold text-gray-800">Code Review</span>
                                </li>
                            </>
                        )}
                    </ul>
                </div>

                {/* Footer Guarantee */}
                <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                    <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                        <ShieldCheck size={12}/> 30-Day Money-Back Guarantee
                    </p>
                </div>
            </div>
        </div>
      </div>
      <Footer />
    </>
  ) : (
    <Loading />
  );
};

export default CourseDetails;