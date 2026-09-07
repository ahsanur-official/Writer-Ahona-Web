/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ReaderUser,
  getCurrentUser,
  logoutUser,
  updateCurrentUser,
  verifyEmailCode,
  sendEmailVerificationCode,
  LITERARY_AVATAR_PRESETS,
} from "@/lib/userAuth";
import {
  Post,
  Novel,
  ReaderComment,
  getPosts,
  getNovels,
  getBookmarks,
  toggleBookmark,
  getLikedPosts,
  getAllComments,
  formatBengaliNumber,
} from "@/lib/store";

interface UserPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReader?: (item: any) => void;
}

type TabType = "overview" | "bookmarks" | "likes" | "comments" | "edit_profile" | "verification";

export default function UserPanel({ isOpen, onClose, onOpenReader }: UserPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<ReaderUser | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Data states
  const [posts, setPosts] = useState<Post[]>([]);
  const [novels, setNovels] = useState<Novel[]>([]);
  const [bookmarkIds, setBookmarkIds] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [comments, setComments] = useState<ReaderComment[]>([]);

  // Edit Profile form state
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Verification state
  const [otpInput, setOtpInput] = useState("");
  const [verifyMsg, setVerifyMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const refreshData = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      setEditName(user.name);
      setEditBio(user.bio || "");
      setEditAvatarUrl(user.avatarUrl || "");
      setBookmarkIds(getBookmarks(user.id));
      setLikedIds(getLikedPosts(user.id));
    } else {
      setBookmarkIds(getBookmarks());
      setLikedIds(getLikedPosts());
    }
    setPosts(getPosts());
    setNovels(getNovels());
    setComments(getAllComments());
  };

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    refreshData();
    setProfileMsg(null);
    setVerifyMsg(null);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Bookmarked Items
  const bookmarkedItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      category: string;
      readTime: string;
      date: string;
      rawItem: any;
    }> = [];

    // Posts
    posts.forEach((p) => {
      if (bookmarkIds.includes(p.id)) {
        items.push({
          id: p.id,
          title: p.title,
          category: p.type,
          readTime: p.readTime,
          date: p.date,
          rawItem: {
            id: p.id,
            title: p.title,
            type: p.type,
            content: p.body,
            date: p.date,
            readTime: p.readTime,
            coverUrl: p.coverUrl,
            claps: p.claps,
          },
        });
      }
    });

    // Novel Episodes
    novels.forEach((n) => {
      if (Array.isArray(n.episodes)) {
        n.episodes.forEach((ep) => {
          if (bookmarkIds.includes(ep.id)) {
            items.push({
              id: ep.id,
              title: `${n.title} — পর্ব ${formatBengaliNumber(ep.episodeNumber)}: ${ep.title}`,
              category: "উপন্যাস",
              readTime: ep.readTime,
              date: ep.date,
              rawItem: {
                id: ep.id,
                title: `${n.title} — পর্ব ${formatBengaliNumber(ep.episodeNumber)}: ${ep.title}`,
                type: "উপন্যাস",
                content: ep.content,
                date: ep.date,
                readTime: ep.readTime,
                coverUrl: n.coverUrl,
                claps: ep.claps,
                novelId: n.id,
                novelTitle: n.title,
                episodeNumber: ep.episodeNumber,
              },
            });
          }
        });
      }
    });

    return items;
  }, [posts, novels, bookmarkIds]);

  // Liked Items
  const likedItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      category: string;
      readTime: string;
      claps: number;
      rawItem: any;
    }> = [];

    posts.forEach((p) => {
      if (likedIds.includes(p.id)) {
        items.push({
          id: p.id,
          title: p.title,
          category: p.type,
          readTime: p.readTime,
          claps: p.claps || 0,
          rawItem: {
            id: p.id,
            title: p.title,
            type: p.type,
            content: p.body,
            date: p.date,
            readTime: p.readTime,
            coverUrl: p.coverUrl,
            claps: p.claps,
          },
        });
      }
    });

    return items;
  }, [posts, likedIds]);

  // User's comments
  const userComments = useMemo(() => {
    if (!currentUser) return [];
    const userEmail = currentUser.email.toLowerCase();
    const userName = currentUser.name.toLowerCase();

    return comments.filter((c) => {
      if (c.userId === currentUser.id) return true;
      if (c.authorEmail && c.authorEmail.toLowerCase() === userEmail) return true;
      if (c.authorName && c.authorName.toLowerCase() === userName) return true;
      return false;
    });
  }, [comments, currentUser]);

  if (!mounted || !isOpen) return null;

  if (!currentUser) {
    return null;
  }

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileMsg({ text: "অনুগ্রহ করে একটি ছবি (JPG, PNG বা WEBP) নির্বাচন করুন।", type: "error" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileMsg({ text: "ছবির আকার ৫ মেগাবাইটের কম হতে হবে।", type: "error" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress & crop to square 240x240 for optimal performance
        const canvas = document.createElement("canvas");
        const size = 240;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setEditAvatarUrl(dataUrl);
        setProfileMsg({ text: "ছবি সফলভাবে লোড হয়েছে। 'পরিবর্তন সংরক্ষণ করুন' বোতামে চাপুন।", type: "success" });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle Profile Update
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    if (!editName.trim()) {
      setProfileMsg({ text: "অনুগ্রহ করে আপনার পুরো নাম লিখুন।", type: "error" });
      return;
    }

    if (newPassword && newPassword.length < 4) {
      setProfileMsg({ text: "নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।", type: "error" });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setProfileMsg({ text: "পাসওয়ার্ড দুবার মিলছে না!", type: "error" });
      return;
    }

    setIsSaving(true);
    const updates: Partial<ReaderUser> = {
      name: editName.trim(),
      bio: editBio.trim(),
      avatarUrl: editAvatarUrl.trim(),
    };

    if (newPassword) {
      updates.password = newPassword;
    }

    const updated = updateCurrentUser(updates);
    setIsSaving(false);

    if (updated) {
      setCurrentUser(updated);
      setProfileMsg({ text: "আপনার প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে! ✨", type: "success" });
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setProfileMsg({ text: "প্রোফাইল আপডেট করতে সমস্যা হয়েছে।", type: "error" });
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyMsg(null);

    if (!otpInput.trim() || otpInput.trim().length !== 6) {
      setVerifyMsg({ text: "অনুগ্রহ করে সঠিক ৬-সংখ্যার কোডটি লিখুন।", type: "error" });
      return;
    }

    try {
      const res = await verifyEmailCode(currentUser.email, otpInput.trim());
      if (res.success) {
        setCurrentUser(res.user);
        setVerifyMsg({ text: "অভিনন্দন! আপনার ইমেইল সফলভাবে ভেরিফাইড হয়েছে! 🎉", type: "success" });
        setOtpInput("");
      }
    } catch (err: any) {
      setVerifyMsg({ text: err?.message || "ভেরিফিকেশন ব্যর্থ হয়েছে", type: "error" });
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      const res = await sendEmailVerificationCode(currentUser.email);
      setVerifyMsg({
        text: `নতুন কোড পাঠানো হয়েছে: ${res.code} (সিমুলেশন ও ইমেইল নোটিফিকেশন)`,
        type: "success",
      });
      setResendCooldown(45);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setVerifyMsg({ text: err?.message || "কোড পাঠাতে ব্যর্থ", type: "error" });
    }
  };

  const handleLogout = () => {
    if (confirm("আপনি কি নিশ্চিতভাবে পাঠক একাউন্ট থেকে লগআউট করতে চান?")) {
      logoutUser();
      onClose();
    }
  };

  const handleRemoveBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(id, currentUser.id);
    refreshData();
  };

  const handleOpenItem = (item: any) => {
    if (onOpenReader) {
      onOpenReader(item);
      onClose();
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="user-panel-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 98000,
        background: "rgba(10, 16, 24, 0.78)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "720px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--card, #ffffff)",
          color: "var(--ink, #1c2420)",
          borderRadius: "20px",
          border: "1px solid var(--line, #e2e8f0)",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4)",
          position: "relative",
          margin: "auto",
          fontFamily: "var(--font-siliguri), sans-serif",
          animation: "ratingModalPopIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          overflow: "hidden",
        }}
      >
        {/* Panel Header */}
        <div
          style={{
            padding: "20px 24px",
            background: "linear-gradient(135deg, rgba(202, 168, 105, 0.12) 0%, rgba(160, 72, 52, 0.08) 100%)",
            borderBottom: "1px solid var(--line, #e2e8f0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* User Avatar */}
            <div style={{ position: "relative" }}>
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid var(--gold, #caa869)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: currentUser.avatarColor,
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    fontWeight: 700,
                    border: "2px solid var(--gold, #caa869)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                >
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}

              {currentUser.emailVerified && (
                <span
                  title="ভেরিফায়েড পাঠক"
                  style={{
                    position: "absolute",
                    bottom: "-2px",
                    right: "-2px",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "#16a34a",
                    color: "#ffffff",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid #ffffff",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  }}
                >
                  ✓
                </span>
              )}
            </div>

            {/* Name & Email */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 700, color: "var(--ink)" }}>
                  {currentUser.name}
                </h3>
                {currentUser.emailVerified ? (
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      background: "rgba(22, 163, 74, 0.12)",
                      color: "#15803d",
                      fontWeight: 600,
                      border: "1px solid rgba(22, 163, 74, 0.25)",
                    }}
                  >
                    ✓ ভেরিফায়েড পাঠক
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveTab("verification")}
                    style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      background: "rgba(217, 119, 6, 0.12)",
                      color: "#b45309",
                      fontWeight: 600,
                      border: "1px solid rgba(217, 119, 6, 0.3)",
                      cursor: "pointer",
                    }}
                  >
                    ⚠ ভেরিফাই করুন
                  </button>
                )}
              </div>
              <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--muted)" }}>
                {currentUser.email}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              color: "var(--muted)",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "8px",
              lineHeight: 1,
            }}
            aria-label="বন্ধ করুন"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 18px",
            background: "var(--background, #f8fafc)",
            borderBottom: "1px solid var(--line, #e2e8f0)",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: "none",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: "pointer",
              background: activeTab === "overview" ? "var(--ink, #1c2420)" : "transparent",
              color: activeTab === "overview" ? "#ffffff" : "var(--muted)",
              whiteSpace: "nowrap",
            }}
          >
            সারসংক্ষেপ
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bookmarks")}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: "none",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: "pointer",
              background: activeTab === "bookmarks" ? "var(--ink, #1c2420)" : "transparent",
              color: activeTab === "bookmarks" ? "#ffffff" : "var(--muted)",
              whiteSpace: "nowrap",
            }}
          >
            সংরক্ষিত ({formatBengaliNumber(bookmarkedItems.length)})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("likes")}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: "none",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: "pointer",
              background: activeTab === "likes" ? "var(--ink, #1c2420)" : "transparent",
              color: activeTab === "likes" ? "#ffffff" : "var(--muted)",
              whiteSpace: "nowrap",
            }}
          >
            পছন্দ ({formatBengaliNumber(likedItems.length)})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("comments")}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: "none",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: "pointer",
              background: activeTab === "comments" ? "var(--ink, #1c2420)" : "transparent",
              color: activeTab === "comments" ? "#ffffff" : "var(--muted)",
              whiteSpace: "nowrap",
            }}
          >
            মন্তব্য ({formatBengaliNumber(userComments.length)})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("edit_profile")}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: "none",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: "pointer",
              background: activeTab === "edit_profile" ? "var(--ink, #1c2420)" : "transparent",
              color: activeTab === "edit_profile" ? "#ffffff" : "var(--muted)",
              whiteSpace: "nowrap",
            }}
          >
            প্রোফাইল ও ছবি
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("verification")}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: "none",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: "pointer",
              background: activeTab === "verification" ? "var(--ink, #1c2420)" : "transparent",
              color: activeTab === "verification" ? "#ffffff" : "var(--muted)",
              whiteSpace: "nowrap",
            }}
          >
            ইমেইল ভেরিফিকেশন
          </button>
        </div>

        {/* Panel Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {/* 1. OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Reader Bio Card */}
              {currentUser.bio ? (
                <div
                  style={{
                    padding: "16px 20px",
                    borderRadius: "14px",
                    background: "var(--surface, rgba(202, 168, 105, 0.08))",
                    border: "1px solid var(--line)",
                    fontStyle: "italic",
                    color: "var(--ink)",
                    fontSize: "14px",
                    lineHeight: 1.6,
                  }}
                >
                  &ldquo;{currentUser.bio}&rdquo;
                </div>
              ) : null}

              {/* Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px" }}>
                <div
                  onClick={() => setActiveTab("bookmarks")}
                  style={{
                    padding: "16px",
                    borderRadius: "14px",
                    background: "var(--card)",
                    border: "1px solid var(--line)",
                    cursor: "pointer",
                    textAlign: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    transition: "transform 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: "24px" }}>🔖</span>
                  <div style={{ fontSize: "22px", fontWeight: 700, margin: "6px 0 2px", color: "var(--accent)" }}>
                    {formatBengaliNumber(bookmarkedItems.length)}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--muted)" }}>সংরক্ষিত লেখা</div>
                </div>

                <div
                  onClick={() => setActiveTab("likes")}
                  style={{
                    padding: "16px",
                    borderRadius: "14px",
                    background: "var(--card)",
                    border: "1px solid var(--line)",
                    cursor: "pointer",
                    textAlign: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    transition: "transform 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: "24px" }}>❤️</span>
                  <div style={{ fontSize: "22px", fontWeight: 700, margin: "6px 0 2px", color: "#e11d48" }}>
                    {formatBengaliNumber(likedItems.length)}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--muted)" }}>দেওয়া ভালোবাসা</div>
                </div>

                <div
                  onClick={() => setActiveTab("comments")}
                  style={{
                    padding: "16px",
                    borderRadius: "14px",
                    background: "var(--card)",
                    border: "1px solid var(--line)",
                    cursor: "pointer",
                    textAlign: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    transition: "transform 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: "24px" }}>💬</span>
                  <div style={{ fontSize: "22px", fontWeight: 700, margin: "6px 0 2px", color: "var(--gold)" }}>
                    {formatBengaliNumber(userComments.length)}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--muted)" }}>করা মন্তব্য</div>
                </div>
              </div>

              {/* Unverified Notice Banner */}
              {!currentUser.emailVerified && (
                <div
                  style={{
                    padding: "16px 18px",
                    borderRadius: "14px",
                    background: "rgba(217, 119, 6, 0.08)",
                    border: "1px solid rgba(217, 119, 6, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h5 style={{ margin: "0 0 2px", color: "#b45309", fontSize: "14px", fontWeight: 700 }}>
                      আপনার ইমেইল ঠিকানা এখনো ভেরিফাই করা হয়নি
                    </h5>
                    <p style={{ margin: 0, fontSize: "12.5px", color: "var(--muted)" }}>
                      ভেরিফাই করে নিন যাতে সহজেই পাসওয়ার্ড উদ্ধার এবং ভেরিফায়েড পাঠক ব্যাজ পাওয়া যায়।
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("verification")}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "20px",
                      background: "#b45309",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ভেরিফাই করুন →
                  </button>
                </div>
              )}

              {/* Quick Actions */}
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("edit_profile")}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: "12px",
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    color: "var(--ink)",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ✏️ প্রোফাইল ও ছবি এডিট
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "12px",
                    background: "rgba(220, 38, 38, 0.08)",
                    border: "1px solid rgba(220, 38, 38, 0.2)",
                    color: "#dc2626",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  লগআউট
                </button>
              </div>
            </div>
          )}

          {/* 2. BOOKMARKS TAB */}
          {activeTab === "bookmarks" && (
            <div>
              {bookmarkedItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
                  <span style={{ fontSize: "40px", display: "block", marginBottom: "10px" }}>🔖</span>
                  <h4 style={{ margin: "0 0 6px", fontSize: "16px", color: "var(--ink)" }}>
                    কোনো সংরক্ষিত লেখা নেই
                  </h4>
                  <p style={{ margin: 0, fontSize: "13px" }}>
                    প্রিয় গল্প বা কবিতা পড়ার সময় <strong>&apos;বুকমার্ক&apos;</strong> বোতামে চাপ দিলে এখানে সংরক্ষিত থাকবে।
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {bookmarkedItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleOpenItem(item.rawItem)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        background: "var(--card)",
                        border: "1px solid var(--line)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            background: "var(--surface)",
                            color: "var(--accent)",
                            fontWeight: 600,
                            marginRight: "8px",
                          }}
                        >
                          {item.category}
                        </span>
                        <h4 style={{ margin: "4px 0 2px", fontSize: "15px", color: "var(--ink)", fontWeight: 600 }}>
                          {item.title}
                        </h4>
                        <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                          ⏱ {item.readTime}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "13px", color: "var(--gold)", fontWeight: 600 }}>
                          পড়ুন →
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveBookmark(item.id, e)}
                          title="সংরক্ষণ তালিকা থেকে সরান"
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--muted)",
                            cursor: "pointer",
                            padding: "6px",
                            fontSize: "14px",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. LIKES TAB */}
          {activeTab === "likes" && (
            <div>
              {likedItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
                  <span style={{ fontSize: "40px", display: "block", marginBottom: "10px" }}>❤️</span>
                  <h4 style={{ margin: "0 0 6px", fontSize: "16px", color: "var(--ink)" }}>
                    কোনো লেখা এখনো লাইক করেননি
                  </h4>
                  <p style={{ margin: 0, fontSize: "13px" }}>
                    প্রিয় লেখায় ভালোবাসা জানালে তা এখানে এক নজরে দেখতে পারবেন।
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {likedItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleOpenItem(item.rawItem)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        background: "var(--card)",
                        border: "1px solid var(--line)",
                        cursor: "pointer",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            background: "var(--surface)",
                            color: "var(--accent)",
                            fontWeight: 600,
                            marginRight: "8px",
                          }}
                        >
                          {item.category}
                        </span>
                        <h4 style={{ margin: "4px 0 2px", fontSize: "15px", color: "var(--ink)", fontWeight: 600 }}>
                          {item.title}
                        </h4>
                        <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                          ⏱ {item.readTime}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "12.5px", color: "#e11d48", fontWeight: 600 }}>
                          ❤️ {formatBengaliNumber(item.claps)}
                        </span>
                        <span style={{ fontSize: "13px", color: "var(--gold)", fontWeight: 600 }}>
                          পড়ুন →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. COMMENTS TAB */}
          {activeTab === "comments" && (
            <div>
              {userComments.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
                  <span style={{ fontSize: "40px", display: "block", marginBottom: "10px" }}>💬</span>
                  <h4 style={{ margin: "0 0 6px", fontSize: "16px", color: "var(--ink)" }}>
                    কোনো মন্তব্য পাওয়া যায়নি
                  </h4>
                  <p style={{ margin: 0, fontSize: "13px" }}>
                    আপনার পছন্দের গল্প বা উপন্যাসের নিচে মন্তব্য করলে তা এখানে তালিকাবদ্ধ থাকবে।
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {userComments.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: "14px 16px",
                        borderRadius: "12px",
                        background: "var(--card)",
                        border: "1px solid var(--line)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--accent)" }}>
                          {c.targetTitle || "সাহিত্য রচনা"}
                        </span>
                        <span style={{ fontSize: "11.5px", color: "var(--muted)" }}>{c.date}</span>
                      </div>
                      <p style={{ margin: "0 0 8px", fontSize: "13.5px", color: "var(--ink)", lineHeight: 1.5 }}>
                        {c.content}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "var(--muted)" }}>
                        <span>❤️ {formatBengaliNumber(c.claps || 0)} ভালোবাসা</span>
                        {c.replies && c.replies.length > 0 && (
                          <span>💬 {formatBengaliNumber(c.replies.length)} টি উত্তর</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. EDIT PROFILE & PIC SETUP TAB */}
          {activeTab === "edit_profile" && (
            <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {profileMsg && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: profileMsg.type === "success" ? "rgba(22, 163, 74, 0.1)" : "rgba(220, 38, 38, 0.1)",
                    border: `1px solid ${profileMsg.type === "success" ? "rgba(22, 163, 74, 0.3)" : "rgba(220, 38, 38, 0.3)"}`,
                    color: profileMsg.type === "success" ? "#15803d" : "#b91c1c",
                    fontSize: "13.5px",
                  }}
                >
                  {profileMsg.text}
                </div>
              )}

              {/* PIC SETUP SECTION */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "14px",
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                }}
              >
                <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "var(--ink)", marginBottom: "12px" }}>
                  📷 প্রোফাইল ছবি সেটআপ (Pic Setup)
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap", marginBottom: "16px" }}>
                  {/* Current Preview */}
                  <div style={{ textAlign: "center" }}>
                    {editAvatarUrl ? (
                      <img
                        src={editAvatarUrl}
                        alt="Preview"
                        style={{
                          width: "72px",
                          height: "72px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "3px solid var(--gold, #caa869)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "72px",
                          height: "72px",
                          borderRadius: "50%",
                          background: currentUser.avatarColor,
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "28px",
                          fontWeight: 700,
                          border: "3px solid var(--gold, #caa869)",
                        }}
                      >
                        {editName.charAt(0).toUpperCase() || "A"}
                      </div>
                    )}
                    <span style={{ display: "block", fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                      বর্তমান ছবি
                    </span>
                  </div>

                  {/* Upload from Device */}
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "9px 18px",
                        borderRadius: "12px",
                        background: "var(--card)",
                        border: "1px solid var(--line)",
                        color: "var(--ink)",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                      }}
                    >
                      <span>📁 ডিভাইস থেকে ছবি আপলোড করুন</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        style={{ display: "none" }}
                      />
                    </label>

                    {editAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => setEditAvatarUrl("")}
                        style={{
                          marginLeft: "8px",
                          padding: "8px 12px",
                          borderRadius: "10px",
                          background: "transparent",
                          border: "none",
                          color: "#dc2626",
                          fontSize: "12.5px",
                          cursor: "pointer",
                        }}
                      >
                        ছবি সরান
                      </button>
                    )}
                    <p style={{ margin: "6px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                      JPG, PNG বা WEBP ছবি নির্বাচন করুন (স্বয়ংক্রিয়ভাবে ক্রপ ও অপ্টিমাইজ হবে)
                    </p>
                  </div>
                </div>

                {/* Preset Avatars Selector */}
                <div>
                  <span style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--muted)", marginBottom: "8px" }}>
                    অথবা সাহিত্যিক প্রিসেট অবতার বেছে নিন:
                  </span>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {LITERARY_AVATAR_PRESETS.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setEditAvatarUrl(p.url)}
                        title={p.label}
                        style={{
                          cursor: "pointer",
                          padding: "3px",
                          borderRadius: "50%",
                          border: editAvatarUrl === p.url ? "3px solid var(--accent, #a04834)" : "2px solid transparent",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <img
                          src={p.url}
                          alt={p.label}
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Name field */}
              <div>
                <label style={{ display: "block", fontSize: "13.5px", fontWeight: 600, marginBottom: "6px" }}>
                  আপনার পুরো নাম *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid var(--line)",
                    background: "var(--background)",
                    color: "var(--ink)",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Bio field */}
              <div>
                <label style={{ display: "block", fontSize: "13.5px", fontWeight: 600, marginBottom: "6px" }}>
                  সংক্ষিপ্ত পরিচয় / বায়ো (ঐচ্ছিক)
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="যেমন: সাহিত্যের চিরন্তন পাঠক ও মুগ্ধ শ্রোতা..."
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid var(--line)",
                    background: "var(--background)",
                    color: "var(--ink)",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* Password Change */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "14px",
                  background: "var(--background)",
                  border: "1px solid var(--line)",
                }}
              >
                <span style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "10px" }}>
                  🔐 পাসওয়ার্ড পরিবর্তন (ঐচ্ছিক)
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", color: "var(--muted)", marginBottom: "4px" }}>
                      নতুন পাসওয়ার্ড
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="কমপক্ষে ৪ অক্ষর"
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--line)",
                        background: "var(--card)",
                        color: "var(--ink)",
                        fontSize: "13px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", color: "var(--muted)", marginBottom: "4px" }}>
                      পাসওয়ার্ড নিশ্চিত করুন
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--line)",
                        background: "var(--card)",
                        color: "var(--ink)",
                        fontSize: "13px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                style={{
                  padding: "12px",
                  borderRadius: "12px",
                  background: "var(--accent, #a04834)",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: isSaving ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(160, 72, 52, 0.25)",
                }}
              >
                {isSaving ? "সংরক্ষণ হচ্ছে..." : "পরিবর্তন সংরক্ষণ করুন"}
              </button>
            </form>
          )}

          {/* 6. EMAIL VERIFICATION TAB */}
          {activeTab === "verification" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div
                style={{
                  padding: "20px",
                  borderRadius: "14px",
                  background: currentUser.emailVerified ? "rgba(22, 163, 74, 0.08)" : "rgba(217, 119, 6, 0.08)",
                  border: `1px solid ${currentUser.emailVerified ? "rgba(22, 163, 74, 0.25)" : "rgba(217, 119, 6, 0.25)"}`,
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: "42px", display: "block", marginBottom: "8px" }}>
                  {currentUser.emailVerified ? "✅" : "✉️"}
                </span>
                <h4 style={{ margin: "0 0 6px", fontSize: "18px", color: "var(--ink)", fontWeight: 700 }}>
                  {currentUser.emailVerified ? "আপনার ইমেইল ভেরিফায়েড" : "ইমেইল ভেরিফিকেশন সম্পন্ন করুন"}
                </h4>
                <p style={{ margin: 0, fontSize: "13.5px", color: "var(--muted)" }}>
                  ইমেইল: <strong>{currentUser.email}</strong>
                </p>
              </div>

              {verifyMsg && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: verifyMsg.type === "success" ? "rgba(22, 163, 74, 0.1)" : "rgba(220, 38, 38, 0.1)",
                    border: `1px solid ${verifyMsg.type === "success" ? "rgba(22, 163, 74, 0.3)" : "rgba(220, 38, 38, 0.3)"}`,
                    color: verifyMsg.type === "success" ? "#15803d" : "#b91c1c",
                    fontSize: "13.5px",
                  }}
                >
                  {verifyMsg.text}
                </div>
              )}

              {!currentUser.emailVerified ? (
                <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {/* Verification Code Notice helper */}
                  {currentUser.verificationCode && (
                    <div
                      style={{
                        padding: "12px 16px",
                        borderRadius: "10px",
                        background: "var(--surface)",
                        border: "1px dashed var(--gold)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ fontSize: "13px", color: "var(--ink)" }}>
                        আপনার ৬-সংখ্যার ভেরিফিকেশন কোড:
                      </span>
                      <strong style={{ fontSize: "18px", letterSpacing: "3px", color: "var(--accent)" }}>
                        {currentUser.verificationCode}
                      </strong>
                    </div>
                  )}

                  <div>
                    <label style={{ display: "block", fontSize: "13.5px", fontWeight: 600, marginBottom: "6px" }}>
                      ৬-সংখ্যার ওটিপি (OTP) কোড দিন *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="যেমন: 123456"
                      required
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "10px",
                        border: "1px solid var(--line)",
                        background: "var(--background)",
                        color: "var(--ink)",
                        fontSize: "18px",
                        letterSpacing: "4px",
                        textAlign: "center",
                        outline: "none",
                        boxSizing: "border-box",
                        fontWeight: 700,
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      padding: "12px",
                      borderRadius: "12px",
                      background: "var(--accent, #a04834)",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "14px",
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(160, 72, 52, 0.25)",
                    }}
                  >
                    ইমেইল নিশ্চিত ও ভেরিফাই করুন
                  </button>

                  <div style={{ textAlign: "center", marginTop: "6px" }}>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0}
                      style={{
                        background: "none",
                        border: "none",
                        color: resendCooldown > 0 ? "var(--muted)" : "var(--accent)",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                      }}
                    >
                      {resendCooldown > 0 ? `পুনরায় পাঠান (${formatBengaliNumber(resendCooldown)} সেকেন্ড পর)` : "নতুন কোড পাঠান"}
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ padding: "16px", borderRadius: "12px", background: "var(--surface)", border: "1px solid var(--line)" }}>
                  <h5 style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 700, color: "var(--ink)" }}>
                    ভেরিফায়েড পাঠকের সুবিধাসমূহ:
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "var(--muted)", lineHeight: 1.7 }}>
                    <li>মন্তব্য সেকশনে স্বয়ংক্রিয় ভেরিফায়েড সবুজ ব্যাজ প্রদর্শন</li>
                    <li>পাসওয়ার্ড ভুলে গেলে তাৎক্ষণিক উদ্ধার সুবিধা</li>
                    <li>নতুন পর্ব বা সাহিত্য প্রকাশের নোটিফিকেশন অগ্রাধিকার</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
