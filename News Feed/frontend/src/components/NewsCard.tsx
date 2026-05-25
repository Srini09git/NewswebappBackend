"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { MapPin, Globe, Volume2, VolumeX, X, Bookmark, Share2, MessageSquare, Send, Mail } from "lucide-react";
import axios from "axios";

interface CommentOut {
  _id: string;
  content: string;
  author: string;
  created_at: string;
  replies?: CommentOut[];
}

interface Post {
  _id: string;
  title: string;
  description: string;
  content?: string;
  image_url?: string;
  location: string;
  language: string;
  created_at: string;
  channel_name?: string;
  channel_email?: string;
  category?: string;
}

const getCategoryStyles = (category?: string) => {
  const cat = (category || "").toLowerCase();
  switch (cat) {
    case "technology":
      return "bg-blue-50/90 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100/50 dark:border-blue-900/30";
    case "politics":
      return "bg-rose-50/90 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100/50 dark:border-rose-900/30";
    case "business":
      return "bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-900/30";
    case "sports":
      return "bg-amber-50/90 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100/50 dark:border-amber-900/30";
    case "entertainment":
      return "bg-fuchsia-50/90 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-100/50 dark:border-fuchsia-900/30";
    case "world":
      return "bg-cyan-50/90 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-100/50 dark:border-cyan-900/30";
    case "health":
      return "bg-pink-50/90 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border-pink-100/50 dark:border-pink-900/30";
    case "environment":
      return "bg-green-50/90 dark:bg-green-950/40 text-green-600 dark:text-green-400 border-green-100/50 dark:border-green-900/30";
    default:
      return "bg-slate-50/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-100/50 dark:border-slate-800/40";
  }
};

const getInitials = (name: string) => {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
};

const avatarGradients = [
  "from-indigo-500 to-purple-600 shadow-indigo-500/10",
  "from-pink-500 to-rose-600 shadow-rose-500/10",
  "from-emerald-500 to-teal-600 shadow-emerald-500/10",
  "from-amber-500 to-orange-600 shadow-orange-500/10",
  "from-blue-500 to-sky-600 shadow-blue-500/10",
];

