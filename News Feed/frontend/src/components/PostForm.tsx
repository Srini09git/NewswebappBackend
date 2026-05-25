"use client";

import { useState, useMemo } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { Loader2, Upload, Eye, EyeOff, Globe, Tag, Layout, ChevronLeft, Save, Globe2, Search, Info, Code, FileText } from "lucide-react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

// Dynamic import for ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { 
  ssr: false,
  loading: () => <div className="h-64 w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
});

interface PostData {
  title: string;
  description: string;
  content: string;
  language: string;
  location: string;
  category?: string;
  excerpt?: string;
  status: string;
  tags?: string;
  meta_title?: string;
  meta_description?: string;
  image_url?: string;
}

interface PostFormProps {
  initialData?: PostData;
  postId?: string;
  isEdit?: boolean;
}

export default function PostForm({ initialData, postId, isEdit = false }: PostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null);

  const [formData, setFormData] = useState<PostData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    content: initialData?.content || "",
    language: initialData?.language || "English",
    location: initialData?.location || "Global",
    category: initialData?.category || "politics",
    excerpt: initialData?.excerpt || "",
    status: initialData?.status || "Visible",
    tags: initialData?.tags || "",
    meta_title: initialData?.meta_title || "",
    meta_description: initialData?.meta_description || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (value: string) => {
    setFormData(prev => ({ ...prev, content: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Basic client-side validation
    if (!formData.title.trim()) {
      setError("Title is required");
      setLoading(false);
      return;
    }
    if (!formData.description.trim()) {
      setError("Short Description is required");
      setLoading(false);
      return;
    }
    if (!formData.content.trim() || formData.content === "<p><br></p>") {
      setError("Content is required");
      setLoading(false);
      return;
    }

    try {
      const token = Cookies.get("admin_token");
      const submitData = new FormData();
      
      (Object.keys(formData) as Array<keyof PostData>).forEach(key => {
        if (formData[key] !== undefined && formData[key] !== null) {
          submitData.append(key, formData[key] as string);
        }
      });

      if (imageFile) {
        submitData.append("image", imageFile);
      }

      const url = isEdit && postId 
        ? `http://127.0.0.1:8000/posts/${postId}` 
        : "http://127.0.0.1:8000/posts/";
      
      const method = isEdit ? "put" : "post";

      await axios({
        method,
        url,
        data: submitData,
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data" 
        }
      });
      
      router.push("/admin/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("Post submission error:", err);
      let errorMessage = "An error occurred while saving the post.";
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === "string") {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          // Format validation errors from FastAPI
          errorMessage = detail.map((d: any) => 
            d.loc ? `${d.loc[d.loc.length - 1]}: ${d.msg}` : d.msg
          ).join(", ");
        } else {
          errorMessage = JSON.stringify(detail);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ],
  }), []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => router.push("/admin/dashboard")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? "Edit Post" : "Add blog post"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/dashboard")}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-6 py-2 font-semibold rounded-lg transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 ${
              isFocused 
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 dark:shadow-none ring-2 ring-blue-500/20" 
                : "bg-black dark:bg-white text-white dark:text-black hover:opacity-90"
            }`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? "Save Changes" : "Save Post"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg flex items-start gap-3">
          <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Title
                </label>
                <input
                  required
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Blog about your latest products or deals"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none transition-all text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Content
                </label>
                <div className={`quill-wrapper border relative rounded-xl overflow-hidden transition-all duration-300 ${
                  isFocused 
                    ? "border-black dark:border-white ring-4 ring-black/5 dark:ring-white/10 shadow-lg" 
                    : "border-gray-200 dark:border-white/20 shadow-sm"
                }`}>
                  {/* Integrated Toggle Button */}
                  <div className="absolute top-0 right-0 z-10 p-1.5 h-[42px] flex items-center bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-white/20">
                    <button
                      type="button"
                      onClick={() => setIsHtmlMode(!isHtmlMode)}
                      className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-black dark:hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 border border-transparent hover:border-gray-200 dark:hover:border-white/20"
                      title={isHtmlMode ? "Switch to Rich Text" : "Switch to HTML Code"}
                    >
                      {isHtmlMode ? (
                        <>
                          <FileText className="w-3 h-3" />
                          Rich Text
                        </>
                      ) : (
                        <>
                          <Code className="w-3 h-3" />
                          HTML
                        </>
                      )}
                    </button>
                  </div>

                  {isHtmlMode ? (
                    <textarea
                      value={formData.content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      className={`w-full min-h-[350px] p-4 font-mono text-sm focus:outline-none resize-y transition-colors duration-300 ${
                        isFocused ? "bg-gray-900 text-blue-50" : "bg-gray-950 text-gray-300"
                      }`}
                      placeholder="Paste or write HTML code here..."
                    />
                  ) : (
                    <ReactQuill 
                      theme="snow"
                      value={formData.content}
                      onChange={handleContentChange}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      modules={quillModules}
                      className="min-h-[350px]"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Short Description */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Short Description
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Add a brief summary of the post to appear on the home page cards.
            </p>
            <textarea
              required
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Short summary of the post..."
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none transition-all text-gray-900 dark:text-white resize-none"
            />
          </div>

          {/* SEO Listing */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search engine listing
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Add a title and description to see how this blog post might appear in a search engine listing.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Page title
                </label>
                <input
                  name="meta_title"
                  value={formData.meta_title}
                  onChange={handleChange}
                  placeholder="SEO Title"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none transition-all text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Meta description
                </label>
                <textarea
                  name="meta_description"
                  rows={3}
                  value={formData.meta_description}
                  onChange={handleChange}
                  placeholder="Brief description for search engines..."
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none transition-all text-gray-900 dark:text-white resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Visibility */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Visibility
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, status: "Visible" }))}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  formData.status === "Visible"
                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                Visible <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, status: "Hidden" }))}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  formData.status === "Hidden"
                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                Hidden <EyeOff className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Featured Image</h3>
            <div className="relative group">
              <div className={`aspect-video rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center p-4 transition-all hover:border-black dark:hover:border-white overflow-hidden bg-gray-50 dark:bg-gray-800 ${imagePreview ? 'border-none' : ''}`}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-500 text-center font-medium">Add image or drop to upload</p>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
              </div>
              {imagePreview && (
                <button 
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Organization */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Globe2 className="w-4 h-4" />
              Organization
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none transition-all text-sm"
                >
                  <option value="politics">Politics</option>
                  <option value="business">Business</option>
                  <option value="technology">Technology</option>
                  <option value="sports">Sports</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="world/international">World/International</option>
                  <option value="health/wellness">Health/Wellness</option>
                  <option value="environment">Environment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Language
                </label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none transition-all text-sm"
                >
                  <option value="English">English</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Location
                </label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none transition-all text-sm"
                >
                  <option value="Global">Global</option>
                  <option value="India">India</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="USA">USA</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Tags
                </label>
                <input
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="News, Tech, Update..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none transition-all text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Mobile/Sticky (optional) */}
      <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 flex justify-end lg:hidden">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full sm:w-auto px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isEdit ? "Update Post" : "Publish Post"}
        </button>
      </div>

      <style jsx global>{`
        .ql-container {
          font-family: inherit;
          font-size: 1rem;
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
          background-color: #ffffff;
        }
        .dark .ql-container {
          background-color: #0f172a; /* Deep Navy Background */
          color: #f1f5f9;
        }
        .ql-toolbar {
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
          background-color: transparent;
          border-color: #e2e8f0 !important;
          transition: all 0.3s ease;
          padding-right: 80px !important;
        }
        .dark .ql-toolbar {
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
        .ql-stroke {
          stroke: #111827 !important; /* Black in light mode */
        }
        .ql-fill {
          fill: #111827 !important;
        }
        .ql-picker {
          color: #111827 !important;
        }
        .dark .ql-stroke {
          stroke: #ffffff !important; /* White in dark mode */
        }
        .dark .ql-fill {
          fill: #ffffff !important;
        }
        .dark .ql-picker {
          color: #ffffff !important;
        }
        .quill-wrapper.border-black .ql-stroke,
        .quill-wrapper.border-white .ql-stroke {
          stroke: #3b82f6 !important; /* Blue on focus */
        }
        .quill-wrapper.border-black .ql-fill,
        .quill-wrapper.border-white .ql-fill {
          fill: #3b82f6 !important;
        }
        .quill-wrapper.border-black .ql-picker,
        .quill-wrapper.border-white .ql-picker {
          color: #3b82f6 !important;
        }
        .ql-toolbar .ql-active .ql-stroke,
        .ql-toolbar .ql-active .ql-fill {
          stroke: #2563eb !important;
          fill: #2563eb !important;
        }
        .ql-container {
          background-color: #ffffff;
        }
        .dark .ql-container {
          background-color: #0c1120;
        }
        .ql-editor {
          min-height: 350px;
        }
      `}</style>
    </div>
  );
}
