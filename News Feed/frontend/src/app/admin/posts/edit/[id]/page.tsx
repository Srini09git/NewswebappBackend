"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import PostForm from "@/components/PostForm";

export default function EditPostPage() {
  const params = useParams();
  const id = params.id as string;
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/posts/${id}`);
        setInitialData(response.data);
      } catch (err: any) {
        setError("Failed to load post. It may have been deleted.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
        Loading post data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-10 text-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl mb-4">
          {error}
        </div>
        <Link href="/admin/dashboard" className="text-primary hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <PostForm initialData={initialData} postId={id} isEdit={true} />
    </div>
  );
}
