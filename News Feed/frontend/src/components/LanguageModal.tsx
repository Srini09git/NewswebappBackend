"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';

interface LanguageModalProps {
  onSave: (location: string, language: string, secondaryLanguage: string) => void;
}

export default function LanguageModal({ onSave }: LanguageModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useState('Global');
  const [language, setLanguage] = useState('English');
  const [secondaryLanguage, setSecondaryLanguage] = useState('None');
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      setIsOpen(true);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('hasVisited', 'true');
    localStorage.setItem('user_location', location);
    localStorage.setItem('user_language', language);
    localStorage.setItem('user_secondary_language', secondaryLanguage);
    setIsOpen(false);
    onSave(location, language, secondaryLanguage);
  };

  const languages = [
    "English", "Tamil", "Hindi", "Bengali", "Marathi", "Telugu", "Kannada", "Gujarati", "Urdu"
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="w-full max-w-md p-6 mx-4 glass-panel rounded-3xl bg-white/90 dark:bg-slate-900/95 border border-slate-100 dark:border-slate-800/80 shadow-2xl"
          >
            <h2 className="text-2xl font-extrabold font-display mb-2 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              Welcome to NewsFeed
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-light">
              Please select your preferences to personalize your news feed.
            </p>

            <div className="space-y-4">
              {/* Theme Settings */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-500 dark:text-slate-400">
                  Appearance
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      theme === "light" 
                        ? "border-primary bg-primary/5 text-primary shadow-sm" 
                        : "border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-200 dark:hover:border-slate-700"
                    }`}
                  >
                    <Sun className="w-5 h-5 mb-1" />
                    <span className="text-xs font-semibold">Light</span>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      theme === "dark" 
                        ? "border-primary bg-primary/5 text-primary shadow-sm" 
                        : "border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-200 dark:hover:border-slate-700"
                    }`}
                  >
                    <Moon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-semibold">Dark</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-500 dark:text-slate-400">
                  Location Focus
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm transition-all"
                >
                  <option value="Global">Global</option>
                  <option value="India">India</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="USA">USA</option>
                </select>
              </div>

              {/* Primary Language Selection */}
              <div>
                <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                  Primary Language
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {languages.map(lang => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`py-2 px-1 rounded-xl border-2 text-xs font-medium transition-all ${
                        language === lang 
                          ? "border-primary bg-primary/5 text-primary shadow-sm" 
                          : "border-gray-100 dark:border-gray-800 text-gray-500 hover:border-gray-200 dark:hover:border-gray-700"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary Language Selection */}
              <div>
                <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                  Secondary Language (Optional)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSecondaryLanguage("None")}
                    className={`py-2 px-1 rounded-xl border-2 text-xs font-medium transition-all ${
                      secondaryLanguage === "None" 
                        ? "border-primary bg-primary/5 text-primary shadow-sm" 
                        : "border-gray-100 dark:border-gray-800 text-gray-500 hover:border-gray-200 dark:hover:border-gray-700"
                    }`}
                  >
                    None
                  </button>
                  {languages.filter(l => l !== language).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setSecondaryLanguage(lang)}
                      className={`py-2 px-1 rounded-xl border-2 text-xs font-medium transition-all ${
                        secondaryLanguage === lang 
                          ? "border-primary bg-primary/5 text-primary shadow-sm" 
                          : "border-gray-100 dark:border-gray-800 text-gray-500 hover:border-gray-200 dark:hover:border-gray-700"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="mt-8 w-full py-3 px-4 bg-primary hover:bg-indigo-600 text-white font-medium rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              Continue to Feed
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
