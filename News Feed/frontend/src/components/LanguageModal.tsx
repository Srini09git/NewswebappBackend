"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';

interface LanguageModalProps {
  onSave: (location: string, language: string) => void;
}

export default function LanguageModal({ onSave }: LanguageModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useState('Global');
  const [language, setLanguage] = useState('English');
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
    setIsOpen(false);
    onSave(location, language);
  };

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
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-md p-6 mx-4 glass-panel rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Welcome to NewsFeed
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Please select your preferences to personalize your news feed.
            </p>

            <div className="space-y-4">
              {/* Theme Settings */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Appearance
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      theme === "light" 
                        ? "border-primary bg-primary/5 text-primary" 
                        : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <Sun className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">Light</span>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      theme === "dark" 
                        ? "border-primary bg-primary/5 text-primary" 
                        : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <Moon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">Dark</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Location Focus
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                >
                  <option value="Global">Global</option>
                  <option value="India">India</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="USA">USA</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  News Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                >
                  <option value="English">English</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Hindi">Hindi</option>
                </select>
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
