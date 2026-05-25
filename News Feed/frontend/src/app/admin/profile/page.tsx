"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { Loader2, Camera, User, Mail, Tv, Shield, ShieldCheck, Save, AlertCircle, CheckCircle } from "lucide-react";

interface ProfileData {
  id: string;
  username?: string;
  email?: string;
  role?: string;
  owner_name?: string;
  channel_name?: string;
  profile_pic?: string;
}

export default function AdminProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [ownerName, setOwnerName] = useState("");
  const [channelName, setChannelName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      const token = Cookies.get("admin_token");
      if (!token) {
        router.push("/admin/login");
        return;
      }
      const res = await axios.get("http://127.0.0.1:8000/auth/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data: ProfileData = res.data;
      setProfile(data);
      setOwnerName(data.owner_name || "");
      setChannelName(data.channel_name || "");
      setEmail(data.email || "");
      if (data.profile_pic) {
        setProfilePicPreview(`http://127.0.0.1:8000${data.profile_pic}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load profile details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = Cookies.get("admin_token");
      const submitData = new FormData();
      submitData.append("owner_name", ownerName);
      submitData.append("channel_name", channelName);
      submitData.append("email", email);
      
      if (profilePicFile) {
        submitData.append("profile_pic", profilePicFile);
      }

      const res = await axios.put("http://127.0.0.1:8000/auth/profile", submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      
      const updatedData: ProfileData = res.data;
      setProfile(updatedData);
      setSuccess("Profile updated successfully!");
      if (updatedData.profile_pic) {
        setProfilePicPreview(`http://127.0.0.1:8000${updatedData.profile_pic}`);
      }
      
      // Clear file selection after successful save
      setProfilePicFile(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Profile Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your channel details and personal administrator settings</p>
        </div>
        <div className="flex items-center">
          <span className={`px-4 py-1.5 inline-flex text-sm leading-5 font-semibold rounded-full items-center gap-1.5 border ${
            profile?.role === 'super_admin' 
              ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800' 
              : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
          }`}>
            {profile?.role === 'super_admin' ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
            {profile?.role === 'super_admin' ? 'Super Admin Account' : 'Admin Account'}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 p-4 rounded-xl flex items-center text-red-700 dark:text-red-400 shadow-sm">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border-l-4 border-emerald-500 p-4 rounded-xl flex items-center text-emerald-700 dark:text-emerald-400 shadow-sm">
          <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Profile Avatar</h3>
          
          <div className="relative group w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-700 shadow-inner flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            {profilePicPreview ? (
              <img 
                src={profilePicPreview} 
                alt="Profile Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-3xl uppercase">
                {(ownerName || profile?.username || "?")[0]}
              </div>
            )}
            
            {/* Hover Camera Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200 cursor-pointer">
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-xs font-semibold">Change Avatar</span>
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange}
              className="absolute inset-0 opacity-0 cursor-pointer" 
              title="Upload new profile picture"
            />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {ownerName || profile?.username || "Unnamed Admin"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {profile?.role?.replace("_", " ") || "Admin"}
            </p>
          </div>
          
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center leading-relaxed">
            Click avatar to upload a PNG or JPG file. Recommended size 256x256.
          </p>
        </div>

        {/* Profile Details Form */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg border-b border-gray-100 dark:border-gray-700 pb-3">
            Profile Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Owner Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-400" /> Owner Name
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm dark:text-white font-medium"
                placeholder="Enter owner name"
              />
            </div>

            {/* Channel Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-gray-400" /> Channel Name
              </label>
              <input
                type="text"
                required
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm dark:text-white font-medium"
                placeholder="Enter channel name"
              />
            </div>

            {/* Email Input */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" /> Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm dark:text-white font-medium"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-5 flex justify-end">
            <button
              type="submit"
              disabled={saveLoading}
              className="px-6 py-2.5 bg-primary hover:bg-indigo-600 text-white font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-colors disabled:opacity-75 text-sm"
            >
              {saveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
