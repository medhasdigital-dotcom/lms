import React, { useContext, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import Loading from "../../components/student/Loading";
import { assets } from "../../assets/assets";
import humanizeDuration from "humanize-duration";
import Footer from "../../components/student/Footer";
import YouTube from "react-youtube";
import axios from "axios";
import { toast } from "react-toastify";
import { CheckCircle, Zap, ShieldCheck, Crown, BookOpen, Award } from "lucide-react";

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [courseData, setCourseData] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
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
      
      // If already enrolled with standard and trying to upgrade
      if (isAlreadyEnrolled && !hasPremiumAccess && selectedPlan === 'premium') {
        const token = await getToken();
        const { data } = await axios.post(
          backendUrl + "/api/user/upgrade-to-premium",
          { courseId: courseData._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data.success) {
          const { session_url } = data;
          window.location.replace(session_url);
        } else {
          toast.error(data.message);
        }
        return;
      }
      
      if (isAlreadyEnrolled) {
        return navigate("/my-enrollments");
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
      const enrolled = userData.enrolledCourses?.includes(courseData._id);
      const premium = userData.premiumCourses?.includes(courseData._id);
      
      setIsAlreadyEnrolled(enrolled);
      setHasPremiumAccess(premium);
      
      // Auto-select the plan based on what user already has
      if (enrolled) {
        setSelectedPlan(premium ? 'premium' : 'standard');
      }
    }
  }, [userData, courseData]);

  const toggleSection = (index) => {
    setOpenSections((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const getPrice = () => {
      // If premium plan is available
      if (courseData.pricingTier === 'premium') {
        const premiumPrice = courseData.premiumPrice || courseData.coursePrice * 1.5;
        const premiumDiscount = courseData.premiumDiscount || 0;
        const premiumFinalPrice = premiumPrice - (premiumPrice * premiumDiscount / 100);
        
        if (selectedPlan === 'premium') {
          return premiumFinalPrice.toFixed(2);
        }
      }
      
      // Standard plan price
      const basePrice = courseData.coursePrice - (courseData.discount * courseData.coursePrice) / 100;
      return basePrice.toFixed(2);
  };

  const getOriginalPrice = () => {
      if (courseData.pricingTier === 'premium' && selectedPlan === 'premium') {
        return courseData.premiumPrice || (courseData.coursePrice * 1.5).toFixed(2);
      }
      return courseData.coursePrice;
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

        {/* --- RIGHT COLUMN: PROFESSIONAL CARD --- */}
        <div className="max-w-[400px] w-full z-10 shadow-xl rounded-xl overflow-hidden bg-white border border-gray-100 sticky top-24">
           
            {/* Video Preview */}
            {playerData ? (
                 <div className="aspect-video bg-black">
                    <YouTube videoId={playerData.videoId} opts={{ playerVars: { autoplay: 1 }}} iframeClassName="w-full h-full" />
                 </div>
            ) : (
                <div className="relative group cursor-pointer" onClick={() => setPlayerData({ videoId: courseData.courseContent[0]?.chapterContent[0]?.lectureUrl.split('/').pop() })}>
                    <img src={courseData.courseThumbnail} alt="" className="w-full aspect-video object-cover"/>
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/70 transition-all">
                        <div className="w-16 h-16 bg-white/95 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                            <img src={assets.play_icon} alt="play" className="w-6 h-6 ml-1"/>
                        </div>
                        <p className="absolute bottom-4 left-4 text-white text-sm font-medium">Preview this course</p>
                    </div>
                </div>
            )}

            <div className="p-5">
                
                {/* Already Enrolled Badge */}
                {isAlreadyEnrolled && (
                    <div className={`mb-4 p-3 rounded-lg flex items-center gap-3 ${hasPremiumAccess ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}>
                        {hasPremiumAccess ? (
                            <Crown className="w-5 h-5 text-amber-600" />
                        ) : (
                            <BookOpen className="w-5 h-5 text-blue-600" />
                        )}
                        <div className="flex-1">
                            <p className={`text-sm font-semibold ${hasPremiumAccess ? 'text-amber-700' : 'text-blue-700'}`}>
                                {hasPremiumAccess ? 'Premium Access' : 'Standard Access'}
                            </p>
                            <p className="text-xs text-gray-500">You're enrolled in this course</p>
                        </div>
                    </div>
                )}

                {/* Upgrade to Premium Banner - Show if has standard plan and course offers premium */}
                {isAlreadyEnrolled && !hasPremiumAccess && (courseData.pricingTier === 'premium' || courseData.premiumPrice > 0) && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <Crown className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-900">Upgrade to Premium</p>
                                <p className="text-xs text-amber-700 mt-1">Unlock exclusive benefits and mentorship!</p>
                            </div>
                        </div>
                        <ul className="space-y-1.5 mb-3 ml-1">
                            {courseData.premiumFeatures && courseData.premiumFeatures.length > 0 ? (
                                courseData.premiumFeatures.map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-xs text-amber-800">
                                        <CheckCircle size={12} className="text-amber-600" />
                                        {feature}
                                    </li>
                                ))
                            ) : (
                                <>
                                    <li className="flex items-center gap-2 text-xs text-amber-800">
                                        <CheckCircle size={12} className="text-amber-600" />
                                        1-on-1 Mentorship Sessions
                                    </li>
                                    <li className="flex items-center gap-2 text-xs text-amber-800">
                                        <CheckCircle size={12} className="text-amber-600" />
                                        Personal Code Reviews
                                    </li>
                                    <li className="flex items-center gap-2 text-xs text-amber-800">
                                        <CheckCircle size={12} className="text-amber-600" />
                                        Priority Support
                                    </li>
                                </>
                            )}
                        </ul>
                        <button
                            onClick={() => {
                                setSelectedPlan('premium');
                                enrollCourse();
                            }}
                            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Zap size={16} />
                            Upgrade Now - {currency}{((courseData.premiumPrice || courseData.coursePrice * 1.5) - ((courseData.premiumPrice || courseData.coursePrice * 1.5) * (courseData.premiumDiscount || 0) / 100) - (courseData.coursePrice - (courseData.coursePrice * courseData.discount / 100))).toFixed(2)}
                        </button>
                    </div>
                )}

                {/* Plan Selector - Only show if not enrolled */}
                {!isAlreadyEnrolled && courseData.pricingTier && (
                    <div className="mb-5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Select Plan</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => setSelectedPlan('standard')}
                                className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                                    selectedPlan === 'standard' 
                                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <BookOpen size={16} className={selectedPlan === 'standard' ? "text-blue-600" : "text-gray-400"} />
                                    <span className={`text-sm font-bold ${selectedPlan === 'standard' ? 'text-blue-700' : 'text-gray-700'}`}>Standard</span>
                                </div>
                                <p className="text-[10px] text-gray-500">Full course access</p>
                                {selectedPlan === 'standard' && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                        <CheckCircle size={12} className="text-white" />
                                    </div>
                                )}
                            </button>
                            
                            <button 
                                onClick={() => setSelectedPlan('premium')}
                                className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                                    selectedPlan === 'premium' 
                                        ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md' 
                                        : 'border-gray-200 hover:border-amber-300 bg-white'
                                }`}
                            >
                                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                                    POPULAR
                                </div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Crown size={16} className={selectedPlan === 'premium' ? "text-amber-600" : "text-gray-400"} />
                                    <span className={`text-sm font-bold ${selectedPlan === 'premium' ? 'text-amber-700' : 'text-gray-700'}`}>Premium</span>
                                </div>
                                <p className="text-[10px] text-gray-500">Access + Mentorship</p>
                                {selectedPlan === 'premium' && (
                                    <div className="absolute -top-1 -left-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                                        <CheckCircle size={12} className="text-white" />
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Price Area - Only show if not enrolled */}
                {!isAlreadyEnrolled && (
                    <div className="flex items-baseline gap-3 mb-5 pb-5 border-b border-gray-100">
                        <span className="text-4xl font-extrabold text-gray-900">{currency}{getPrice()}</span>
                        <div className="flex flex-col">
                            <span className="text-sm text-gray-400 line-through">{currency}{getOriginalPrice()}</span>
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{courseData.discount}% OFF</span>
                        </div>
                    </div>
                )}

                {/* Enrollment Button */}
                <button 
                    onClick={enrollCourse}
                    className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] mb-5 flex items-center justify-center gap-2
                        ${isAlreadyEnrolled
                            ? hasPremiumAccess 
                                ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-amber-200/50' 
                                : 'bg-blue-600 shadow-blue-200/50'
                            : selectedPlan === 'premium' 
                                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-200/50' 
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200/50'
                        }`}
                >
                    {isAlreadyEnrolled ? (
                        <>
                            <BookOpen size={18} />
                            Continue Learning
                        </>
                    ) : (
                        <>
                            {selectedPlan === 'premium' ? <Crown size={18} /> : <Zap size={18} />}
                            {selectedPlan === 'premium' ? "Get Premium Access" : "Enroll Now"}
                        </>
                    )}
                </button>

                {/* Features List */}
                <div className="space-y-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {isAlreadyEnrolled ? 'Your Benefits:' : selectedPlan === 'premium' ? 'Premium Includes:' : 'What\'s Included:'}
                    </p>
                    
                    <ul className="space-y-2.5">
                        <li className="flex items-center gap-3 text-sm text-gray-700">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${(isAlreadyEnrolled ? hasPremiumAccess : selectedPlan === 'premium') ? "bg-amber-100" : "bg-green-100"}`}>
                                <CheckCircle size={12} className={(isAlreadyEnrolled ? hasPremiumAccess : selectedPlan === 'premium') ? "text-amber-600" : "text-green-600"}/> 
                            </div>
                            <span>Lifetime Course Access</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-gray-700">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${(isAlreadyEnrolled ? hasPremiumAccess : selectedPlan === 'premium') ? "bg-amber-100" : "bg-green-100"}`}>
                                <Award size={12} className={(isAlreadyEnrolled ? hasPremiumAccess : selectedPlan === 'premium') ? "text-amber-600" : "text-green-600"}/> 
                            </div>
                            <span>Certificate of Completion</span>
                        </li>
                        
                        {/* Premium Only Features */}
                        {(isAlreadyEnrolled ? hasPremiumAccess : selectedPlan === 'premium') && (
                            <>
                                <li className="flex items-center gap-3 text-sm font-medium text-gray-800">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                        <Zap size={10} className="text-white"/> 
                                    </div>
                                    <span>1-on-1 Mentorship Sessions</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm font-medium text-gray-800">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                        <Zap size={10} className="text-white"/> 
                                    </div>
                                    <span>Personal Code Reviews</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm font-medium text-gray-800">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                        <Zap size={10} className="text-white"/> 
                                    </div>
                                    <span>Priority Support</span>
                                </li>
                            </>
                        )}
                    </ul>
                </div>

                {/* Footer Guarantee */}
                <div className="mt-5 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                        <ShieldCheck size={14} className="text-green-500"/>
                        <p className="text-xs">30-Day Money-Back Guarantee</p>
                    </div>
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