/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Theme, AUTHOR_INFO } from "@/lib/store";
import { ambientAudio } from "@/lib/sound";

interface HeaderProps {
  currentTheme?: Theme;
  onThemeChange?: (theme: Theme) => void;
}

export default function Header({ currentTheme, onThemeChange }: HeaderProps) {
  const [theme, setTheme] = useState<Theme>("paper");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [soundMode, setSoundMode] = useState<"off" | "rain">("off");

  useEffect(() => {
    const saved = localStorage.getItem("ahona-theme") as Theme | null;
    if (saved && (saved === "paper" || saved === "midnight" || saved === "amber" || saved === "lavender")) {
      const normalizedTheme = saved === "lavender" ? "amber" : saved;
      setTheme(normalizedTheme);
      document.documentElement.setAttribute("data-theme", normalizedTheme);
    }
  }, []);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("ahona-theme", newTheme);
    if (onThemeChange) {
      onThemeChange(newTheme);
    }
  };

  const toggleSound = () => {
    if (!ambientAudio) return;
    if (soundMode === "off") {
      ambientAudio.playRain();
      setSoundMode("rain");
    } else {
      ambientAudio.stop();
      setSoundMode("off");
    }
  };

  const activeTheme = currentTheme || theme;

  return (
    <>
      <header className="nav-shell">
        {/* Left: Author Name & Avatar Image */}
        <div className="nav-left">
          <Link href="/" className="author-brand">
            <img
              src={AUTHOR_INFO.avatarUrl}
              alt={AUTHOR_INFO.name}
              className="author-avatar-img"
            />
            <div className="author-brand-info">
              <span className="author-name">{AUTHOR_INFO.name}</span>
              <span className="author-subtitle">{AUTHOR_INFO.tagline}</span>
            </div>
          </Link>
        </div>

        {/* Center: Theme Color Picker */}
        <div className="nav-center">
          <div className="theme-picker" title="রঙের পরিবেশ পরিবর্তন করুন">
            <span className="theme-picker-label">আভা:</span>
            <button
              type="button"
              className={`theme-dot paper ${activeTheme === "paper" ? "chosen" : ""}`}
              onClick={() => handleSetTheme("paper")}
              aria-label="আলোক থিম (Paper)"
              title="আলোক (উষ্ণ কাগজ)"
            />
            <button
              type="button"
              className={`theme-dot midnight ${activeTheme === "midnight" ? "chosen" : ""}`}
              onClick={() => handleSetTheme("midnight")}
              aria-label="নিশীথ থিম (Midnight)"
              title="নিশীথ (গভীর রাত)"
            />
            <button
              type="button"
              className={`theme-dot amber ${activeTheme === "amber" || activeTheme === "lavender" ? "chosen" : ""}`}
              onClick={() => handleSetTheme("amber")}
              aria-label="গোধূলি থিম (Amber)"
              title="গোধূলি (সায়াহ্ন আভা)"
            />
          </div>
        </div>

        {/* Right: Ambient Sound & Hamburger Menu */}
        <div className="nav-right">
          <button
            type="button"
            className={`ambient-pill ${soundMode === "rain" ? "active" : ""}`}
            onClick={toggleSound}
            title={soundMode === "rain" ? "বৃষ্টির সুর বন্ধ করুন" : "বৃষ্টির স্নিগ্ধ সুর চালান"}
          >
            {soundMode === "rain" && <span className="pulse" />}
            <span>{soundMode === "rain" ? "বৃষ্টি বাজছে" : "বৃষ্টির সুর 🌧️"}</span>
          </button>

          <button
            type="button"
            className="hamburger-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="মেনু খুলুন"
            title="মেনু"
          >
            ☰
          </button>
        </div>
      </header>

      {/* Backdrop for Drawer */}
      <div
        className={`drawer-backdrop ${drawerOpen ? "open" : ""}`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Slide-out Hamburger Drawer for Both Desktop & Mobile */}
      <aside className={`drawer-panel ${drawerOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img
              src={AUTHOR_INFO.avatarUrl}
              alt={AUTHOR_INFO.name}
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid var(--gold)",
              }}
            />
            <div>
              <div style={{ fontWeight: "700", fontSize: "17px" }}>{AUTHOR_INFO.name}</div>
              <div style={{ fontSize: "11px", color: "var(--muted)" }}>{AUTHOR_INFO.englishName}</div>
            </div>
          </div>
          <button
            type="button"
            className="drawer-close"
            onClick={() => setDrawerOpen(false)}
            aria-label="মেনু বন্ধ করুন"
          >
            ✕
          </button>
        </div>

        <nav className="drawer-links">
          <Link
            href="/"
            className="drawer-link"
            onClick={() => setDrawerOpen(false)}
          >
            <span className="icon">🏠</span>
            <span>মূল পাতা</span>
          </Link>

          <Link
            href="/#novels"
            className="drawer-link"
            onClick={() => setDrawerOpen(false)}
          >
            <span className="icon">📖</span>
            <span>উপন্যাস ও ধারাবাহিক</span>
          </Link>

          <Link
            href="/#writings"
            className="drawer-link"
            onClick={() => setDrawerOpen(false)}
          >
            <span className="icon">✍️</span>
            <span>সাহিত্য সম্ভার</span>
          </Link>

          <Link
            href="/about"
            className="drawer-link"
            onClick={() => setDrawerOpen(false)}
          >
            <span className="icon">👤</span>
            <span>লেখিকার কথা ও পরিচিতি</span>
          </Link>

          <Link
            href="/journal"
            className="drawer-link"
            onClick={() => setDrawerOpen(false)}
          >
            <span className="icon">📓</span>
            <span>সাহিত্যিক দিনলিপি</span>
          </Link>

          <Link
            href="/contact"
            className="drawer-link"
            onClick={() => setDrawerOpen(false)}
          >
            <span className="icon">💌</span>
            <span>চিঠিপত্র ও যোগাযোগ</span>
          </Link>
        </nav>

        <div className="drawer-footer">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>আবহ সুর:</span>
            <button
              type="button"
              className={`ambient-pill ${soundMode === "rain" ? "active" : ""}`}
              onClick={toggleSound}
            >
              {soundMode === "rain" ? "বন্ধ করুন" : "চালান"}
            </button>
          </div>

          <p className="drawer-quote">
            &ldquo;শব্দের কোনো দেশ নেই, ঠিক যেমন অনুভূতির কোনো ভাষা নেই।&rdquo; — অহনা
          </p>
        </div>
      </aside>
    </>
  );
}
