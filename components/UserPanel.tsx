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
  checkPasswordStrength,
  RESEND_COOLDOWN_SECONDS,
  CODE_VALIDITY_SECONDS,
  formatTimerSeconds,
  isValidEmail,
} from "@/lib/userAuth";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";
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
  const [resendCooldown, setResendCooldown] = useState(0); // 3 minutes cooldown
  const [codeRemainingSeconds, setCodeRemainingSeconds] = useState(0); // 1 minute validity timer
  const [verificationLink, setVerificationLink] = useState<string | null>(null);
  const [latestCode, setLatestCode] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Timer: 3 minutes resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Timer: 1 minute code validity countdown
  useEffect(() => {
    if (codeRemainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setCodeRemainingSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [codeRemainingSeconds]);

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

  // Derived reader activity score
  const readerActivityScore = useMemo(() => {
    return (bookmarkedItems.length * 2) + (likedItems.length * 1) + (userComments.length * 3);
  }, [bookmarkedItems.length, likedItems.length, userComments.length]);

  // Derived prestigious reader tier
  const readerTier = useMemo(() => {
    if (readerActivityScore >= 12) {
      return {
        title: "সম্মানিত রত্ন পাঠক",
        icon: "👑",
        color: "#eab308",
        bg: "rgba(234, 179, 8, 0.14)",
        border: "rgba(234, 179, 8, 0.4)",
        desc: "অহনা সাহিত্য পরিবারের সর্বোচ্চ সম্মানিত সুহৃদ",
      };
    }
    if (readerActivityScore >= 6) {
      return {
        title: "একনিষ্ঠ সাহিত্যরসিক",
        icon: "🌟",
        color: "#caa869",
        bg: "rgba(202, 168, 105, 0.15)",
        border: "rgba(202, 168, 105, 0.4)",
        desc: "নিয়মিত সাহিত্য পাঠ ও সক্রিয় চর্চায় যুক্ত পাঠক",
      };
    }
    if (readerActivityScore >= 2) {
      return {
        title: "অনুরাগী পাঠক",
        icon: "📖",
        color: "#a04834",
        bg: "rgba(160, 72, 52, 0.12)",
        border: "rgba(160, 72, 52, 0.3)",
        desc: "সাহিত্যের পাতায় নিয়মিত বিচরণকারী সুহৃদ",
      };
    }
    return {
      title: "নবাগত সাহিত্যপ্রেমী",
      icon: "🌿",
      color: "#16a34a",
      bg: "rgba(22, 163, 74, 0.12)",
      border: "rgba(22, 163, 74, 0.3)",
      desc: "সাহিত্য জগতে সদ্য পদার্পণকারী সম্মানিত অতিথি",
    };
  }, [readerActivityScore]);

  // Bengali formatted join date
  const joinDateFormatted = useMemo(() => {
    if (!currentUser?.createdAt) return "অহনা সাহিত্য সংসদের সম্মানিত পাঠক";
    try {
      const d = new Date(currentUser.createdAt);
      const months = [
        "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
        "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
      ];
      const day = formatBengaliNumber(d.getDate());
      const month = months[d.getMonth()];
      const year = formatBengaliNumber(d.getFullYear());
      return `${day} ${month} ${year}`;
    } catch {
      return "অহনা সাহিত্য সংসদের সম্মানিত পাঠক";
    }
  }, [currentUser?.createdAt]);

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

  // Handle Profile Update without full page reload
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    if (!editName.trim()) {
      setProfileMsg({ text: "অনুগ্রহ করে আপনার পুরো নাম লিখুন।", type: "error" });
      return;
    }

    if (newPassword) {
      const strength = checkPasswordStrength(newPassword);
      if (!strength.isStrong) {
        setProfileMsg({ text: `পাসওয়ার্ড অবশ্যই শক্তিশালী হতে হবে: ${strength.message}`, type: "error" });
        return;
      }
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
      setEditName(updated.name);
      setEditBio(updated.bio || "");
      setEditAvatarUrl(updated.avatarUrl || "");
      setNewPassword("");
      setConfirmPassword("");
      // Return to overview profile tab to show updated profile instantly without page reload
      setActiveTab("overview");
      setProfileMsg({ text: "আপনার প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে! ✨", type: "success" });
      window.dispatchEvent(new CustomEvent("ahona-auth-changed", { detail: updated }));
      window.dispatchEvent(new CustomEvent("ahona_store_updated"));
    } else {
      setProfileMsg({ text: "প্রোফাইল আপডেট করতে সমস্যা হয়েছে।", type: "error" });
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyMsg(null);

    if (!currentUser) return;

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
        setCodeRemainingSeconds(0);
        window.dispatchEvent(new CustomEvent("ahona-auth-changed", { detail: res.user }));
      }
    } catch (err: any) {
      setVerifyMsg({ text: err?.message || "ভেরিফিকেশন ব্যর্থ হয়েছে", type: "error" });
    }
  };

  // Handle Resend OTP (3 minutes cooldown & 1 minute validity)
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !currentUser) return;
    try {
      const res = await sendEmailVerificationCode(currentUser.email);
      setLatestCode(res.code);
      setVerificationLink(res.verificationLink);
      setVerifyMsg({
        text: `নতুন ৬-সংখ্যার কোড পাঠানো হয়েছে। ইনবক্স অথবা স্প্যাম ফোল্ডার চেক করুন।`,
        type: "success",
      });
      // 3 minutes (180 seconds) resend cooldown
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      // 1 minute (60 seconds) code validity
      setCodeRemainingSeconds(CODE_VALIDITY_SECONDS);
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
        {/* Panel Header: Refined Literary Salon Title */}
        <div
          style={{
            padding: "16px 24px",
            background: "linear-gradient(135deg, rgba(202, 168, 105, 0.14) 0%, rgba(160, 72, 52, 0.08) 100%)",
            borderBottom: "1px solid var(--line, #e2e8f0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>✒️</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    letterSpacing: "0.3px",
                    color: "var(--ink, #1c2420)",
                    fontFamily: "var(--font-serif, 'Noto Serif Bengali', serif)",
                  }}
                >
                  অহনা সাহিত্য পরিষদ · পাঠক সংসদ
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    background: "var(--surface, rgba(202, 168, 105, 0.15))",
                    color: "var(--gold, #caa869)",
                    fontWeight: 600,
                    border: "1px solid var(--line)",
                  }}
                >
                  #RD-{(currentUser.id || "").slice(-5).toUpperCase()}
                </span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                সদস্যপদ সক্রিয়: {joinDateFormatted}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "var(--surface, #f1ede3)",
              border: "1px solid var(--line, #dcd7cb)",
              color: "var(--muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "15px",
              lineHeight: 1,
              transition: "all 0.15s ease",
            }}
            aria-label="বন্ধ করুন"
            title="প্যানেল বন্ধ করুন"
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
              padding: "7px 15px",
              borderRadius: "20px",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              background: activeTab === "overview" ? "var(--ink, #1c2420)" : "transparent",
              color: activeTab === "overview" ? "#ffffff" : "var(--muted)",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <span>📜</span>
            <span>পাঠক কার্ড ও তথ্য</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bookmarks")}
            style={{
              padding: "7px 15px",
              borderRadius: "20px",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              background: activeTab === "bookmarks" ? "var(--ink, #1c2420)" : "transparent",
              color: activeTab === "bookmarks" ? "#ffffff" : "var(--muted)",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <span>🔖</span>
            <span>সংরক্ষিত ({formatBengaliNumber(bookmarkedItems.length)})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("likes")}
            style={{
              padding: "7px 15px",
              borderRadius: "20px",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              background: activeTab === "likes" ? "var(--ink, #1c2420)" : "transparent",
              color: activeTab === "likes" ? "#ffffff" : "var(--muted)",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <span>❤️</span>
            <span>পছন্দ ({formatBengaliNumber(likedItems.length)})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("comments")}
            style={{
              padding: "7px 15px",
              borderRadius: "20px",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              background: activeTab === "comments" ? "var(--ink, #1c2420)" : "transparent",
              color: activeTab === "comments" ? "#ffffff" : "var(--muted)",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <span>💬</span>
            <span>মন্তব্য ({formatBengaliNumber(userComments.length)})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("edit_profile")}
            style={{
              padding: "7px 15px",
              borderRadius: "20px",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              background: activeTab === "edit_profile" ? "var(--ink, #1c2420)" : "transparent",
              color: activeTab === "edit_profile" ? "#ffffff" : "var(--muted)",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <span>🎨</span>
            <span>প্রোফাইল সাজান</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("verification")}
            style={{
              padding: "7px 15px",
              borderRadius: "20px",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              background: activeTab === "verification" ? "var(--ink, #1c2420)" : "transparent",
              color: activeTab === "verification" ? "#ffffff" : "var(--muted)",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <span>{currentUser.emailVerified ? "🛡️" : "⚠️"}</span>
            <span>ইমেইল নিরাপত্তা</span>
          </button>
        </div>

        {/* Panel Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {/* 1. OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Profile Update Success / Info Banner */}
              {profileMsg && (
                <div
                  style={{
                    padding: "12px 18px",
                    borderRadius: "14px",
                    background: profileMsg.type === "success" ? "rgba(22, 163, 74, 0.12)" : "rgba(220, 38, 38, 0.12)",
                    border: `1px solid ${profileMsg.type === "success" ? "rgba(22, 163, 74, 0.3)" : "rgba(220, 38, 38, 0.3)"}`,
                    color: profileMsg.type === "success" ? "#15803d" : "#b91c1c",
                    fontSize: "14px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>{profileMsg.type === "success" ? "✓" : "⚠️"}</span>
                    <span>{profileMsg.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProfileMsg(null)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: "16px" }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Grand Literary Reader Membership Card */}
              <div
                style={{
                  position: "relative",
                  borderRadius: "18px",
                  overflow: "hidden",
                  padding: "22px 24px",
                  background: "linear-gradient(135deg, #18201b 0%, #281d17 55%, #19221d 100%)",
                  color: "#f8f5ee",
                  border: "1px solid rgba(202, 168, 105, 0.45)",
                  boxShadow: "0 12px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                }}
              >
                {/* Decorative literary watermark */}
                <div
                  style={{
                    position: "absolute",
                    top: "-15px",
                    right: "-15px",
                    fontSize: "110px",
                    opacity: 0.05,
                    pointerEvents: "none",
                    userSelect: "none",
                    lineHeight: 1,
                  }}
                >
                  📖
                </div>

                {/* Card Top Row: Organization & Tier */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "11.5px", color: "#caa869", fontWeight: 700, letterSpacing: "1px" }}>
                      ✦ অহনা ইসলাম সাহিত্য সংসদ ✦
                    </span>
                  </div>

                  {/* Tier Badge */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      background: readerTier.bg,
                      border: `1px solid ${readerTier.border}`,
                      color: readerTier.color,
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    <span>{readerTier.icon}</span>
                    <span>{readerTier.title}</span>
                  </div>
                </div>

                {/* Card Middle Row: Avatar & Reader Info */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "18px",
                    flexWrap: "wrap",
                  }}
                >
                  {/* Dual-Ring Avatar with quick camera shortcut */}
                  <div
                    style={{
                      position: "relative",
                      width: "74px",
                      height: "74px",
                      borderRadius: "50%",
                      padding: "3px",
                      background: "linear-gradient(135deg, #caa869 0%, #ffffff 50%, #a04834 100%)",
                      boxShadow: "0 6px 18px rgba(0, 0, 0, 0.35)",
                      flexShrink: 0,
                    }}
                  >
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          background: currentUser.avatarColor || "#a04834",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "30px",
                          fontWeight: 700,
                          fontFamily: "var(--font-serif, serif)",
                        }}
                      >
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Camera Button to trigger edit profile */}
                    <button
                      type="button"
                      onClick={() => setActiveTab("edit_profile")}
                      title="ছবি ও প্রোফাইল পরিবর্তন করুন"
                      style={{
                        position: "absolute",
                        bottom: "-2px",
                        right: "-2px",
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "#caa869",
                        color: "#1c2420",
                        border: "2px solid #18201b",
                        fontSize: "11px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                      }}
                    >
                      📷
                    </button>
                  </div>

                  {/* Name, Email, and Status */}
                  <div style={{ flex: 1, minWidth: "190px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <h2
                        style={{
                          margin: 0,
                          fontSize: "20px",
                          fontWeight: 700,
                          color: "#ffffff",
                          fontFamily: "var(--font-serif, 'Noto Serif Bengali', serif)",
                          letterSpacing: "0.2px",
                        }}
                      >
                        {currentUser.name}
                      </h2>
                      {currentUser.emailVerified ? (
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background: "rgba(34, 197, 94, 0.2)",
                            color: "#4ade80",
                            fontWeight: 600,
                            border: "1px solid rgba(34, 197, 94, 0.4)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
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
                            background: "rgba(234, 179, 8, 0.2)",
                            color: "#fde047",
                            fontWeight: 600,
                            border: "1px solid rgba(234, 179, 8, 0.4)",
                            cursor: "pointer",
                          }}
                        >
                          ⚠ ভেরিফাই করুন
                        </button>
                      )}
                    </div>

                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255, 255, 255, 0.75)" }}>
                      {currentUser.email}
                    </p>

                    <div style={{ display: "flex", gap: "10px", marginTop: "8px", fontSize: "11.5px", color: "rgba(202, 168, 105, 0.9)" }}>
                      <span>🆔 #RD-{(currentUser.id || "").slice(-5).toUpperCase()}</span>
                      <span>•</span>
                      <span>যোগদান: {joinDateFormatted}</span>
                    </div>
                  </div>
                </div>

                {/* Reader Bio Quote inside Card */}
                {currentUser.bio ? (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      background: "rgba(0, 0, 0, 0.28)",
                      border: "1px solid rgba(202, 168, 105, 0.25)",
                      fontSize: "13px",
                      color: "#f8f5ee",
                      fontStyle: "italic",
                      lineHeight: 1.6,
                    }}
                  >
                    &ldquo;{currentUser.bio}&rdquo;
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px dashed rgba(202, 168, 105, 0.3)",
                      fontSize: "12px",
                      color: "rgba(255, 255, 255, 0.7)",
                    }}
                  >
                    <span>✍️ আপনার সাহিত্যিক পরিচিতি বা পছন্দের উদ্ধৃতি যোগ করুন</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("edit_profile")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#caa869",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      বায়ো লিখুন →
                    </button>
                  </div>
                )}
              </div>

              {/* 4 Rich Aesthetic Stat Tiles */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: "12px",
                }}
              >
                {/* 1. Bookmarks */}
                <div
                  onClick={() => setActiveTab("bookmarks")}
                  style={{
                    padding: "16px 12px",
                    borderRadius: "14px",
                    background: "var(--card)",
                    border: "1px solid var(--line)",
                    cursor: "pointer",
                    textAlign: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    transition: "transform 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: "22px" }}>🔖</span>
                  <div style={{ fontSize: "20px", fontWeight: 700, margin: "4px 0 2px", color: "var(--accent)" }}>
                    {formatBengaliNumber(bookmarkedItems.length)}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>সংরক্ষিত লেখা</div>
                </div>

                {/* 2. Likes */}
                <div
                  onClick={() => setActiveTab("likes")}
                  style={{
                    padding: "16px 12px",
                    borderRadius: "14px",
                    background: "var(--card)",
                    border: "1px solid var(--line)",
                    cursor: "pointer",
                    textAlign: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    transition: "transform 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: "22px" }}>❤️</span>
                  <div style={{ fontSize: "20px", fontWeight: 700, margin: "4px 0 2px", color: "#e11d48" }}>
                    {formatBengaliNumber(likedItems.length)}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>দেওয়া ভালোবাসা</div>
                </div>

                {/* 3. Comments */}
                <div
                  onClick={() => setActiveTab("comments")}
                  style={{
                    padding: "16px 12px",
                    borderRadius: "14px",
                    background: "var(--card)",
                    border: "1px solid var(--line)",
                    cursor: "pointer",
                    textAlign: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    transition: "transform 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: "22px" }}>💬</span>
                  <div style={{ fontSize: "20px", fontWeight: 700, margin: "4px 0 2px", color: "var(--gold)" }}>
                    {formatBengaliNumber(userComments.length)}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>করা মন্তব্য</div>
                </div>

                {/* 4. Reader Activity Score */}
                <div
                  style={{
                    padding: "16px 12px",
                    borderRadius: "14px",
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    textAlign: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  }}
                >
                  <span style={{ fontSize: "22px" }}>🏆</span>
                  <div style={{ fontSize: "20px", fontWeight: 700, margin: "4px 0 2px", color: "#16a34a" }}>
                    {formatBengaliNumber(readerActivityScore)}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>সম্মাননা পয়েন্ট</div>
                </div>
              </div>

              {/* Literary Badges & Milestones */}
              <div
                style={{
                  padding: "16px 18px",
                  borderRadius: "14px",
                  background: "var(--card)",
                  border: "1px solid var(--line)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "6px" }}>
                  <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--ink)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>🎖️</span>
                    <span>পাঠক সম্মাননা স্মারক ও অর্জন</span>
                  </span>
                  <span style={{ fontSize: "11.5px", color: "var(--muted)" }}>
                    {readerTier.desc}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {/* Badge 1: New Member */}
                  <div
                    title="সাহিত্য সংসদে নিবন্ধিত সদস্য"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "5px 12px",
                      borderRadius: "20px",
                      background: "rgba(22, 163, 74, 0.1)",
                      border: "1px solid rgba(22, 163, 74, 0.25)",
                      color: "#15803d",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    <span>🌿</span>
                    <span>নিবন্ধিত পাঠক</span>
                  </div>

                  {/* Badge 2: Verified */}
                  <div
                    title={currentUser.emailVerified ? "ইমেইল ভেরিফাইড সুরক্ষিত পাঠক" : "ইমেইল ভেরিফাই করলে এই ব্যাজ আনলক হবে"}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "5px 12px",
                      borderRadius: "20px",
                      background: currentUser.emailVerified ? "rgba(2, 132, 199, 0.1)" : "var(--surface)",
                      border: `1px solid ${currentUser.emailVerified ? "rgba(2, 132, 199, 0.3)" : "var(--line)"}`,
                      color: currentUser.emailVerified ? "#0284c7" : "var(--muted)",
                      fontSize: "12px",
                      fontWeight: 600,
                      opacity: currentUser.emailVerified ? 1 : 0.6,
                    }}
                  >
                    <span>🛡️</span>
                    <span>{currentUser.emailVerified ? "সুরক্ষিত পাঠক" : "ভেরিফিকেশন বাকি"}</span>
                  </div>

                  {/* Badge 3: Bookworm */}
                  <div
                    title={bookmarkedItems.length >= 3 ? "৩টির বেশি লেখা সংরক্ষণ করেছেন" : "৩টি লেখা সংরক্ষণ করলে আনলক হবে"}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "5px 12px",
                      borderRadius: "20px",
                      background: bookmarkedItems.length >= 3 ? "rgba(202, 168, 105, 0.15)" : "var(--surface)",
                      border: `1px solid ${bookmarkedItems.length >= 3 ? "rgba(202, 168, 105, 0.4)" : "var(--line)"}`,
                      color: bookmarkedItems.length >= 3 ? "var(--gold)" : "var(--muted)",
                      fontSize: "12px",
                      fontWeight: 600,
                      opacity: bookmarkedItems.length >= 3 ? 1 : 0.6,
                    }}
                  >
                    <span>📚</span>
                    <span>বইপ্রেমী পাঠক</span>
                  </div>

                  {/* Badge 4: Thoughtful Commenter */}
                  <div
                    title={userComments.length >= 1 ? "সাহিত্য আলোচনায় মতামত দিয়েছেন" : "১টি মন্তব্য করলে আনলক হবে"}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "5px 12px",
                      borderRadius: "20px",
                      background: userComments.length >= 1 ? "rgba(160, 72, 52, 0.1)" : "var(--surface)",
                      border: `1px solid ${userComments.length >= 1 ? "rgba(160, 72, 52, 0.25)" : "var(--line)"}`,
                      color: userComments.length >= 1 ? "var(--accent)" : "var(--muted)",
                      fontSize: "12px",
                      fontWeight: 600,
                      opacity: userComments.length >= 1 ? 1 : 0.6,
                    }}
                  >
                    <span>💬</span>
                    <span>চিন্তাশীল আলোচক</span>
                  </div>

                  {/* Badge 5: Appreciator */}
                  <div
                    title={likedItems.length >= 3 ? "৩টি লেখায় ভালোবাসা প্রকাশ করেছেন" : "৩টি লেখায় ভালোবাসা দিলে আনলক হবে"}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "5px 12px",
                      borderRadius: "20px",
                      background: likedItems.length >= 3 ? "rgba(225, 29, 72, 0.1)" : "var(--surface)",
                      border: `1px solid ${likedItems.length >= 3 ? "rgba(225, 29, 72, 0.25)" : "var(--line)"}`,
                      color: likedItems.length >= 3 ? "#e11d48" : "var(--muted)",
                      fontSize: "12px",
                      fontWeight: 600,
                      opacity: likedItems.length >= 3 ? 1 : 0.6,
                    }}
                  >
                    <span>❤️</span>
                    <span>মুগ্ধ সমঝদার</span>
                  </div>
                </div>
              </div>

              {/* Literary Inspiration Quote */}
              <div
                style={{
                  padding: "14px 18px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, var(--surface, #f1ede3) 0%, var(--card, #ffffff) 100%)",
                  border: "1px solid var(--line)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <span style={{ fontSize: "24px", lineHeight: 1 }}>✒️</span>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-serif, 'Noto Serif Bengali', serif)",
                      fontStyle: "italic",
                      fontSize: "13.5px",
                      lineHeight: 1.6,
                      color: "var(--ink)",
                    }}
                  >
                    &ldquo;শব্দের মাঝে জীবন খোঁজা, নীরবতায় ভাবনার বিস্তার — একজন পাঠকের মননই সাহিত্যের আসল আলয়।&rdquo;
                  </p>
                  <span style={{ display: "block", marginTop: "4px", fontSize: "11.5px", color: "var(--gold)", fontWeight: 600 }}>
                    — অহনা ইসলাম (লেখক বার্তা)
                  </span>
                </div>
              </div>

              {/* Unverified Notice Banner */}
              {!currentUser.emailVerified && (
                <div
                  style={{
                    padding: "14px 18px",
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
                    <h5 style={{ margin: "0 0 2px", color: "#b45309", fontSize: "13.5px", fontWeight: 700 }}>
                      আপনার ইমেইল ঠিকানা এখনো ভেরিফাই করা হয়নি
                    </h5>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>
                      ভেরিফাই করে নিন যাতে সহজেই পাসওয়ার্ড উদ্ধার এবং ভেরিফায়েড পাঠক ব্যাজ পাওয়া যায়।
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("verification")}
                    style={{
                      padding: "7px 14px",
                      borderRadius: "20px",
                      background: "#b45309",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ভেরিফাই করুন →
                  </button>
                </div>
              )}

              {/* Quick Actions */}
              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("edit_profile")}
                  style={{
                    flex: 1,
                    padding: "11px 16px",
                    borderRadius: "12px",
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    color: "var(--ink)",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <span>✏️</span>
                  <span>প্রোফাইল ও ছবি সাজান</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    padding: "11px 20px",
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

              {/* Bio field with quick suggestions */}
              <div>
                <label style={{ display: "block", fontSize: "13.5px", fontWeight: 600, marginBottom: "6px" }}>
                  সংক্ষিপ্ত সাহিত্যিক পরিচয় / বায়ো (ঐচ্ছিক)
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
                {/* Quick Bio suggestion pills */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                  <span style={{ fontSize: "11.5px", color: "var(--muted)", alignSelf: "center" }}>পছন্দের পরিচয়:</span>
                  {[
                    "সাহিত্যের চিরন্তন মুগ্ধ পাঠক 📖",
                    "কবিতা ও নিঃসঙ্গ রাতের সহযাত্রী ☕",
                    "উপন্যাসের গভীর অনুভূতির সন্ধানী 🌿",
                  ].map((presetBio, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditBio(presetBio)}
                      style={{
                        padding: "3px 9px",
                        borderRadius: "12px",
                        background: "var(--card)",
                        border: "1px solid var(--line)",
                        fontSize: "11.5px",
                        color: "var(--ink)",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                    >
                      {presetBio}
                    </button>
                  ))}
                </div>
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
                      placeholder="কমপক্ষে ৮ অক্ষর (বড়, ছোট, সংখ্যা, চিহ্ন)"
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
                {newPassword && <PasswordStrengthIndicator password={newPassword} />}
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
                  <div
                    style={{
                      padding: "12px 16px",
                      borderRadius: "10px",
                      background: "rgba(22, 163, 74, 0.08)",
                      border: "1px solid rgba(22, 163, 74, 0.25)",
                      color: "#166534",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "13px",
                      lineHeight: "1.5",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>📨</span>
                    <span>
                      আপনার <strong>{currentUser.email}</strong> ঠিকানায় কোড পাঠানো হয়েছে। ইনবক্স অথবা <strong>স্প্যাম (Spam/Junk)</strong> ফোল্ডার চেক করুন।
                    </span>
                  </div>

                  {/* 1-Minute Code Validity Timer Banner */}
                  {codeRemainingSeconds > 0 ? (
                    <div
                      style={{
                        padding: "9px 14px",
                        borderRadius: "10px",
                        background: "rgba(202, 168, 105, 0.12)",
                        border: "1px solid rgba(202, 168, 105, 0.35)",
                        color: "var(--ink)",
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>⏱️</span>
                        <span>কোডের মেয়াদ বাকি: <strong>{formatTimerSeconds(codeRemainingSeconds)}</strong></span>
                      </span>
                      <span style={{ fontSize: "11.5px", color: "var(--muted)" }}>মেয়াদ ১ মিনিট</span>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "9px 14px",
                        borderRadius: "10px",
                        background: "rgba(220, 38, 38, 0.08)",
                        border: "1px solid rgba(220, 38, 38, 0.25)",
                        color: "#b91c1c",
                        fontSize: "12.5px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span>⚠️</span>
                      <span>কোডের মেয়াদ (১ মিনিট) শেষ হয়েছে। অনুগ্রহ করে নতুন কোড পাঠান।</span>
                    </div>
                  )}

                  {/* Direct Link & Quick Code Helper */}
                  {verificationLink && (
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: "var(--surface)",
                        border: "1px solid var(--line)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--ink)" }}>
                          🔗 সরাসরি ভেরিফিকেশন লিংক:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (verificationLink) {
                              navigator.clipboard.writeText(verificationLink);
                              setCopiedLink(true);
                              setTimeout(() => setCopiedLink(false), 2000);
                            }
                          }}
                          style={{
                            background: "var(--card)",
                            border: "1px solid var(--line)",
                            borderRadius: "6px",
                            padding: "3px 8px",
                            fontSize: "11.5px",
                            cursor: "pointer",
                            color: "var(--ink)",
                            fontWeight: 600,
                          }}
                        >
                          {copiedLink ? "✓ কপি হয়েছে" : "📋 কপি লিংক"}
                        </button>
                      </div>
                      <a
                        href={verificationLink}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "block",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          background: "var(--card)",
                          color: "var(--accent)",
                          fontSize: "12px",
                          wordBreak: "break-all",
                          textDecoration: "none",
                          border: "1px solid var(--line)",
                          textAlign: "center",
                          fontWeight: 700,
                        }}
                      >
                        এক ক্লিকে ভেরিফাই করুন →
                      </a>
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
                      {resendCooldown > 0
                        ? `পুনরায় কোড পাঠান (${formatTimerSeconds(resendCooldown)} পর)`
                        : "🔄 নতুন কোড পাঠান"}
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
