/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  BookOpen,
  Camera,
  X,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Check,
} from "lucide-react";
import {
  getCurrentUser,
  registerUser,
  loginUser,
  verifyEmailCode,
  sendEmailVerificationCode,
  requestPasswordReset,
  resetPassword,
  ReaderUser,
  LITERARY_AVATAR_PRESETS,
  checkPasswordStrength,
  RESEND_COOLDOWN_SECONDS,
  CODE_VALIDITY_SECONDS,
  formatTimerSeconds,
  isValidEmail,
} from "@/lib/userAuth";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: ReaderUser) => void;
  initialMode?: "login" | "register" | "verify";
  notice?: string | null;
}

type AuthMode = "login" | "register" | "verify" | "forgot";

export default function UserAuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = "login",
  notice,
}: UserAuthModalProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common / Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regBio, setRegBio] = useState("");
  const [regAvatarUrl, setRegAvatarUrl] = useState("");

  // Verification form
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyOtp, setVerifyOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0); // 3 minutes cooldown
  const [codeExpirySeconds, setCodeExpirySeconds] = useState(0); // 1 minute validity timer
  const [latestCode, setLatestCode] = useState<string | null>(null);
  const [latestVerificationLink, setLatestVerificationLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Forgot Password form
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

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
    if (codeExpirySeconds <= 0) return;
    const interval = setInterval(() => {
      setCodeExpirySeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [codeExpirySeconds]);

  // Lock body scroll and reset errors when modal opens
  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    setError(null);
    setSuccessMsg(null);
    setMode(initialMode);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, initialMode]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!mounted || !isOpen) return null;

  // Handle image upload from device
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("অনুগ্রহ করে একটি ছবি ফাইল (JPG, PNG বা WEBP) নির্বাচন করুন");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setRegAvatarUrl(dataUrl);
        setError(null);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regName.trim()) {
      setError("অনুগ্রহ করে আপনার পুরো নাম লিখুন");
      return;
    }
    if (!isValidEmail(regEmail.trim())) {
      setError("অনুগ্রহ করে একটি সঠিক ও সক্রিয় ইমেইল ঠিকানা প্রদান করুন (যেমন: example@gmail.com)");
      return;
    }

    const strength = checkPasswordStrength(regPassword);
    if (!strength.isStrong) {
      setError(`পাসওয়ার্ড অবশ্যই শক্তিশালী হতে হবে: ${strength.message}`);
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError("পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড মিলছে না!");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await registerUser({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        avatarUrl: regAvatarUrl,
        bio: regBio.trim(),
      });

      setVerifyEmail(res.user.email);
      setLatestCode(res.verificationCode);
      setLatestVerificationLink(res.verificationLink);
      // 3 minutes resend cooldown & 1 minute code validity
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setCodeExpirySeconds(CODE_VALIDITY_SECONDS);
      setSuccessMsg(res.message || "আপনার ইমেইলে ভেরিফিকেশন কোড পাঠানো হয়েছে। ইমেইল ইনবক্স চেক করে কোডটি দিন।");
      setIsSubmitting(false);
      // Switch directly to verify mode - do NOT log in yet
      setMode("verify");
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || "নিবন্ধন করতে সমস্যা হয়েছে");
    }
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!isValidEmail(loginEmail.trim())) {
      setError("অনুগ্রহ করে একটি সঠিক ও সক্রিয় ইমেইল ঠিকানা লিখুন");
      return;
    }

    try {
      setIsSubmitting(true);
      const user = await loginUser({
        email: loginEmail.trim(),
        password: loginPassword,
        rememberMe,
      });

      setIsSubmitting(false);
      setSuccessMsg("লগইন সফল হয়েছে! স্বাগতম।");
      if (onLoginSuccess) onLoginSuccess(user);
      setTimeout(() => {
        onClose();
      }, 350);
    } catch (err: any) {
      setIsSubmitting(false);
      const msg = err?.message || "লগইন করতে সমস্যা হয়েছে";
      if (msg.startsWith("UNVERIFIED:")) {
        const parts = msg.split(":");
        const email = parts[1] || loginEmail.trim();
        const reason = parts.slice(2).join(":") || "আপনার একাউন্ট এখনও ভেরিফাই করা হয়নি। অনুগ্রহ করে কোড দিন।";
        setVerifyEmail(email);
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        setCodeExpirySeconds(CODE_VALIDITY_SECONDS);
        setError(reason);
        setMode("verify");
      } else {
        setError(msg);
      }
    }
  };

  // Handle Verification
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const targetEmail = verifyEmail || getCurrentUser()?.email;
    if (!targetEmail) {
      setError("ইমেইল ঠিকানা পাওয়া যায়নি");
      return;
    }

    if (!verifyOtp.trim() || verifyOtp.trim().length !== 6) {
      setError("৬-সংখ্যার সঠিক ভেরিফিকেশন কোডটি লিখুন");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await verifyEmailCode(targetEmail, verifyOtp.trim());
      setIsSubmitting(false);
      if (res.success) {
        setCodeExpirySeconds(0);
        setSuccessMsg("অভিনন্দন! আপনার পাঠক একাউন্ট সফলভাবে ভেরিফায়েড ও কার্যকর হয়েছে। 🎉");
        if (onLoginSuccess) onLoginSuccess(res.user);
        setTimeout(() => {
          onClose();
        }, 700);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || "ভেরিফিকেশন ব্যর্থ হয়েছে");
    }
  };

  // Resend OTP (3 minutes cooldown & 1 minute validity)
  const handleResendOtp = async () => {
    const targetEmail = verifyEmail || getCurrentUser()?.email;
    if (!targetEmail) return;
    if (resendCooldown > 0) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await sendEmailVerificationCode(targetEmail);
      setIsSubmitting(false);
      setLatestCode(res.code);
      setLatestVerificationLink(res.verificationLink);
      setResendCooldown(RESEND_COOLDOWN_SECONDS); // 3 minutes cooldown
      setCodeExpirySeconds(CODE_VALIDITY_SECONDS); // 1 minute validity
      setSuccessMsg(res.message || "আপনার ইমেইলে নতুন কোড পাঠানো হয়েছে।");
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || "কোড পাঠাতে সমস্যা হয়েছে");
    }
  };

  // Forgot Password Step 1: Send Reset Code
  const handleForgotStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(forgotEmail.trim())) {
      setError("অনুগ্রহ করে একটি সঠিক ও সক্রিয় নিবন্ধিত ইমেইল লিখুন");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await requestPasswordReset(forgotEmail.trim());
      setIsSubmitting(false);
      setLatestCode(res.code);
      setLatestVerificationLink(res.verificationLink);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setCodeExpirySeconds(CODE_VALIDITY_SECONDS);
      setForgotStep(2);
      setSuccessMsg("আপনার ইমেইলে পাসওয়ার্ড রিসেট কোড পাঠানো হয়েছে। ইনবক্স অথবা স্প্যাম ফোল্ডার চেক করুন।");
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || "ইমেইল খুঁজে পাওয়া যায়নি");
    }
  };

  // Forgot Password Step 2: Reset Password
  const handleForgotStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!forgotOtp.trim() || forgotOtp.trim().length !== 6) {
      setError("৬-সংখ্যার কোডটি লিখুন");
      return;
    }

    const strength = checkPasswordStrength(newPassword);
    if (!strength.isStrong) {
      setError(`নতুন পাসওয়ার্ড অবশ্যই শক্তিশালী হতে হবে: ${strength.message}`);
      return;
    }

    try {
      resetPassword(forgotEmail.trim(), forgotOtp.trim(), newPassword);
      setSuccessMsg("পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! এখন লগইন করুন।");
      setMode("login");
      setLoginEmail(forgotEmail);
      setForgotStep(1);
    } catch (err: any) {
      setError(err?.message || "পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে");
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="user-auth-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000000,
        background: "rgba(12, 16, 22, 0.78)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          position: "relative",
          margin: "auto",
          width: "100%",
          maxWidth: "470px",
          maxHeight: "min(92vh, 760px)",
          display: "flex",
          flexDirection: "column",
          background: "var(--card, #ffffff)",
          color: "var(--ink, #1c2420)",
          borderRadius: "22px",
          border: "1px solid var(--line, #e2e8f0)",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)",
          fontFamily: "var(--font-siliguri), sans-serif",
          animation: "ratingModalPopIn 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          overflow: "hidden",
        }}
      >
        {/* Top Decorative Literary Gradient Accent */}
        <div
          style={{
            height: "4px",
            background: "linear-gradient(90deg, var(--gold, #caa869) 0%, var(--accent, #a04834) 50%, var(--gold, #caa869) 100%)",
            width: "100%",
          }}
        />

        {/* Header with Title & Close */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid var(--line, #e2e8f0)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
            background: "linear-gradient(180deg, rgba(202, 168, 105, 0.08) 0%, transparent 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(160, 72, 52, 0.15) 0%, rgba(202, 168, 105, 0.2) 100%)",
                color: "var(--accent, #a04834)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(160, 72, 52, 0.2)",
                boxShadow: "0 2px 8px rgba(160, 72, 52, 0.08)",
                flexShrink: 0,
              }}
            >
              {mode === "login" && <BookOpen size={20} />}
              {mode === "register" && <Sparkles size={20} />}
              {mode === "verify" && <ShieldCheck size={20} />}
              {mode === "forgot" && <KeyRound size={20} />}
            </div>
            <div>
              <div
                style={{
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "var(--gold, #caa869)",
                  fontWeight: 700,
                  marginBottom: "2px",
                }}
              >
                অহনা ইসলাম সাহিত্য পোর্টাল
              </div>
              <h3 style={{ margin: 0, fontSize: "18.5px", fontWeight: 700, color: "var(--ink)", lineHeight: 1.25 }}>
                {mode === "login" && "পাঠক একাউন্টে প্রবেশ"}
                {mode === "register" && "নতুন পাঠক নিবন্ধন"}
                {mode === "verify" && "ইমেইল ভেরিফিকেশন"}
                {mode === "forgot" && "পাসওয়ার্ড উদ্ধার"}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: "rgba(0, 0, 0, 0.05)",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
            aria-label="বন্ধ করুন"
          >
            <X size={17} />
          </button>
        </div>

        {/* Notice for Reader Gate (Locked story/novel alert) */}
        {notice && (
          <div
            style={{
              padding: "11px 20px",
              background: "rgba(160, 72, 52, 0.09)",
              borderBottom: "1px solid rgba(160, 72, 52, 0.18)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13px",
              color: "var(--accent, #a04834)",
              fontWeight: 600,
              lineHeight: "1.45",
            }}
          >
            <span style={{ fontSize: "16px", flexShrink: 0 }}>🔒</span>
            <span>{notice}</span>
          </div>
        )}

        {/* Modern Segmented Pill Switcher (Login vs Register) */}
        {(mode === "login" || mode === "register") && (
          <div style={{ padding: "14px 22px 4px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                padding: "4px",
                borderRadius: "14px",
                background: "var(--surface, #f5f3ee)",
                border: "1px solid var(--line, #e2e8f0)",
                gap: "4px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setSuccessMsg(null);
                }}
                style={{
                  padding: "9px 12px",
                  borderRadius: "11px",
                  border: "none",
                  background: mode === "login" ? "var(--card, #ffffff)" : "transparent",
                  color: mode === "login" ? "var(--accent, #a04834)" : "var(--muted)",
                  fontWeight: mode === "login" ? 700 : 500,
                  fontSize: "14px",
                  cursor: "pointer",
                  boxShadow: mode === "login" ? "0 2px 8px rgba(0, 0, 0, 0.08)" : "none",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <BookOpen size={15} />
                <span>লগইন করুন</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError(null);
                  setSuccessMsg(null);
                }}
                style={{
                  padding: "9px 12px",
                  borderRadius: "11px",
                  border: "none",
                  background: mode === "register" ? "var(--card, #ffffff)" : "transparent",
                  color: mode === "register" ? "var(--accent, #a04834)" : "var(--muted)",
                  fontWeight: mode === "register" ? 700 : 500,
                  fontSize: "14px",
                  cursor: "pointer",
                  boxShadow: mode === "register" ? "0 2px 8px rgba(0, 0, 0, 0.08)" : "none",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <Sparkles size={15} />
                <span>নতুন একাউন্ট (ফ্রি)</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 24px" }}>
          {/* Status Notifications */}
          {error && (
            <div
              style={{
                padding: "11px 14px",
                borderRadius: "12px",
                background: "rgba(220, 38, 38, 0.09)",
                border: "1px solid rgba(220, 38, 38, 0.25)",
                color: "#b91c1c",
                fontSize: "13px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                lineHeight: "1.5",
              }}
            >
              <AlertCircle size={17} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                padding: "11px 14px",
                borderRadius: "12px",
                background: "rgba(22, 163, 74, 0.09)",
                border: "1px solid rgba(22, 163, 74, 0.25)",
                color: "#15803d",
                fontSize: "13px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                lineHeight: "1.5",
              }}
            >
              <Check size={17} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. LOGIN MODE */}
          {mode === "login" && (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "6px",
                    color: "var(--ink)",
                  }}
                >
                  ইমেইল ঠিকানা
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={16}
                    style={{
                      position: "absolute",
                      left: "13px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--muted)",
                    }}
                  />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    style={{
                      width: "100%",
                      padding: "11px 14px 11px 38px",
                      borderRadius: "12px",
                      border: "1.5px solid var(--line, #e2e8f0)",
                      background: "var(--background, #ffffff)",
                      color: "var(--ink, #1c2420)",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 0.15s ease",
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>পাসওয়ার্ড</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setForgotEmail(loginEmail);
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent, #a04834)",
                      fontSize: "12.5px",
                      cursor: "pointer",
                      padding: 0,
                      fontWeight: 600,
                    }}
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={16}
                    style={{
                      position: "absolute",
                      left: "13px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--muted)",
                    }}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="আপনার পাসওয়ার্ড লিখুন"
                    style={{
                      width: "100%",
                      padding: "11px 38px 11px 38px",
                      borderRadius: "12px",
                      border: "1.5px solid var(--line, #e2e8f0)",
                      background: "var(--background, #ffffff)",
                      color: "var(--ink, #1c2420)",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 0.15s ease",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "11px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      color: "var(--muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    aria-label={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me 7-day Option */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "2px 0 6px" }}>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "var(--ink, #1c2420)",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{
                      width: "16px",
                      height: "16px",
                      accentColor: "var(--accent, #a04834)",
                      cursor: "pointer",
                    }}
                  />
                  <span>আমাকে ৭ দিন মনে রাখুন</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  marginTop: "6px",
                  padding: "13px 18px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, var(--accent, #a04834) 0%, #b8543f 100%)",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  boxShadow: "0 6px 18px rgba(160, 72, 52, 0.28)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
              >
                <span>{isSubmitting ? "প্রবেশ হচ্ছে..." : "প্রবেশ করুন"}</span>
                <ArrowRight size={17} />
              </button>

              <div
                style={{
                  textAlign: "center",
                  marginTop: "8px",
                  paddingTop: "14px",
                  borderTop: "1px solid var(--line, #e2e8f0)",
                }}
              >
                <span style={{ fontSize: "13.5px", color: "var(--muted)" }}>
                  একাউন্ট নেই?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent, #a04834)",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                      textDecoration: "underline",
                      textUnderlineOffset: "3px",
                    }}
                  >
                    এখনই বিনামূল্যে নিবন্ধন করুন
                  </button>
                </span>
              </div>
            </form>
          )}

          {/* 2. REGISTRATION MODE (With Pic Setup) */}
          {mode === "register" && (
            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {/* PIC SETUP SECTION */}
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "14px",
                  background: "var(--surface, #f8f6f0)",
                  border: "1.5px solid var(--line, #e2e8f0)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>
                    প্রোফাইল ছবি সেটআপ (ঐচ্ছিক)
                  </label>
                  {regAvatarUrl && (
                    <button
                      type="button"
                      onClick={() => setRegAvatarUrl("")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#dc2626",
                        fontSize: "12px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      ছবি সরান
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px" }}>
                  {/* Current Avatar Preview */}
                  <div style={{ position: "relative" }}>
                    {regAvatarUrl ? (
                      <img
                        src={regAvatarUrl}
                        alt="Avatar Preview"
                        style={{
                          width: "54px",
                          height: "54px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "2px solid var(--accent, #a04834)",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "54px",
                          height: "54px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, var(--gold, #caa869) 0%, var(--accent, #a04834) 100%)",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "20px",
                          fontWeight: 700,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                        }}
                      >
                        {regName.trim().charAt(0).toUpperCase() || <User size={24} />}
                      </div>
                    )}
                  </div>

                  {/* Device Upload Button */}
                  <div>
                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 14px",
                        borderRadius: "10px",
                        background: "var(--card, #ffffff)",
                        border: "1px solid var(--line, #e2e8f0)",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        cursor: "pointer",
                        color: "var(--ink)",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                      }}
                    >
                      <Camera size={15} />
                      <span>গ্যালারি থেকে ছবি দিন</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>
                </div>

                {/* Preset Avatars Selection */}
                <div>
                  <span style={{ display: "block", fontSize: "11.5px", color: "var(--muted)", marginBottom: "6px" }}>
                    অথবা সাহিত্যিক অবতার বেছে নিন:
                  </span>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {LITERARY_AVATAR_PRESETS.map((p) => {
                      const isSelected = regAvatarUrl === p.url;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setRegAvatarUrl(p.url)}
                          title={p.label}
                          style={{
                            cursor: "pointer",
                            position: "relative",
                            padding: "2px",
                            borderRadius: "50%",
                            border: isSelected ? "2.5px solid var(--accent, #a04834)" : "1.5px solid transparent",
                            transform: isSelected ? "scale(1.08)" : "scale(1)",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <img
                            src={p.url}
                            alt={p.label}
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "5px", color: "var(--ink)" }}>
                  আপনার পুরো নাম *
                </label>
                <div style={{ position: "relative" }}>
                  <User
                    size={16}
                    style={{
                      position: "absolute",
                      left: "13px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--muted)",
                    }}
                  />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="যেমন: আহসানুর রহমান"
                    required
                    style={{
                      width: "100%",
                      padding: "11px 14px 11px 38px",
                      borderRadius: "12px",
                      border: "1.5px solid var(--line, #e2e8f0)",
                      background: "var(--background, #ffffff)",
                      color: "var(--ink, #1c2420)",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "5px", color: "var(--ink)" }}>
                  ইমেইল ঠিকানা *
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={16}
                    style={{
                      position: "absolute",
                      left: "13px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--muted)",
                    }}
                  />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    style={{
                      width: "100%",
                      padding: "11px 14px 11px 38px",
                      borderRadius: "12px",
                      border: "1.5px solid var(--line, #e2e8f0)",
                      background: "var(--background, #ffffff)",
                      color: "var(--ink, #1c2420)",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Password & Confirm */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "5px", color: "var(--ink)" }}>
                    পাসওয়ার্ড *
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showRegPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="কমপক্ষে ৮ অক্ষর"
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "11px",
                        border: "1.5px solid var(--line, #e2e8f0)",
                        background: "var(--background, #ffffff)",
                        color: "var(--ink, #1c2420)",
                        fontSize: "13.5px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "5px", color: "var(--ink)" }}>
                    পাসওয়ার্ড নিশ্চিতকরণ *
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showRegPassword ? "text" : "password"}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="পুনরায় লিখুন"
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "11px",
                        border: "1.5px solid var(--line, #e2e8f0)",
                        background: "var(--background, #ffffff)",
                        color: "var(--ink, #1c2420)",
                        fontSize: "13.5px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Password Strength Indicator */}
              <PasswordStrengthIndicator password={regPassword} />

              {/* Show Password Toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input
                  type="checkbox"
                  id="showRegPass"
                  checked={showRegPassword}
                  onChange={(e) => setShowRegPassword(e.target.checked)}
                  style={{ accentColor: "var(--accent, #a04834)", cursor: "pointer" }}
                />
                <label htmlFor="showRegPass" style={{ fontSize: "12.5px", color: "var(--muted)", cursor: "pointer" }}>
                  পাসওয়ার্ড দেখুন
                </label>
              </div>

              {/* Bio */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "5px", color: "var(--ink)" }}>
                  সংক্ষিপ্ত পরিচয় / প্রিয় সাহিত্যিক উদ্ধৃতি (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={regBio}
                  onChange={(e) => setRegBio(e.target.value)}
                  placeholder="যেমন: কবিতাপ্রেমী, ছোটগল্পের নিয়মিত পাঠক..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "11px",
                    border: "1.5px solid var(--line, #e2e8f0)",
                    background: "var(--background, #ffffff)",
                    color: "var(--ink, #1c2420)",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  marginTop: "6px",
                  padding: "13px 18px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, var(--accent, #a04834) 0%, #b8543f 100%)",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  boxShadow: "0 6px 18px rgba(160, 72, 52, 0.28)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <span>{isSubmitting ? "নিবন্ধন সম্পন্ন হচ্ছে..." : "একাউন্ট তৈরি করুন"}</span>
                <Sparkles size={17} />
              </button>

              <div
                style={{
                  textAlign: "center",
                  marginTop: "6px",
                  paddingTop: "12px",
                  borderTop: "1px solid var(--line, #e2e8f0)",
                }}
              >
                <span style={{ fontSize: "13.5px", color: "var(--muted)" }}>
                  ইতিমধ্যে একাউন্ট আছে?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent, #a04834)",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                      textDecoration: "underline",
                      textUnderlineOffset: "3px",
                    }}
                  >
                    লগইন করুন
                  </button>
                </span>
              </div>
            </form>
          )}

          {/* 3. EMAIL VERIFICATION MODE */}
          {mode === "verify" && (
            <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ textAlign: "center", padding: "6px 0" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "rgba(160, 72, 52, 0.12)",
                    color: "var(--accent, #a04834)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <Mail size={28} />
                </div>
                <h4 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 700 }}>
                  ইমেইল ভেরিফিকেশন কোড
                </h4>
                <p style={{ margin: 0, fontSize: "13.5px", color: "var(--muted)", lineHeight: "1.5" }}>
                  <strong style={{ color: "var(--ink)" }}>{verifyEmail || getCurrentUser()?.email}</strong> ঠিকানায় একটি ৬-সংখ্যার কোড পাঠানো হয়েছে।
                </p>
              </div>

              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "14px",
                  background: "rgba(22, 163, 74, 0.08)",
                  border: "1px solid rgba(22, 163, 74, 0.25)",
                  color: "#166534",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span style={{ fontSize: "20px" }}>📨</span>
                <span>
                  আপনার ইমেইল ইনবক্স অথবা <strong>স্প্যাম (Spam/Junk)</strong> ফোল্ডার চেক করুন এবং প্রাপ্ত ৬-সংখ্যার কোডটি নিচে দিন।
                </span>
              </div>

              {/* 1-Minute Code Validity Timer */}
              {codeExpirySeconds > 0 ? (
                <div
                  style={{
                    padding: "8px 14px",
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
                    <span>কোডের মেয়াদ বাকি: <strong>{formatTimerSeconds(codeExpirySeconds)}</strong></span>
                  </span>
                  <span style={{ fontSize: "11.5px", color: "var(--muted)" }}>মেয়াদ ১ মিনিট</span>
                </div>
              ) : (
                <div
                  style={{
                    padding: "8px 14px",
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

              {/* Direct Verification Link */}
              {latestVerificationLink && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "12px",
                    background: "rgba(202, 168, 105, 0.08)",
                    border: "1px solid var(--line, #e2e8f0)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)" }}>
                      🔗 সরাসরি ভেরিফিকেশন লিংক:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (latestVerificationLink) {
                          navigator.clipboard.writeText(latestVerificationLink);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }
                      }}
                      style={{
                        background: "var(--background, #ffffff)",
                        border: "1px solid var(--line, #e2e8f0)",
                        borderRadius: "6px",
                        padding: "2px 8px",
                        fontSize: "11px",
                        cursor: "pointer",
                        color: "var(--ink)",
                        fontWeight: 600,
                      }}
                    >
                      {copiedLink ? "✓ কপি হয়েছে" : "📋 কপি লিংক"}
                    </button>
                  </div>
                  <a
                    href={latestVerificationLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "block",
                      padding: "7px 10px",
                      borderRadius: "8px",
                      background: "var(--background, #ffffff)",
                      color: "var(--accent, #a04834)",
                      fontSize: "12px",
                      wordBreak: "break-all",
                      textDecoration: "none",
                      border: "1px solid var(--line, #e2e8f0)",
                      textAlign: "center",
                      fontWeight: 700,
                    }}
                  >
                    এক ক্লিকে ভেরিফাই করুন →
                  </a>
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", textAlign: "center" }}>
                  ৬-সংখ্যার কোডটি প্রবেশ করান
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={verifyOtp}
                  onChange={(e) => setVerifyOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  required
                  style={{
                    width: "100%",
                    padding: "13px",
                    borderRadius: "12px",
                    border: "1.5px solid var(--line, #e2e8f0)",
                    background: "var(--background, #ffffff)",
                    color: "var(--ink, #1c2420)",
                    fontSize: "22px",
                    fontWeight: 700,
                    letterSpacing: "8px",
                    textAlign: "center",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: "13px 18px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, var(--accent, #a04834) 0%, #b8543f 100%)",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <span>{isSubmitting ? "যাচাই হচ্ছে..." : "ইমেইল ভেরিফাই করুন"}</span>
                <ShieldCheck size={18} />
              </button>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", paddingTop: "4px" }}>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isSubmitting}
                  style={{
                    background: "none",
                    border: "none",
                    color: resendCooldown > 0 ? "var(--muted)" : "var(--accent, #a04834)",
                    cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                    padding: 0,
                    fontWeight: 600,
                  }}
                >
                  {resendCooldown > 0
                    ? `কোড পুনরায় পাঠান (${formatTimerSeconds(resendCooldown)} পর)`
                    : "🔄 কোড পুনরায় পাঠান"}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 0 }}
                >
                  লগইনে ফিরে যান
                </button>
              </div>
            </form>
          )}

          {/* 4. FORGOT PASSWORD MODE */}
          {mode === "forgot" && (
            <div>
              {forgotStep === 1 ? (
                <form onSubmit={handleForgotStep1} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                      নিবন্ধিত ইমেইল ঠিকানা
                    </label>
                    <div style={{ position: "relative" }}>
                      <Mail
                        size={16}
                        style={{
                          position: "absolute",
                          left: "13px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--muted)",
                        }}
                      />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="আপনার ইমেইল ঠিকানা লিখুন"
                        required
                        style={{
                          width: "100%",
                          padding: "11px 14px 11px 38px",
                          borderRadius: "12px",
                          border: "1.5px solid var(--line, #e2e8f0)",
                          background: "var(--background, #ffffff)",
                          color: "var(--ink, #1c2420)",
                          fontSize: "14px",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{
                      padding: "13px 18px",
                      borderRadius: "14px",
                      background: "linear-gradient(135deg, var(--accent, #a04834) 0%, #b8543f 100%)",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "14.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <span>রিসেট কোড পাঠান</span>
                    <ArrowRight size={17} />
                  </button>

                  <div style={{ textAlign: "center", marginTop: "4px" }}>
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "13px", cursor: "pointer" }}
                    >
                      ← লগইনে ফিরে যান
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleForgotStep2} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  <div
                    style={{
                      padding: "11px 15px",
                      borderRadius: "12px",
                      background: "rgba(22, 163, 74, 0.08)",
                      border: "1px solid rgba(22, 163, 74, 0.25)",
                      color: "#166534",
                      fontSize: "13px",
                      lineHeight: "1.5",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>📨</span>
                    <span>
                      আপনার <strong>{forgotEmail}</strong> ইমেইলে প্রেরিত ৬-সংখ্যার রিসেট কোড এবং একটি নতুন শক্তিশালী পাসওয়ার্ড লিখুন।
                    </span>
                  </div>

                  {/* 1-Minute Code Validity Timer for Reset Code */}
                  {codeExpirySeconds > 0 ? (
                    <div
                      style={{
                        padding: "8px 14px",
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
                        <span>কোডের মেয়াদ বাকি: <strong>{formatTimerSeconds(codeExpirySeconds)}</strong></span>
                      </span>
                      <span style={{ fontSize: "11.5px", color: "var(--muted)" }}>মেয়াদ ১ মিনিট</span>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "8px 14px",
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
                      <span>রিসেট কোডের মেয়াদ (১ মিনিট) শেষ হয়েছে। অনুগ্রহ করে পুনরায় কোড পাঠান।</span>
                    </div>
                  )}

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                      ৬-সংখ্যার রিসেট কোড *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                      required
                      style={{
                        width: "100%",
                        padding: "11px",
                        borderRadius: "12px",
                        border: "1.5px solid var(--line, #e2e8f0)",
                        background: "var(--background, #ffffff)",
                        color: "var(--ink, #1c2420)",
                        fontSize: "18px",
                        letterSpacing: "4px",
                        textAlign: "center",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                      নতুন পাসওয়ার্ড *
                    </label>
                    <div style={{ position: "relative" }}>
                      <Lock
                        size={16}
                        style={{
                          position: "absolute",
                          left: "13px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--muted)",
                        }}
                      />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="কমপক্ষে ৮ অক্ষর (বড় ও ছোট হাতের, সংখ্যা, বিশেষ চিহ্ন)"
                        required
                        style={{
                          width: "100%",
                          padding: "11px 38px 11px 38px",
                          borderRadius: "12px",
                          border: "1.5px solid var(--line, #e2e8f0)",
                          background: "var(--background, #ffffff)",
                          color: "var(--ink, #1c2420)",
                          fontSize: "14px",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{
                          position: "absolute",
                          right: "11px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--muted)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Indicator */}
                  <PasswordStrengthIndicator password={newPassword} />

                  <button
                    type="submit"
                    style={{
                      padding: "13px 18px",
                      borderRadius: "14px",
                      background: "linear-gradient(135deg, var(--accent, #a04834) 0%, #b8543f 100%)",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "14.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    পাসওয়ার্ড পরিবর্তন ও সংরক্ষণ
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
