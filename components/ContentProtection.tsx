"use client";

import React, { useEffect, useState, useCallback } from "react";

export default function ContentProtection() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showProtectionToast = useCallback((message: string) => {
    setToastMessage(message);
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Listen for general custom toast requests across the app
    const handleCustomToast = (e: any) => {
      if (e.detail?.message) {
        showProtectionToast(e.detail.message);
      }
    };
    window.addEventListener("ahona-show-toast", handleCustomToast);

    // Function to check if the active element or event target is an allowed input or admin area
    const isInteractiveInput = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;
      
      // Allow author operations inside admin panel
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
        return true;
      }

      // Check tag name
      const tagName = target.tagName.toLowerCase();
      if (tagName === "input" || tagName === "textarea" || target.isContentEditable) {
        return true;
      }

      // Check if inside input/textarea or elements with data-allow-copy
      if (target.closest("input, textarea, [contenteditable='true'], [data-allow-copy='true']")) {
        return true;
      }

      return false;
    };

    // 1. Intercept Context Menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      if (isInteractiveInput(e.target)) return;

      e.preventDefault();
      showProtectionToast("🔒 অহনা ইসলামের সাহিত্যকর্ম কপিরাইট সুরক্ষিত। লেখা কপি বা রাইট-ক্লিক করা নিষেধ।");
    };

    // 2. Intercept Clipboard Copy
    const handleCopy = (e: ClipboardEvent) => {
      if (isInteractiveInput(e.target)) return;

      e.preventDefault();
      // Clear clipboard data
      if (e.clipboardData) {
        e.clipboardData.clearData();
        e.clipboardData.setData(
          "text/plain",
          "অহনা ইসলামের সাহিত্য ও উপন্যাস কপিরাইট আইন দ্বারা সংরক্ষিত। অনুমতি ব্যতিরেকে কোনো অংশ কপি বা পুনঃপ্রকাশ নিষেধ।"
        );
      }
      showProtectionToast("🔒 কপি করা নিষেধ! অহনা ইসলামের সকল লেখা কপিরাইট দ্বারা সংরক্ষিত।");
    };

    // 3. Intercept Cut
    const handleCut = (e: ClipboardEvent) => {
      if (isInteractiveInput(e.target)) return;
      e.preventDefault();
    };

    // 4. Intercept Keyboard Shortcuts (Ctrl/Cmd + C, P, S, U, etc.)
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = isInteractiveInput(e.target);

      // Check for modifier keys
      const modifier = e.ctrlKey || e.metaKey;

      if (modifier) {
        const key = e.key.toLowerCase();

        // Block Ctrl/Cmd + C (Copy) when not inside text input
        if (key === "c" && !isInput) {
          e.preventDefault();
          showProtectionToast("🔒 কীবোর্ড শর্টকাট দিয়ে লেখা কপি করা নিষিদ্ধ।");
          return;
        }

        // Block Ctrl/Cmd + P (Print / Save to PDF)
        if (key === "p") {
          e.preventDefault();
          showProtectionToast("🔒 লেখা প্রিন্ট বা পিডিএফ হিসেবে সেভ করা কপিরাইট আইনে নিষিদ্ধ।");
          return;
        }

        // Block Ctrl/Cmd + S (Save webpage)
        if (key === "s") {
          e.preventDefault();
          showProtectionToast("🔒 ওয়েবসাইট ও সাহিত্যকর্ম সেভ করা নিষ্ক্রিয় করা আছে।");
          return;
        }

        // Block Ctrl/Cmd + U (View Page Source)
        if (key === "u" && !isInput) {
          e.preventDefault();
          showProtectionToast("🔒 পৃষ্ঠা সোর্স দর্শন সংরক্ষিত।");
          return;
        }
      }
    };

    // 5. Intercept Text Dragging
    const handleDragStart = (e: DragEvent) => {
      if (isInteractiveInput(e.target)) return;
      e.preventDefault();
    };

    // Attach listeners
    document.addEventListener("contextmenu", handleContextMenu, { capture: true });
    document.addEventListener("copy", handleCopy, { capture: true });
    document.addEventListener("cut", handleCut, { capture: true });
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    document.addEventListener("dragstart", handleDragStart, { capture: true });

    return () => {
      window.removeEventListener("ahona-show-toast", handleCustomToast);
      document.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      document.removeEventListener("copy", handleCopy, { capture: true });
      document.removeEventListener("cut", handleCut, { capture: true });
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      document.removeEventListener("dragstart", handleDragStart, { capture: true });
    };
  }, [showProtectionToast]);

  if (!toastMessage) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: "fixed",
        bottom: "32px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 999999,
        background: "rgba(30, 20, 18, 0.94)",
        color: "#fff",
        padding: "12px 24px",
        borderRadius: "99px",
        fontSize: "13.5px",
        fontWeight: 600,
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(202, 168, 105, 0.4)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        maxWidth: "92vw",
        textAlign: "center",
        pointerEvents: "none",
        animation: "ahonaFadeUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
    >
      <span style={{ fontSize: "16px" }}>🛡️</span>
      <span>{toastMessage}</span>
    </div>
  );
}
