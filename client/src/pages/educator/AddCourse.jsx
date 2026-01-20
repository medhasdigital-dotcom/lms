import React, { useContext, useEffect, useRef, useState } from "react";
import uniqid from "uniqid";
import Quill from "quill";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Plus, Video, X, ChevronDown, ChevronUp,
  Edit3, Trash2, CheckCircle, Layout, FileText, PlayCircle, GripVertical,
  Upload, Image, DollarSign, Percent, Globe, Lock, Clock, Tag,
  BookOpen, Save, Eye, AlertCircle, Info
} from "lucide-react";

// --- Sub-Components ---

const AddLectureBar = ({ onAdd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd(title);
    setTitle("");
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <div className="ml-10 mt-2 mb-4">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
        >
          <Plus size={16} className="bg-indigo-600 text-white rounded-full p-0.5" />
          Curriculum item
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-dashed border-gray-300 p-4 rounded-md mt-2 ml-10 relative">
      <button type="button" onClick={() => setIsOpen(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"><X size={16} /></button>
      <div className="flex items-center gap-4 border-b border-gray-100 pb-3 mb-3">
        <span className="text-indigo-600 font-semibold border-b-2 border-indigo-600 pb-3 -mb-3.5 px-2 flex items-center gap-2"><Plus size={14} /> Lecture</span>
      </div>
      <div className="bg-white p-3 border border-gray-200 rounded shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-gray-600 font-medium">New Lecture:</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a Title"
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={handleAdd} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700">Add Lecture</button>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

const AddCourse = () => {
  const { backendUrl, getToken, currency } = useContext(AppContext);
  const quillRef = useRef(null);
  const editorRef = useRef(null);

  // Course Basic Info
  const [courseTitle, setCourseTitle] = useState("");
  const [coursePrice, setCoursePrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isPublished, setIsPublished] = useState(true);
  const [chapters, setChapters] = useState([]);
  const [courseDescription, setCourseDescription] = useState(""); // Store description content

  // UI States
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionObjective, setNewSectionObjective] = useState("");
  const [activeTab, setActiveTab] = useState("basic"); // basic, curriculum, pricing
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Calculate final price
  const finalPrice = coursePrice - (coursePrice * discount / 100);
  const totalLectures = chapters.reduce((acc, ch) => acc + ch.chapterContent.length, 0);

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Drag and Drop Logic ---
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    // Reordering Sections (Chapters)
    if (type === "SECTION") {
      const newChapters = Array.from(chapters);
      const [movedChapter] = newChapters.splice(source.index, 1);
      newChapters.splice(destination.index, 0, movedChapter);
      setChapters(newChapters);
      return;
    }

    // Reordering Lectures (Items)
    if (type === "LECTURE") {
      const sourceChapterIndex = chapters.findIndex(c => c.chapterId === source.droppableId);
      const destChapterIndex = chapters.findIndex(c => c.chapterId === destination.droppableId);

      const newChapters = [...chapters];
      const sourceChapter = newChapters[sourceChapterIndex];
      const destChapter = newChapters[destChapterIndex];

      // Moving within the same chapter
      if (source.droppableId === destination.droppableId) {
        const newLectures = Array.from(sourceChapter.chapterContent);
        const [movedLecture] = newLectures.splice(source.index, 1);
        newLectures.splice(destination.index, 0, movedLecture);

        newChapters[sourceChapterIndex] = { ...sourceChapter, chapterContent: newLectures };
        setChapters(newChapters);
      }
      // Moving from one chapter to another
      else {
        const sourceLectures = Array.from(sourceChapter.chapterContent);
        const [movedLecture] = sourceLectures.splice(source.index, 1);

        const destLectures = Array.from(destChapter.chapterContent);
        destLectures.splice(destination.index, 0, movedLecture);

        newChapters[sourceChapterIndex] = { ...sourceChapter, chapterContent: sourceLectures };
        newChapters[destChapterIndex] = { ...destChapter, chapterContent: destLectures };
        setChapters(newChapters);
      }
    }
  };

  // --- Existing Logic ---
  const handleAddSection = () => {
    if (!newSectionTitle) return;
    const newChapter = {
      chapterId: uniqid(),
      chapterTitle: newSectionTitle,
      learningObjective: newSectionObjective,
      chapterContent: [],
      collapsed: false,
    };
    setChapters([...chapters, newChapter]);
    setNewSectionTitle("");
    setNewSectionObjective("");
    setIsAddingSection(false);
  };

  const handleToggleSection = (chapterId) => {
    setChapters(chapters.map(c => c.chapterId === chapterId ? { ...c, collapsed: !c.collapsed } : c));
  };

  const handleUpdateSectionTitle = (chapterId, newTitle) => {
    setChapters(chapters.map(c => c.chapterId === chapterId ? { ...c, chapterTitle: newTitle } : c));
  };

  const handleRemoveSection = (chapterId) => {
    setChapters(chapters.filter(c => c.chapterId !== chapterId));
  };

  const handleAddLecture = (chapterId, title) => {
    setChapters(chapters.map(c => {
      if (c.chapterId === chapterId) {
        const newLecture = {
          lectureId: uniqid(),
          lectureTitle: title,
          lectureDuration: 0,
          lectureUrl: "",
          lectureContent: "",
          lectureType: "video",
          isPreviewFree: false,
          isExpanded: true, // Auto-expand newly added lecture
        };
        return { ...c, chapterContent: [...c.chapterContent, newLecture] };
      }
      return c;
    }));
  };

  const handleRemoveLecture = (chapterId, lectureId) => {
    setChapters(chapters.map(c => {
      if (c.chapterId === chapterId) {
        return { ...c, chapterContent: c.chapterContent.filter(l => l.lectureId !== lectureId) };
      }
      return c;
    }));
  };

  const handleUpdateLecture = (chapterId, lectureId, field, value) => {
    setChapters(chapters.map(c => {
      if (c.chapterId === chapterId) {
        return {
          ...c,
          chapterContent: c.chapterContent.map(l => {
            if (l.lectureId === lectureId) {
              return { ...l, [field]: value };
            }
            return l;
          })
        };
      }
      return c;
    }));
  };

  const toggleLectureExpand = (chapterId, lectureId) => {
    setChapters(chapters.map(c => {
      if (c.chapterId === chapterId) {
        return {
          ...c,
          chapterContent: c.chapterContent.map(l => {
            if (l.lectureId === lectureId) {
              return { ...l, isExpanded: !l.isExpanded };
            }
            return l;
          })
        };
      }
      return c;
    }));
  };

const handleSubmit = async (e, isDraft = false) => {
  e?.preventDefault();

  if (!courseTitle.trim()) {
    toast.error("Please enter a course title");
    return;
  }

  if (!isDraft && !image) {
    toast.error("Please upload a course thumbnail");
    return;
  }

  isDraft ? setIsSavingDraft(true) : setIsSubmitting(true);

  try {
    const token = await getToken();
    const formData = new FormData();

    // ✅ Build courseContent with order fields
    const courseContentWithOrder = chapters.map((chapter, chapterIndex) => ({
      ...chapter,
      chapterOrder: chapterIndex + 1,
      chapterContent: chapter.chapterContent.map((lecture, lectureIndex) => ({
        ...lecture,
        lectureOrder: lectureIndex + 1,
      })),
    }));

    // ✅ Build courseData object
    const courseData = {
      courseTitle,
      courseDescription:
        quillRef.current?.root.innerHTML || courseDescription,
      coursePrice: Number(coursePrice),
      discount: Number(discount),
      status: isDraft ? "DRAFT" : "PUBLISHED",
      courseContent: courseContentWithOrder
    };

    // ✅ Append as JSON string
    formData.append("courseData", JSON.stringify(courseData));

    // ✅ File stays separate
    if (image) {
      formData.append("image", image);
    }

    console.log("Sending:", courseData);

    const { data } = await axios.post(
      backendUrl + "/api/educator/add-course",
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      }
    );

    if (data.success) {
      toast.success(
        isDraft ? "Course saved as draft!" : "Course published successfully!"
      );

      if (!isDraft) {
        setCourseTitle("");
        setCoursePrice(0);
        setDiscount(0);
        setImage(null);
        setImagePreview(null);
        setChapters([]);
        setCourseDescription("");
        quillRef.current && (quillRef.current.root.innerHTML = "");
      }
    } else {
      toast.error(data.message);
    }
  } catch (error) {
    toast.error(error.message);
  } finally {
    setIsSubmitting(false);
    setIsSavingDraft(false);
  }
};

  const handleSaveDraft = (e) => {
    handleSubmit(e, true);
  };

  // Initialize/reinitialize Quill editor when on basic tab
  useEffect(() => {
    if (activeTab === 'basic') {
      // Use setTimeout to ensure DOM is ready after tab switch
      const timer = setTimeout(() => {
        if (editorRef.current) {
          // Check if Quill is already initialized on this element
          if (!editorRef.current.classList.contains('ql-container')) {
            quillRef.current = new Quill(editorRef.current, { theme: "snow" });
            // Restore previous content
            if (courseDescription) {
              quillRef.current.root.innerHTML = courseDescription;
            }
            // Save content on text change
            quillRef.current.on('text-change', () => {
              setCourseDescription(quillRef.current.root.innerHTML);
            });
          }
        }
      }, 0);
      return () => clearTimeout(timer);
    } else {
      // Save content before leaving the tab
      if (quillRef.current) {
        setCourseDescription(quillRef.current.root.innerHTML);
      }
      // Reset quillRef so it can be reinitialized
      quillRef.current = null;
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 text-gray-800 font-sans">
      <div className="max-w-6xl mx-auto px-4">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Create New Course</h1>
            <p className="text-gray-500 mt-1">Fill in the details to publish your course</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPublished(!isPublished)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                isPublished 
                  ? 'bg-green-50 border-green-200 text-green-700' 
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
            >
              {isPublished ? <Globe size={18} /> : <Lock size={18} />}
              {isPublished ? 'Public' : 'Private'}
            </button>
            <button 
              onClick={handleSaveDraft} 
              disabled={isSavingDraft || isSubmitting}
              className="bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 border border-gray-300 shadow-sm"
            >
              {isSavingDraft ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FileText size={18} />
                  Save Draft
                </>
              )}
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting || isSavingDraft}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Publishing...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Publish Course
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress/Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Sections</p>
                <p className="text-lg font-bold text-gray-900">{chapters.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <PlayCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Lectures</p>
                <p className="text-lg font-bold text-gray-900">{totalLectures}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Price</p>
                <p className="text-lg font-bold text-gray-900">{currency}{coursePrice}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Final Price</p>
                <p className="text-lg font-bold text-gray-900">{currency}{finalPrice.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex border-b border-gray-100">
            {[
              { id: 'basic', label: 'Basic Info', icon: FileText },
              { id: 'curriculum', label: 'Curriculum', icon: Layout },
              { id: 'pricing', label: 'Pricing', icon: DollarSign },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Course Title & Thumbnail Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Title & Description */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                      <FileText size={20} className="text-indigo-600" />
                      Course Details
                    </h2>
                    
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Course Title <span className="text-red-500">*</span>
                        </label>
                        <input 
                          onChange={(e) => setCourseTitle(e.target.value)} 
                          value={courseTitle} 
                          type="text" 
                          placeholder="e.g., Complete JavaScript Masterclass 2026"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none" 
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {courseTitle.length}/80 characters recommended
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Course Description <span className="text-red-500">*</span>
                        </label>
                        <div ref={editorRef} className="h-48 bg-white rounded-lg" />
                        <p className="text-xs text-gray-500 mt-1">
                          Write a compelling description that highlights what students will learn
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Thumbnail Upload */}
                <div className="lg:col-span-1">
                  <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 h-full">
                    <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                      <Image size={20} className="text-indigo-600" />
                      Course Thumbnail
                    </h2>
                    
                    <div className="relative">
                      {imagePreview ? (
                        <div className="relative group">
                          <img 
                            src={imagePreview} 
                            alt="Course thumbnail" 
                            className="w-full aspect-video object-cover rounded-lg border border-gray-200"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <label className="cursor-pointer bg-white text-gray-800 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors">
                              Change Image
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageChange}
                                className="hidden"
                              />
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setImage(null); setImagePreview(null); }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-all">
                          <div className="flex flex-col items-center justify-center py-6">
                            <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                              <Upload className="w-6 h-6 text-indigo-600" />
                            </div>
                            <p className="text-sm text-gray-600 font-medium">Click to upload</p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                          </div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-start gap-2">
                        <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-700">
                          Recommended size: 1280x720 pixels (16:9 ratio). A good thumbnail increases click-through rate.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-6 text-gray-800 flex items-center gap-2">
                <DollarSign size={20} className="text-indigo-600" />
                Pricing & Discount
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Price Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Price ({currency})
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <DollarSign size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={coursePrice}
                      onChange={(e) => setCoursePrice(parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                      placeholder="49.99"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Set to 0 for a free course</p>
                </div>

                {/* Discount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount (%)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Percent size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discount}
                      onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                      placeholder="20"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Optional promotional discount</p>
                </div>
              </div>

              {/* Price Preview */}
              <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                <h3 className="text-sm font-medium text-gray-600 mb-4">Price Preview</h3>
                <div className="flex items-end gap-4">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{currency}{finalPrice.toFixed(2)}</p>
                    {discount > 0 && (
                      <p className="text-lg text-gray-400 line-through">{currency}{coursePrice.toFixed(2)}</p>
                    )}
                  </div>
                  {discount > 0 && (
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold mb-1">
                      {discount}% OFF
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Students will pay {currency}{finalPrice.toFixed(2)} for this course
                </p>
              </div>

              {/* Visibility Toggle */}
              <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      {isPublished ? <Globe size={18} className="text-green-600" /> : <Lock size={18} className="text-gray-500" />}
                      Course Visibility
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {isPublished 
                        ? "Your course is visible to everyone and can be purchased"
                        : "Your course is hidden and only you can see it"
                      }
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPublished(!isPublished)}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                      isPublished ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                        isPublished ? 'translate-x-8' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Curriculum Tab */}
          {activeTab === 'curriculum' && (
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Layout size={22} className="text-indigo-600" />
                    Curriculum
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Drag and drop to reorder sections and lectures</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <BookOpen size={16} />
                  {chapters.length} sections • {totalLectures} lectures
                </div>
              </div>

              <div className="p-6 bg-gray-50 min-h-[400px]">

                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="board" type="SECTION">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">

                        {chapters.map((chapter, index) => (
                          <Draggable key={chapter.chapterId} draggableId={chapter.chapterId} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                              >
                                {/* SECTION HEADER */}
                                <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 p-4">
                                  <div className="flex items-center gap-2">
                                    {/* Drag Handle for Section */}
                                    <div {...provided.dragHandleProps} className="cursor-grab text-gray-400 hover:text-gray-600">
                                      <GripVertical size={20} />
                                    </div>

                                    <span className="font-bold text-gray-800">Section {index + 1}:</span>
                                    <div className="flex items-center gap-2 group">
                                      <FileText size={16} className="text-gray-500" />
                                      <input
                                        value={chapter.chapterTitle}
                                        onChange={(e) => handleUpdateSectionTitle(chapter.chapterId, e.target.value)}
                                        className="bg-transparent border-none focus:ring-0 font-medium text-gray-700 w-64 p-0"
                                      />
                                      <Edit3 size={14} className="text-gray-400 opacity-0 group-hover:opacity-100" />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                      {chapter.chapterContent.length} lectures
                                    </span>
                                    <button type="button" onClick={() => handleRemoveSection(chapter.chapterId)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                    <button type="button" onClick={() => handleToggleSection(chapter.chapterId)} className="text-gray-600">
                                      {chapter.collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                    </button>
                                  </div>
                                </div>

                                {/* LECTURES DROPPABLE AREA */}
                                {!chapter.collapsed && (
                                  <div className="p-4 bg-white">
                                    <Droppable droppableId={chapter.chapterId} type="LECTURE">
                                      {(provided) => (
                                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                                          {chapter.chapterContent.map((lecture, lIndex) => (
                                            <Draggable key={lecture.lectureId} draggableId={lecture.lectureId} index={lIndex}>
                                              {(provided) => (
                                                <div
                                                  ref={provided.innerRef}
                                                  {...provided.draggableProps}
                                                  className="bg-white"
                                                >
                                                  <div className={`flex items-center justify-between group p-3 rounded-lg border transition-all ${
                                                    lecture.isExpanded ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-gray-50 border-transparent hover:border-gray-200'
                                                  }`}>
                                                    <div className="flex items-center gap-3">
                                                      {/* Drag Handle for Lecture */}
                                                      <div {...provided.dragHandleProps} className="cursor-grab text-gray-300 hover:text-gray-500">
                                                        <GripVertical size={16} />
                                                      </div>

                                                      <button
                                                        type="button"
                                                        onClick={() => toggleLectureExpand(chapter.chapterId, lecture.lectureId)}
                                                        className="text-gray-500 hover:text-indigo-600 transition-colors"
                                                      >
                                                        {lecture.isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                      </button>

                                                      <Video size={16} className={lecture.lectureUrl ? 'text-green-500' : 'text-gray-400'} />
                                                      <span className="font-medium text-gray-800">Lecture {lIndex + 1}:</span>
                                                      <input
                                                        value={lecture.lectureTitle}
                                                        onChange={(e) => handleUpdateLecture(chapter.chapterId, lecture.lectureId, 'lectureTitle', e.target.value)}
                                                        className="bg-transparent border-none focus:ring-0 text-gray-600 p-0 w-48 focus:outline-none focus:bg-white focus:border focus:border-indigo-300 focus:rounded focus:px-2"
                                                      />
                                                      {lecture.lectureUrl && (
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Has Content</span>
                                                      )}
                                                      {lecture.isPreviewFree && (
                                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Free Preview</span>
                                                      )}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                      {lecture.lectureDuration > 0 && (
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                          <Clock size={12} /> {lecture.lectureDuration} min
                                                        </span>
                                                      )}
                                                      <button type="button" onClick={() => handleRemoveLecture(chapter.chapterId, lecture.lectureId)} className="p-2 text-gray-400 hover:text-red-500"><X size={16} /></button>
                                                    </div>
                                                  </div>

                                                  {/* EXPANDED CONTENT AREA */}
                                                  {lecture.isExpanded && (
                                                    <div className="mt-2 ml-10 mb-4 border border-indigo-200 rounded-lg bg-white shadow-sm">
                                                      {/* Content Tabs */}
                                                      <div className="flex items-center border-b border-gray-200 bg-gray-50 px-4 py-2 gap-4 text-sm rounded-t-lg">
                                                        <button 
                                                          type="button" 
                                                          onClick={() => handleUpdateLecture(chapter.chapterId, lecture.lectureId, 'lectureType', 'video')} 
                                                          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${lecture.lectureType === 'video' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
                                                        >
                                                          <Video size={16} /> Video
                                                        </button>
                                                        <button 
                                                          type="button" 
                                                          onClick={() => handleUpdateLecture(chapter.chapterId, lecture.lectureId, 'lectureType', 'article')} 
                                                          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${lecture.lectureType === 'article' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
                                                        >
                                                          <FileText size={16} /> Article
                                                        </button>
                                                        <button 
                                                          type="button" 
                                                          onClick={() => toggleLectureExpand(chapter.chapterId, lecture.lectureId)} 
                                                          className="ml-auto text-gray-500 hover:text-gray-800 flex items-center gap-1"
                                                        >
                                                          <ChevronUp size={16} /> Collapse
                                                        </button>
                                                      </div>
                                                      {/* Content Inputs */}
                                                      <div className="p-4">
                                                        {lecture.lectureType === 'video' || !lecture.lectureType ? (
                                                          <div className="space-y-4">
                                                            <div>
                                                              <label className="text-sm text-gray-600 font-medium mb-2 block">Video URL</label>
                                                              <input 
                                                                type="text" 
                                                                value={lecture.lectureUrl || ''}
                                                                onChange={(e) => handleUpdateLecture(chapter.chapterId, lecture.lectureId, 'lectureUrl', e.target.value)}
                                                                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" 
                                                                placeholder="https://youtube.com/watch?v=..." 
                                                              />
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                              <div>
                                                                <label className="text-sm text-gray-600 font-medium mb-2 block">Duration (minutes)</label>
                                                                <input 
                                                                  type="number" 
                                                                  min="0" 
                                                                  value={lecture.lectureDuration || ''}
                                                                  onChange={(e) => handleUpdateLecture(chapter.chapterId, lecture.lectureId, 'lectureDuration', parseInt(e.target.value) || 0)}
                                                                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" 
                                                                  placeholder="10" 
                                                                />
                                                              </div>
                                                              <div className="flex items-end pb-3">
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                  <input 
                                                                    type="checkbox" 
                                                                    checked={lecture.isPreviewFree || false}
                                                                    onChange={(e) => handleUpdateLecture(chapter.chapterId, lecture.lectureId, 'isPreviewFree', e.target.checked)}
                                                                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" 
                                                                  />
                                                                  <span className="text-sm text-gray-700">Free Preview</span>
                                                                </label>
                                                              </div>
                                                            </div>
                                                          </div>
                                                        ) : (
                                                          <div>
                                                            <label className="text-sm text-gray-600 font-medium mb-2 block">Article Content</label>
                                                            <textarea
                                                              value={lecture.lectureContent || ''}
                                                              onChange={(e) => handleUpdateLecture(chapter.chapterId, lecture.lectureId, 'lectureContent', e.target.value)}
                                                              className="w-full h-40 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                                                              placeholder="Write your article content here..."
                                                            />
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </Draggable>
                                          ))}
                                          {provided.placeholder}
                                        </div>
                                      )}
                                    </Droppable>

                                    {/* Add Lecture Button */}
                                    <AddLectureBar onAdd={(title) => handleAddLecture(chapter.chapterId, title)} />
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                {/* Empty State */}
                {chapters.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Layout className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No sections yet</h3>
                    <p className="text-gray-500 mb-6">Start building your curriculum by adding sections and lectures</p>
                  </div>
                )}

                {/* ADD NEW SECTION UI */}
                {!isAddingSection ? (
                  <button
                    type="button"
                    onClick={() => setIsAddingSection(true)}
                    className="flex items-center gap-2 bg-white border-2 border-dashed border-gray-300 text-gray-700 font-semibold px-6 py-4 rounded-lg mt-4 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all w-full justify-center"
                  >
                    <Plus size={20} /> Add New Section
                  </button>
                ) : (
                  <div className="bg-white border-2 border-indigo-500 rounded-lg p-6 shadow-lg mt-4">
                    <h3 className="font-semibold text-gray-900 mb-4">New Section</h3>
                    <input
                      type="text"
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                      placeholder="Enter Section Title"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      autoFocus
                    />
                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => setIsAddingSection(false)} className="px-4 py-2 font-medium text-gray-600 hover:text-gray-800">Cancel</button>
                      <button type="button" onClick={handleAddSection} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">Add Section</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};

export default AddCourse;