"use client";

import PostForm from "@/components/PostForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CreatePostPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/dashboard" 
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Post</h1>
      </div>
      
      <p className="text-gray-600 dark:text-gray-400 mb-8 ml-11">
        Publish a new story to the news feed. Ensure location and language tags are properly set.
      </p>

      <PostForm />
    </div>
  );
}
