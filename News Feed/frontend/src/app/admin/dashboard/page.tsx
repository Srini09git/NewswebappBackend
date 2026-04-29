"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { formatDistanceToNow } from "date-fns";
import { Edit, Trash2, PlusCircle, AlertCircle } from "lucide-react";

interface Post {
  _id: string;
  title: string;
  location: string;
  language: string;
  category?: string;
  author?: string;
  created_at: string;
}

interface DecodedToken {
  sub: string;
  role: string;
}

export default function AdminDashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const fetchPosts = async () => {
    try {
      const token = Cookies.get("admin_token");
      const response = await axios.get("http://127.0.0.1:8000/posts/admin-posts", { 
        params: { limit: 100 },
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(response.data);
    } catch (err) {
      setError("Failed to fetch posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = Cookies.get("admin_token");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setIsSuperAdmin(decoded.role === "super_admin");
      } catch (e) {
        console.error("Failed to decode token", e);
      }
    }
    fetchPosts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    
    try {
      const token = Cookies.get("admin_token");
      await axios.delete(`http://127.0.0.1:8000/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPosts(); // Refresh list
    } catch (err) {
      alert("Failed to delete post.");
    }
  };

  if (loading) return <div className="py-20 text-center text-gray-500">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex sm:items-center justify-between flex-col sm:flex-row gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">News Posts</h1>
        <Link 
          href="/admin/posts/new"
          className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-indigo-600 transition-colors"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Create New Post
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-400">Title</th>
                <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-400">Location</th>
                <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-400">Language</th>
                <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-400">Category</th>
                {isSuperAdmin && <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-400">Author</th>}
                <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-400">Created</th>
                <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 7 : 6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No posts found. Start by creating one.
                  </td>
                </tr>
              ) : (
                posts.map(post => (
                  <tr key={post._id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-150">
                    <td className="p-4">
                      <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{post.title}</p>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">
                      <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-md">
                        {post.location}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">
                      <span className="inline-block px-2 py-1 text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-md">
                        {post.language}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">
                      {post.category && (
                        <span className="inline-block px-2 py-1 text-xs bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-md capitalize">
                          {post.category}
                        </span>
                      )}
                    </td>
                    {isSuperAdmin && (
                      <td className="p-4 text-gray-600 dark:text-gray-300">
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-bold mr-2">
                            {post.author ? post.author.charAt(0).toUpperCase() : 'A'}
                          </div>
                          <span className="font-medium text-sm">
                            {post.author || 'Admin'}
                          </span>
                        </div>
                      </td>
                    )}
                    <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Link 
                        href={`/admin/posts/edit/${post._id}`}
                        className="inline-flex items-center justify-center p-2 text-gray-500 hover:text-primary hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(post._id)}
                        className="inline-flex items-center justify-center p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
