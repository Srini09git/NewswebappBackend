"use client";

import { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";

interface PostData {
  title: string;
  description: string;
  content: string;
  language: string;
  location: string;
  category?: string;
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
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<PostData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    content: initialData?.content || "",
    language: initialData?.language || "English",
    location: initialData?.location || "Global",
    category: initialData?.category || "politics",
    meta_title: initialData?.meta_title || "",
    meta_description: initialData?.meta_description || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = Cookies.get("admin_token");
      const submitData = new FormData();
      
      (Object.keys(formData) as Array<keyof PostData>).forEach(key => {
        if (formData[key]) {
          submitData.append(key, formData[key] as string);
        }
      });

      if (imageFile) {
        submitData.append("image", imageFile);
      }

      if (isEdit && postId) {
        await axios.put(`http://127.0.0.1:8000/posts/${postId}`, submitData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data" 
          }
        });
      } else {
        await axios.post("http://127.0.0.1:8000/posts/", submitData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data" 
          }
        });
      }
      
      router.push("/admin/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.detail || "An error occurred while saving the post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title *
            </label>
            <input
              required
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-transparent"
              placeholder="News Headline"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Short Description *
            </label>
            <textarea
              required
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-transparent"
              placeholder="A brief summary for the news card"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Content *
            </label>
            <textarea
              required
              name="content"
              rows={8}
              value={formData.content}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-transparent"
              placeholder="The complete article text..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Location *
            </label>
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-transparent"
            >
              <option value="Global">Global</option>
              <option value="India">India</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="USA">USA</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Language *
            </label>
            <select
              name="language"
              value={formData.language}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-transparent"
            >
              <option value="English">English</option>
              <option value="Tamil">Tamil</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-transparent"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Meta Title (SEO)
            </label>
            <input
              name="meta_title"
              value={formData.meta_title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Meta Description (SEO)
            </label>
            <input
              name="meta_description"
              value={formData.meta_description}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Featured Image
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-primary transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-primary hover:text-indigo-500 focus-within:outline-none">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  PNG, JPG, GIF up to 5MB
                </p>
                {imageFile && <p className="text-sm font-medium text-green-600 mt-2">Selected: {imageFile.name}</p>}
                {!imageFile && initialData?.image_url && <p className="text-sm text-gray-500 mt-2">Current image will be kept if no new file is uploaded.</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push("/admin/dashboard")}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors flex items-center disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            {isEdit ? "Update Post" : "Publish Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