const getAvatarGradient = (name: string) => {
  if (!name) return avatarGradients[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarGradients[Math.abs(hash) % avatarGradients.length];
};

export default function NewsCard({ post }: { post: Post }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);

  // States for Save, Share, Comments, Follow
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowingChannel, setIsFollowingChannel] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [comments, setComments] = useState<CommentOut[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const imageUrl = post.image_url
    ? `http://127.0.0.1:8000${post.image_url}`
    : "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80";

  // Initial load
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("saved_posts");
    if (saved) {
      const savedIds = JSON.parse(saved);
      setIsSaved(savedIds.includes(post._id));
    }

    // Check followed channels
    if (post.channel_name) {
      const followed = localStorage.getItem("followed_channels");
      const followedList = followed ? JSON.parse(followed) : [];
      setIsFollowingChannel(followedList.includes(post.channel_name));
    }
  }, [post._id, post.channel_name]);

  // Sync saved status
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("saved_posts");
      if (saved) {
        const savedIds = JSON.parse(saved);
        setIsSaved(savedIds.includes(post._id));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('bookmarksUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bookmarksUpdated', handleStorageChange);
    };
  }, [post._id]);

  // Sync followed channels across cards
  useEffect(() => {
    const handleFollowChange = () => {
      if (post.channel_name) {
        const followed = localStorage.getItem("followed_channels");
        const followedList = followed ? JSON.parse(followed) : [];
        setIsFollowingChannel(followedList.includes(post.channel_name));
      }
    };
    window.addEventListener('storage', handleFollowChange);
    window.addEventListener('followedChannelsUpdated', handleFollowChange);
    
    return () => {
      window.removeEventListener('storage', handleFollowChange);
      window.removeEventListener('followedChannelsUpdated', handleFollowChange);
    };
  }, [post.channel_name]);

  const toggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const saved = localStorage.getItem("saved_posts");
    let savedIds: string[] = saved ? JSON.parse(saved) : [];
    if (savedIds.includes(post._id)) {
      savedIds = savedIds.filter(id => id !== post._id);
      setIsSaved(false);
    } else {
      savedIds.push(post._id);
      setIsSaved(true);
    }
    localStorage.setItem("saved_posts", JSON.stringify(savedIds));
    window.dispatchEvent(new Event('bookmarksUpdated'));
  };

  const toggleFollowChannel = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post.channel_name) return;
    
    const followed = localStorage.getItem("followed_channels");
    let followedList: string[] = followed ? JSON.parse(followed) : [];
    
    if (followedList.includes(post.channel_name)) {
      followedList = followedList.filter(name => name !== post.channel_name);
      setIsFollowingChannel(false);
    } else {
      followedList.push(post.channel_name);
      setIsFollowingChannel(true);
    }
    localStorage.setItem("followed_channels", JSON.stringify(followedList));
    window.dispatchEvent(new Event('followedChannelsUpdated'));
  };

  const fetchComments = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/posts/${post._id}/comments`);
      setComments(res.data);
    } catch (e) {
      console.error("Failed to fetch comments", e);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      fetchComments();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, post._id]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await axios.post(`http://127.0.0.1:8000/posts/${post._id}/comments`, {
        content: newComment,
        author: commentAuthor || "Anonymous",
        parent_id: replyTo
      });
      setNewComment("");
      setReplyTo(null);
      fetchComments();
    } catch (e) {
      console.error("Failed to submit comment", e);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/post/${post._id}` : '';
  const encodedTitle = encodeURIComponent(post.title);
  const encodedUrl = encodeURIComponent(shareUrl);

  useEffect(() => {
    return () => {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSpeaking]);

  useEffect(() => {
    if (!isModalOpen && isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isModalOpen, isSpeaking]);

  const toggleSpeak = (readFull: boolean = false) => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech is not supported in your browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      
      const translatedTitle = titleRef.current?.innerText || post.title;
      const translatedDesc = descRef.current?.innerText || post.description;
      let textToRead = `${translatedTitle}. ${translatedDesc}`;
      if (readFull && post.content) {
        textToRead += `. ${post.content}`;
      }
      
      const utterance = new SpeechSynthesisUtterance(textToRead);
      
      const langMap: Record<string, string> = {
        "English": "en-US",
        "Tamil": "ta-IN",
        "Hindi": "hi-IN",
        "Bengali": "bn-IN",
        "Marathi": "mr-IN",
        "Telugu": "te-IN",
        "Kannada": "kn-IN",
        "Gujarati": "gu-IN",
        "Urdu": "ur-PK"
      };
      
      const primaryLang = localStorage.getItem("user_language") || post.language;
      const targetLangCode = langMap[primaryLang] || "en-US";
      
      utterance.lang = targetLangCode;

      const voices = window.speechSynthesis.getVoices();
      const langPrefix = targetLangCode.split('-')[0];
      
      const matchingVoice = voices.find(
        (voice) => voice.lang === targetLangCode || voice.lang.startsWith(langPrefix)
      );
      
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-150 dark:border-slate-800/60 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={post.title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-80" />
        
        {/* Category Overlay Tag */}
        {post.category && (
          <div className="absolute top-3 left-3">
            <span className={`px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded-lg border backdrop-blur-md shadow-sm ${getCategoryStyles(post.category)}`}>
              {post.category}
            </span>
          </div>
        )}

        <div className="absolute top-3 right-3 flex gap-2">
          <span className="px-2 py-1 text-[10px] font-semibold bg-black/60 text-slate-200 border border-white/10 backdrop-blur-md rounded-lg flex items-center gap-1.5 shadow-sm">
            <Globe className="w-3 h-3" />
            <span>{post.language}</span>
          </span>
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-grow space-y-3">
        <div className="flex items-center justify-between text-[11px] font-bold tracking-wider">
          <div className="flex items-center gap-1.5 text-indigo-500 dark:text-indigo-400">
            <MapPin className="w-3.5 h-3.5" />
            <span>{post.location}</span>
          </div>
          {post.channel_name && (
            <span className="bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-100/50 dark:border-indigo-900/20 shadow-sm font-bold">
              {post.channel_name}
            </span>
          )}
        </div>
        
        <h3 ref={titleRef} className="text-lg font-bold font-display line-clamp-2 leading-snug text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
          {post.title}
        </h3>
        
        <p ref={descRef} className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 leading-relaxed flex-grow font-light">
          {post.description}
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-550">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </span>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={(e) => { e.stopPropagation(); toggleSpeak(false); }}
              className={`p-2 rounded-xl transition-all ${
                isSpeaking 
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 scale-105' 
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300'
              }`}
              title={isSpeaking ? "Stop reading" : "Listen to news"}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button 
              onClick={toggleSave}
              className={`p-2 rounded-xl transition-all ${
                isSaved 
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20 scale-105' 
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300'
              }`}
              title={isSaved ? "Remove Bookmark" : "Save News"}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowShareMenu(!showShareMenu); }}
                className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-xl text-slate-600 dark:text-slate-300 transition-all"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
              {showShareMenu && (
                <div className="absolute right-0 bottom-full mb-2 bg-white dark:bg-slate-850 rounded-xl shadow-xl border border-slate-200/50 dark:border-slate-800/80 py-1.5 w-36 z-10 flex flex-col overflow-hidden">
                  <a href={`https://api.whatsapp.com/send?text=${encodedTitle} - ${encodedUrl}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <span className="text-green-500">WA</span> WhatsApp
                  </a>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <span className="text-blue-600">FB</span> Facebook
                  </a>
                  <a href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <span className="text-sky-500">𝕏</span> Twitter/X
                  </a>
                </div>
              )}
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all ml-1.5 px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-955/25 rounded-xl flex items-center gap-1 group/btn"
            >
              <span>Read</span>
              <span className="group-hover/btn:translate-x-0.5 transition-transform duration-200">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-955/50 backdrop-blur-md"
              onClick={() => setIsModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.96, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.96, y: 15 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col border border-slate-100 dark:border-slate-800/80"
              >
                <div className="relative w-full h-64 sm:h-96 bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                  <img
                    src={imageUrl}
                    alt={post.title}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  
                  {/* Floating tags */}
                  {post.category && (
                    <div className="absolute bottom-6 left-6 sm:left-10">
                      <span className={`px-3 py-1 text-xs font-bold tracking-wider uppercase rounded-lg border backdrop-blur-md shadow-md ${getCategoryStyles(post.category)}`}>
                        {post.category}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-4 right-4 p-2.5 bg-black/40 text-slate-200 rounded-full hover:bg-black/60 hover:text-white backdrop-blur-md transition-all shadow-md active:scale-95"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 sm:p-10 flex flex-col gap-6">
                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <span className="flex items-center gap-1.5 text-indigo-500 dark:text-indigo-400">
                      <MapPin className="w-4 h-4" />
                      <span>{post.location}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-4 h-4" />
                      <span>{post.language}</span>
                    </span>
                    {post.channel_name && (
                      <div className="flex flex-col items-start gap-2">
                        <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-100/50 dark:border-indigo-900/20 shadow-sm font-extrabold text-[10px]">
                          {post.channel_name}
                        </span>
                        <button
                          onClick={toggleFollowChannel}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-all duration-300 cursor-pointer flex items-center gap-1 shadow-sm active:scale-95 ${
                            isFollowingChannel 
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent shadow-emerald-500/10 font-bold' 
                              : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {isFollowingChannel ? '✓ Following Channel' : '+ Follow Channel'}
                        </button>
                      </div>
                    )}
                    <span className="text-slate-400 dark:text-slate-500 font-medium">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                    <button 
                      onClick={() => toggleSpeak(true)}
                      className={`ml-auto flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                        isSpeaking 
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/10' 
                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                      title={isSpeaking ? "Stop reading" : "Listen to full news"}
                    >
                      {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      <span className="normal-case">{isSpeaking ? "Stop" : "Listen"}</span>
                    </button>
                  </div>
                  
                  <h2 className="text-2xl sm:text-4xl font-bold font-display text-slate-900 dark:text-white leading-tight">
                    {post.title}
                  </h2>
                  
                  <p className="text-base sm:text-lg font-light text-slate-600 dark:text-slate-400 border-l-4 border-indigo-500 pl-4 leading-relaxed italic">
                    {post.description}
                  </p>
                  
                  <div 
                    className="mt-4 text-base sm:text-lg leading-relaxed text-slate-800 dark:text-slate-200 ql-editor !p-0 font-light prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: post.content || "No additional content provided." }}
                  />
                  
                  {/* Comments Section */}
                  <div className="mt-12 pt-10 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2.5 mb-8">
                      <MessageSquare className="w-6 h-6 text-indigo-500" />
                      <h3 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">Discussion</h3>
                    </div>

                    <form onSubmit={handleCommentSubmit} className="mb-10 flex flex-col gap-4">
                      <div className="flex gap-4">
                        <input
                          type="text"
                          placeholder="Your name (optional)"
                          value={commentAuthor}
                          onChange={(e) => setCommentAuthor(e.target.value)}
                          className="w-full sm:w-1/3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all animate-all"
                        />
                      </div>
                      <div className="relative">
                        <textarea
                          placeholder={replyTo ? "Write a reply to this thread..." : "Add your perspective..."}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="w-full px-4 py-3 pr-14 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[100px] resize-y text-sm transition-all"
                        />
                        <button
                          type="submit"
                          className="absolute right-3 bottom-3 p-2.5 bg-gradient-to-tr from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-500/20 active:scale-95 cursor-pointer"
                          title="Submit Comment"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                      {replyTo && (
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <span>Replying to a thread</span>
                          <button type="button" onClick={() => setReplyTo(null)} className="text-indigo-500 hover:underline">Cancel Reply</button>
                        </div>
                      )}
                    </form>

                    <div className="space-y-6">
                      {comments.map((comment) => (
                        <div key={comment._id} className="bg-slate-50/50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-100 dark:border-slate-850">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${getAvatarGradient(comment.author)} flex items-center justify-center text-white text-sm font-bold shadow-md`}>
                              {getInitials(comment.author)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-slate-900 dark:text-white">{comment.author}</span>
                              <span className="text-[10px] text-slate-400">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                            </div>
                          </div>
                          <p className="text-slate-600 dark:text-slate-350 text-sm mb-3 pl-11 font-light leading-relaxed">{comment.content}</p>
                          <div className="pl-11">
                            <button 
                              onClick={() => setReplyTo(comment._id)}
                              className="text-[11px] font-bold text-indigo-500 hover:text-indigo-600 hover:underline"
                            >
                              Reply
                            </button>
                          </div>
                          
                          {/* Replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-4 pl-6 sm:pl-11 border-l border-slate-200 dark:border-slate-800 space-y-4">
                              {comment.replies.map(reply => (
                                <div key={reply._id} className="pt-2">
                                  <div className="flex items-center gap-2.5 mb-2">
                                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${getAvatarGradient(reply.author)} flex items-center justify-center text-white text-[10px] font-bold shadow-sm`}>
                                      {getInitials(reply.author)}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-semibold text-xs text-slate-900 dark:text-white">{reply.author}</span>
                                      <span className="text-[9px] text-slate-400">{formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}</span>
                                    </div>
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-slate-355 pl-8 font-light leading-relaxed">{reply.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {comments.length === 0 && (
                        <p className="text-center text-slate-400 dark:text-slate-550 py-10 text-sm font-light">No comments yet. Be the first to share your thoughts!</p>
                      )}
                    </div>
                  </div>

                  {/* Channel Contact Info Card (Secondary Card below comments) */}
                  {post.channel_name && post.channel_email && (
                    <div className="mt-8 p-6 rounded-2xl bg-indigo-50/30 dark:bg-slate-900/40 border border-indigo-100/50 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all hover:border-indigo-200/60 dark:hover:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/10">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{post.channel_name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Get in touch with the publisher for queries or feedback</p>
                        </div>
                      </div>
                      <a 
                        href={`mailto:${post.channel_email}`} 
                        className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-indigo-600 dark:text-indigo-400 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>{post.channel_email}</span>
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}
