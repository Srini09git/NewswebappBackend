"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { X, Moon, Sun, Monitor } from "lucide-react";

interface UserSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: {
    location: string;
    language: string;
    secondaryLanguage: string;
    category: string;
  }) => void;
}

export default function UserSettingsPanel({ isOpen, onClose, onSave }: UserSettingsPanelProps) {
  const { theme, setTheme } = useTheme();
  
  const [location, setLocation] = useState("Global");
  const [language, setLanguage] = useState("English");
  const [secondaryLanguage, setSecondaryLanguage] = useState("None");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    if (isOpen) {
      setLocation(localStorage.getItem("user_location") || "Global");
      setLanguage(localStorage.getItem("user_language") || "English");
      setSecondaryLanguage(localStorage.getItem("user_secondary_language") || "None");
      setCategory(localStorage.getItem("user_category") || "All");
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem("user_location", location);
    localStorage.setItem("user_language", language);
    localStorage.setItem("user_secondary_language", secondaryLanguage);
    localStorage.setItem("user_category", category);
    localStorage.setItem("hasVisited", "true");
    
    onSave({ location, language, secondaryLanguage, category });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          {/* Sliding Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-[70] w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-800"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Preferences</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Theme Settings */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
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
                    <Sun className="w-6 h-6 mb-2" />
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
                    <Moon className="w-6 h-6 mb-2" />
                    <span className="text-xs font-medium">Dark</span>
                  </button>
                </div>
              </div>

              {/* Category Settings */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Category Focus
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "All", "Politics", "Business", "Technology", 
                    "Sports", "Entertainment", "World", "Health", "Environment"
                  ].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`py-2 px-1 rounded-xl border-2 text-xs font-medium transition-all ${
                        category.toLowerCase() === cat.toLowerCase()
                          ? "border-primary bg-primary/5 text-primary shadow-sm" 
                          : "border-gray-100 dark:border-gray-800 text-gray-500 hover:border-gray-200 dark:hover:border-gray-700"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Settings */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Primary Language
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["English", "Tamil", "Hindi", "Bengali", "Marathi", "Telugu", "Kannada", "Gujarati", "Urdu"].map(lang => (
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

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
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
                  {["English", "Tamil", "Hindi", "Bengali", "Marathi", "Telugu", "Kannada", "Gujarati", "Urdu"]
                    .filter(l => l !== language)
                    .map(lang => (
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

              {/* Location Settings */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
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

            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <button
                onClick={handleSave}
                className="w-full py-3 px-4 bg-primary hover:bg-indigo-600 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                Save Preferences
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
