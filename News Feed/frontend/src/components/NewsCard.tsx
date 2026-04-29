"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { MapPin, Globe, Volume2, VolumeX, X } from "lucide-react";

interface Post {
  _id: string;
  title: string;
  description: string;
  content?: string;
  image_url?: string;
  location: string;
  language: string;
  created_at: string;
}

export default function NewsCard({ post }: { post: Post }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);

  const imageUrl = post.image_url
    ? `http://127.0.0.1:8000${post.image_url}`
    : "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80";

  useEffect(() => {
    setMounted(true);
  }, []);

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
      
      // Get the user's primary language setting, default to post's original language if not found
      const primaryLang = localStorage.getItem("user_language") || post.language;
      const targetLangCode = langMap[primaryLang] || "en-US";
      
      utterance.lang = targetLangCode;

      // Try to explicitly set the voice to match the language
      const voices = window.speechSynthesis.getVoices();
      const langPrefix = targetLangCode.split('-')[0]; // e.g., 'ta' from 'ta-IN'
      
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
      className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="relative h-48 w-full overflow-hidden bg-gray-100 dark:bg-slate-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={post.title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 right-3 flex gap-2">
          <span className="px-2 py-1 text-xs font-medium bg-black/50 text-white backdrop-blur-md rounded-lg flex items-center gap-1">
            <Globe className="w-3 h-3" />
            <span>{post.language}</span>
          </span>
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center gap-2 text-xs text-primary font-semibold mb-2 uppercase tracking-wider">
          <MapPin className="w-3 h-3" />
          <span>{post.location}</span>
        </div>
        
        <h3 ref={titleRef} className="text-xl font-bold mb-2 line-clamp-2 leading-tight text-gray-900 dark:text-white">
          {post.title}
        </h3>
        
        <p ref={descRef} className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3 flex-grow">
          {post.description}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-slate-800">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
          </span>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => toggleSpeak(false)}
              className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                isSpeaking ? 'text-red-500 hover:text-red-600' : 'text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary'
              }`}
              title={isSpeaking ? "Stop reading" : "Listen to news"}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isSpeaking ? "Stop" : "Listen"}</span>
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-sm font-medium text-primary hover:text-indigo-400 transition-colors"
            >
              <span>Read More</span>
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col border border-gray-200 dark:border-gray-800"
            >
              <div className="relative w-full h-64 sm:h-80 bg-gray-100 dark:bg-slate-800 flex-shrink-0">
                <img
                  src={imageUrl}
                  alt={post.title}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 backdrop-blur-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 sm:p-10 flex flex-col gap-6">
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-wider text-primary">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{post.location}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    <span>{post.language}</span>
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                  </span>
                  <button 
                    onClick={() => toggleSpeak(true)}
                    className={`ml-auto flex items-center gap-1 text-sm font-medium transition-colors ${
                      isSpeaking ? 'text-red-500 hover:text-red-600' : 'text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary'
                    }`}
                    title={isSpeaking ? "Stop reading" : "Listen to full news"}
                  >
                    {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    <span className="normal-case">{isSpeaking ? "Stop" : "Listen"}</span>
                  </button>
                </div>
                
                <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                  <span>{post.title}</span>
                </h2>
                
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300 border-l-4 border-primary pl-4">
                  <span>{post.description}</span>
                </p>
                
                <div className="mt-4 text-base sm:text-lg leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  <span>{post.content || "No additional content provided."}</span>
                </div>
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
