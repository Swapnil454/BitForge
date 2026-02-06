

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { getStoredUser, setCookie } from "@/lib/cookies";
import { userAPI } from "@/lib/api";
import toast from "react-hot-toast";


export default function ProfileModal({ user, onClose, onUpdate }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePic(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!name.trim() || name.trim().length < 2) {
        toast.error("Name must be at least 2 characters");
        return;
      }

      setLoading(true);
      
      // Create FormData for multipart request
      const formData = new FormData();
      formData.append("name", name.trim());
      if (profilePic) {
        formData.append("profilePicture", profilePic);
      }

      const response = await userAPI.updateProfile(formData);
      
      // Update user in cookies/local state so it persists across reload/login
      if (response.user) {
        const storedUser = getStoredUser();
        const updatedUser = {
          ...storedUser,
          ...response.user,
        };

        // persist for future sessions
        setCookie("user", JSON.stringify(updatedUser), 7);

        // keep legacy localStorage in sync if present
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }

        setCurrentUser(response.user);
        onUpdate(response.user);
      }

      toast.success("Profile updated successfully");
      setIsEditing(false);
      setProfilePic(null);
      setPreview(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-linear-to-br from-slate-800/80 via-slate-900/80 to-slate-800/80 border border-white/20 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-indigo-500/20 relative"
      >
        {/* Header with Edit Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">{isEditing ? "Edit Profile" : "Profile"}</h2>
            <p className="text-xs text-white/70">Manage your account details</p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 bg-linear-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white text-sm rounded-lg transition flex items-center gap-2 shadow-lg shadow-purple-500/30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg bg-white/20 hover:bg-white/30 text-white/80 hover:text-white transition grid place-items-center"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {!isEditing ? (
          /* View Mode */
          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-linear-to-r from-cyan-300 to-indigo-400 flex items-center justify-center text-5xl overflow-hidden ring-4 ring-indigo-400/40 shadow-xl shadow-indigo-500/30">
                {currentUser.profilePictureUrl ? (
                  <img src={currentUser.profilePictureUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  "👤"
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Name</label>
                <div className="px-4 py-3 bg-white/20 border border-white/20 rounded-xl text-white shadow-inner shadow-black/20">
                  {currentUser.name}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Email</label>
                <div className="px-4 py-3 bg-white/20 border border-white/20 rounded-xl text-white shadow-inner shadow-black/20">
                  {currentUser.email}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Role</label>
                <div className="px-4 py-3 bg-white/20 border border-white/20 rounded-xl text-white capitalize shadow-inner shadow-black/20">
                  {currentUser.role}
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* Edit Mode */
          <div className="space-y-6">
            {/* Profile Picture */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-3">Profile Picture</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-linear-to-r from-cyan-300 to-indigo-400 flex items-center justify-center text-2xl overflow-hidden ring-2 ring-indigo-400/40 shadow-lg shadow-indigo-500/20">
                  {preview ? (
                    <img src={preview} alt="preview" className="w-full h-full object-cover" />
                  ) : currentUser.profilePictureUrl ? (
                    <img src={currentUser.profilePictureUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    "👤"
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="text-sm text-white/80 file:bg-white/20 file:hover:bg-white/30 file:border file:border-white/30 file:rounded-lg file:px-3 file:py-1.5 file:text-white file:cursor-pointer transition"
                />
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/20 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 shadow-inner shadow-black/20"
                placeholder="Your name"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setName(currentUser.name);
                  setProfilePic(null);
                  setPreview(null);
                }}
                className="flex-1 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-linear-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white rounded-xl transition disabled:opacity-50 shadow-lg shadow-cyan-500/30"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};