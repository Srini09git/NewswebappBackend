"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Loader2, Settings, Search, Mic, Bookmark, Menu, Heart, X, Newspaper } from "lucide-react";
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
  channel_name?: string;
  channel_email?: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // Settings for the feed
  const [locationPref, setLocationPref] = useState<string>("Global");
  const [languagePref, setLanguagePref] = useState<string>("English");
  const [secondaryLanguagePref, setSecondaryLanguagePref] = useState<string>("None");
  const [categoryPref, setCategoryPref] = useState<string>("All");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasPreferences, setHasPreferences] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [showFollowedOnly, setShowFollowedOnly] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Listen for storage events (e.g., when a post is saved in NewsCard)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("saved_posts");
      if (saved) {
        setSavedPostIds(new Set(JSON.parse(saved)));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    // Custom event for same-tab updates
    window.addEventListener('bookmarksUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bookmarksUpdated', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    // Check if initial load
    const savedLocation = localStorage.getItem("user_location");
    const savedLanguage = localStorage.getItem("user_language");
    const savedSecondary = localStorage.getItem("user_secondary_language");
    const savedCategory = localStorage.getItem("user_category");
    const savedActive = localStorage.getItem("active_language");
    
    if (savedLocation && savedLanguage) {
      setLocationPref(savedLocation);
      setLanguagePref(savedLanguage);
      if (savedSecondary) setSecondaryLanguagePref(savedSecondary);
      if (savedCategory) setCategoryPref(savedCategory);
      setHasPreferences(true);
      setActiveLanguage(savedActive || savedLanguage);
    }

    const saved = localStorage.getItem("saved_posts");
    if (saved) {
      setSavedPostIds(new Set(JSON.parse(saved)));
    }
  }, []);

  useEffect(() => {
    if (hasPreferences) {
      fetchPosts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationPref, languagePref, secondaryLanguagePref, categoryPref, hasPreferences, showSavedOnly]);

  const fetchPosts = async (queryOverride?: string) => {
    setLoading(true);
    try {
      const q = typeof queryOverride === 'string' ? queryOverride : searchQuery;
      let params: any = {
        location: locationPref !== "Global" ? locationPref : undefined,
        language: languagePref,
        secondary_language: secondaryLanguagePref !== "None" ? secondaryLanguagePref : undefined,
        category: categoryPref !== "All" ? categoryPref : undefined,
        limit: 20
      };

      if (q) {
        params.search_query = q;
      }
      
      if (showSavedOnly) {
        if (savedPostIds.size === 0) {
          setPosts([]);
          setLoading(false);
          return;
        }
        params.post_ids = Array.from(savedPostIds).join(",");
        delete params.location;
        delete params.language;
        delete params.secondary_language;
        delete params.category;
      }

      const response = await axios.get("http://127.0.0.1:8000/posts/", { params });
      setPosts(response.data);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleListen = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = languagePref === "English" ? "en-US" : (languagePref === "Tamil" ? "ta-IN" : "en-US");
    
    recognition.onstart = () => {
      setIsListening(true);
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      fetchPosts(transcript);
    };
    
    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts(searchQuery);
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
    localStorage.setItem("active_language", lang);
  };

  const handlePreferencesSaved = (loc: string, lang: string, secLang: string) => {
    setLocationPref(loc);
    setLanguagePref(lang);
    setSecondaryLanguagePref(secLang);
    setHasPreferences(true);
    setTranslationCookie(lang);
    window.location.reload();
  };

  const handleSettingsSaved = (prefs: any) => {
    setLocationPref(prefs.location);
    setLanguagePref(prefs.language);
    setSecondaryLanguagePref(prefs.secondaryLanguage);
    setCategoryPref(prefs.category);
    setHasPreferences(true);
    setTranslationCookie(prefs.language);
    window.location.reload();
  };

  const toggleLanguage = (lang: string) => {
    if (activeLanguage !== lang) {
      setTranslationCookie(lang);
      setActiveLanguage(lang);
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
      <header className="sticky top-0 z-40 w-full backdrop-blur-md flex-none transition-all duration-300 border-b border-slate-200/50 dark:border-slate-800/40 bg-white/80 dark:bg-slate-950/75 supports-backdrop-blur:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div 
            onClick={() => {
              setShowFollowedOnly(false);
              setShowSavedOnly(false);
              setIsMenuOpen(false);
            }}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/5 hover:rotate-6 transition-transform duration-300">
              N
            </div>
            <span className="text-2xl font-extrabold font-display tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
              News<span className="font-light text-slate-400 dark:text-slate-550">Feed</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm font-medium">
            {mounted && (
              <>
                <div className="hidden sm:flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 items-center gap-1 border border-slate-200/30 dark:border-slate-800/50">
                  <button
                    onClick={() => toggleLanguage(languagePref)}
                    suppressHydrationWarning
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                      activeLanguage === languagePref
                        ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400 font-bold"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    {languagePref}
                  </button>
                  {secondaryLanguagePref !== "None" && (
                    <>
                      <div className="w-px h-3 bg-slate-300 dark:bg-slate-800 mx-0.5" />
                      <button
                        onClick={() => toggleLanguage(secondaryLanguagePref)}
                        suppressHydrationWarning
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                          activeLanguage === secondaryLanguagePref
                            ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400 font-bold"
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        }`}
                      >
                        {secondaryLanguagePref}
                      </button>
                    </>
                  )}
                </div>
                
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100/40 dark:border-indigo-900/30 font-semibold text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="capitalize">{locationPref}</span>
                  {categoryPref !== "All" && (
                    <>
                      <span className="text-indigo-300 dark:text-indigo-700">•</span>
                      <span className="capitalize">{categoryPref}</span>
                    </>
                  )}
                </div>
              </>
            )}

            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                suppressHydrationWarning
                className={`p-2.5 rounded-xl border transition-all hover:scale-105 cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-300`}
                aria-label="Menu"
                title="Menu"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {isMenuOpen && (
                <>
                  {/* Backdrop overlay to close menu */}
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setIsMenuOpen(false)}
                  />                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl bg-white/95 dark:bg-slate-900/98 border border-slate-200/50 dark:border-slate-800/80 shadow-2xl p-2 z-50 flex flex-col gap-1">
                    <button
                      onClick={() => {
                        setShowFollowedOnly(false);
                        setShowSavedOnly(false);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        !showFollowedOnly && !showSavedOnly
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold' 
                          : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-350 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Newspaper className="w-4 h-4" />
                        <span>News Feed</span>
                      </div>
                      {!showFollowedOnly && !showSavedOnly && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                    </button>

                    <button
                      onClick={() => {
                        setShowFollowedOnly(!showFollowedOnly);
                        setShowSavedOnly(false);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        showFollowedOnly 
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold' 
                          : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-350 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Heart className={`w-4 h-4 ${showFollowedOnly ? 'fill-current' : ''}`} />
                        <span>Follow / Fav Channels</span>
                      </div>
                      {showFollowedOnly && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                    </button>

                    <button
                      onClick={() => {
                        setShowSavedOnly(!showSavedOnly);
                        setShowFollowedOnly(false);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        showSavedOnly 
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold' 
                          : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-350 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Bookmark className={`w-4 h-4 ${showSavedOnly ? 'fill-current' : ''}`} />
                        <span>Saved Stories</span>
                      </div>
                      {showSavedOnly && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                    </button>

                    <div className="h-px bg-slate-100 dark:bg-slate-800/60 my-1 mx-2" />

                    <button
                      onClick={() => {
                        setIsSettingsOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-350 dark:hover:text-slate-200 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 max-w-3xl mx-auto text-center space-y-5">
          <h1 className="text-4xl sm:text-6xl font-extrabold font-display tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-white dark:via-indigo-100 dark:to-white">
            {showSavedOnly ? "Saved Stories" : showFollowedOnly ? "Followed Channels" : "Latest Headlines"}
          </h1>
          <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
            {showSavedOnly 
              ? "Your personalized workspace for stories you've saved to read later." 
              : showFollowedOnly
              ? "Showing news stories from the channels you are following."
              : "Discover localized, multi-language news feeds tailored to your location and interests."}
          </p>
          
          {!showSavedOnly && (
            <form onSubmit={handleSearchSubmit} className="relative mt-8 flex items-center justify-center max-w-xl mx-auto group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Search news by keywords, categories, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                suppressHydrationWarning
                className="w-full pl-12 pr-24 py-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-lg shadow-slate-100/40 dark:shadow-none transition-all duration-300"
              />
              <div className="absolute right-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleListen}
                  suppressHydrationWarning
                  className={`p-2 rounded-xl transition-all duration-300 ${
                    isListening 
                      ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30 scale-105' 
                      : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                  }`}
                  title="Voice Search"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button 
                  type="submit" 
                  suppressHydrationWarning
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/25 active:scale-95"
                  title="Search"
                >
                  Search
                </button>
              </div>
            </form>
          )}
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
            {(() => {
              const followed = typeof window !== 'undefined' ? localStorage.getItem("followed_channels") : null;
              const followedList = followed ? JSON.parse(followed) : [];
              const displayPosts = showFollowedOnly 
                ? posts.filter(post => post.channel_name && followedList.includes(post.channel_name))
                : posts;

              return displayPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {displayPosts.map((post) => (
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
                    {showFollowedOnly 
                      ? "You aren't following any channels with stories under these filters, or haven't followed any channels yet."
                      : `We couldn't find any news matching your current filters (${locationPref}, ${languagePref}).`}
                  </p>
                  {!showFollowedOnly && (
                    <button 
                      onClick={() => setIsSettingsOpen(true)}
                      className="mt-6 text-primary hover:underline font-medium"
                    >
                      Change Preferences
                    </button>
                  )}
                </div>
              );
            })()}
          </>
        )}
      </div>
    </main>
  );
}
