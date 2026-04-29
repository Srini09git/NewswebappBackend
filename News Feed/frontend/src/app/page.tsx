"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Loader2, Settings } from "lucide-react";
import LanguageModal from "@/components/LanguageModal";
import UserSettingsPanel from "@/components/UserSettingsPanel";
import NewsCard from "@/components/NewsCard";

interface Post {
  _id: string;
  title: string;
  description: string;
  image_url?: string;
  location: string;
  language: string;
  created_at: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Settings for the feed
  const [locationPref, setLocationPref] = useState<string>("Global");
  const [languagePref, setLanguagePref] = useState<string>("English");
  const [secondaryLanguagePref, setSecondaryLanguagePref] = useState<string>("None");
  const [categoryPref, setCategoryPref] = useState<string>("All");

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [hasPreferences, setHasPreferences] = useState(false);

  useEffect(() => {
    // Check if initial load
    const savedLocation = localStorage.getItem("user_location");
    const savedLanguage = localStorage.getItem("user_language");
    const savedSecondary = localStorage.getItem("user_secondary_language");
    const savedCategory = localStorage.getItem("user_category");
    
    if (savedLocation && savedLanguage) {
      setLocationPref(savedLocation);
      setLanguagePref(savedLanguage);
      if (savedSecondary) setSecondaryLanguagePref(savedSecondary);
      if (savedCategory) setCategoryPref(savedCategory);
      setHasPreferences(true);
    }
  }, []);

  useEffect(() => {
    if (hasPreferences) {
      fetchPosts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationPref, languagePref, secondaryLanguagePref, categoryPref, hasPreferences]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://127.0.0.1:8000/posts/", {
        params: {
          location: locationPref !== "Global" ? locationPref : undefined,
          language: languagePref,
          secondary_language: secondaryLanguagePref !== "None" ? secondaryLanguagePref : undefined,
          category: categoryPref !== "All" ? categoryPref : undefined,
          limit: 20
        }
      });
      setPosts(response.data);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const setTranslationCookie = (lang: string) => {
    const map: Record<string, string> = {
      "English": "en",
      "Tamil": "ta",
      "Hindi": "hi",
      "Bengali": "bn",
      "Marathi": "mr",
      "Telugu": "te",
      "Kannada": "kn",
      "Gujarati": "gu",
      "Urdu": "ur"
    };
    const code = map[lang] || "en";
    document.cookie = `googtrans=/auto/${code}; path=/;`;
    document.cookie = `googtrans=/auto/${code}; domain=.${window.location.hostname}; path=/;`;
  };

  const handlePreferencesSaved = (loc: string, lang: string) => {
    const changedLang = lang !== languagePref;
    setLocationPref(loc);
    setLanguagePref(lang);
    setHasPreferences(true);
    if (changedLang) {
      setTranslationCookie(lang);
      window.location.reload();
    }
  };

  const handleSettingsSaved = (prefs: any) => {
    const changedLang = prefs.language !== languagePref;
    setLocationPref(prefs.location);
    setLanguagePref(prefs.language);
    setSecondaryLanguagePref(prefs.secondaryLanguage);
    setCategoryPref(prefs.category);
    setHasPreferences(true);
    if (changedLang) {
      setTranslationCookie(prefs.language);
      window.location.reload();
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <LanguageModal onSave={handlePreferencesSaved} />
      <UserSettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSave={handleSettingsSaved} 
      />
      
      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur flex-none transition-colors duration-500 border-b border-slate-900/10 dark:border-slate-50/[0.06] bg-white/95 dark:bg-slate-900/75 supports-backdrop-blur:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl">
              N
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">
              NewsFeed
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="hidden lg:inline-block text-slate-500 dark:text-slate-400">
              Showing news for:
            </span>
            <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 items-center">
              <span className="px-3 py-1 rounded-md bg-white dark:bg-slate-700 shadow-sm text-primary">
                {locationPref}
              </span>
              <span className="px-3 py-1 rounded-md">
                {languagePref} {secondaryLanguagePref !== "None" ? `& ${secondaryLanguagePref}` : ""}
              </span>
              {categoryPref !== "All" && (
                <span className="px-3 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 capitalize">
                  {categoryPref}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10 text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Latest Headlines
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Stay updated with the most important stories happening around you.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">
              Finding the best stories for you...
            </p>
          </div>
        ) : (
          <>
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                  <NewsCard key={post._id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-3xl mb-4">
                  📰
                </div>
                <h3 className="text-xl font-bold mb-2">No Stories Found</h3>
                <p className="text-slate-500 dark:text-slate-400">
                  We couldn&apos;t find any news matching your current filters ({locationPref}, {languagePref}).
                </p>
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="mt-6 text-primary hover:underline font-medium"
                >
                  Change Preferences
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
