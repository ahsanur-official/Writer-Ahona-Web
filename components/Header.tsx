/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Theme, AUTHOR_INFO, useAuthorProfile } from "@/lib/store";
import { ambientAudio, SOUND_TRACKS, SoundTrackId } from "@/lib/sound";

interface HeaderProps {
  currentTheme?: Theme;
  onThemeChange?: (theme: Theme) => void;
}

export default function Header({ currentTheme, onThemeChange }: HeaderProps) {
  const author = useAuthorProfile();
  const [theme, setTheme] = useState<Theme>("paper");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [audioModalOpen, setAudioModalOpen] = useState(false);
  const [activeTrack, setActiveTrack] = useState<SoundTrackId | null>(null);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    const saved = localStorage.getItem("ahona-theme") as Theme | null;
    if (
      saved &&
      (saved === "paper" || saved === "midnight" || saved === "amber" || saved === "lavender")
    ) {
      const normalizedTheme = saved === "lavender" ? "amber" : saved;
      setTheme(normalizedTheme);
      document.documentElement.setAttribute("data-theme", normalizedTheme);
    }

    const audio = ambientAudio;
    if (audio) {
      setActiveTrack(audio.getCurrentTrack());
      setVolume(audio.getVolume());
      const unsub = audio.subscribe(() => {
        setActiveTrack(audio.getCurrentTrack());
        setVolume(audio.getVolume());
      });
      return unsub;
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

  const handleSelectTrack = (trackId: SoundTrackId) => {
    if (!ambientAudio) return;
    if (activeTrack === trackId) {
      ambientAudio.stop();
    } else {
      ambientAudio.playTrack(trackId);
    }
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    if (ambientAudio) {
      ambientAudio.setVolume(v);
    }
  };

  const activeTheme = currentTheme || theme;
  const currentPlayingTrackInfo = SOUND_TRACKS.find((t) => t.id === activeTrack);

  return (
    <>
      <div className="nav-placeholder" aria-hidden="true" />
      <header className="nav-shell">
        {/* Left: Author Name & Avatar Image */}
        <div className="nav-left">
          <Link href="/" className="author-brand">
            <img
              src={author.avatarUrl || AUTHOR_INFO.avatarUrl}
              alt={author.name || AUTHOR_INFO.name}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80";
              }}
              className="author-avatar-img"
            />
            <div className="author-brand-info">
              <span className="author-name">{author.name || AUTHOR_INFO.name}</span>
              <span className="author-subtitle">{author.tagline || AUTHOR_INFO.tagline}</span>
            </div>
          </Link>
        </div>

        {/* Center: Theme Color Picker */}
        <div className="nav-center">
          <div className="theme-picker" title="রঙের পরিবেশ পরিবর্তন করুন">
            <button
              type="button"
              className={`theme-dot paper ${activeTheme === "paper" ? "chosen" : ""}`}
              onClick={() => handleSetTheme("paper")}
              aria-label="কাগজ থিম (Paper)"
              title="কাগজ (দিনের আলো)"
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

        {/* Right: Ambient Sound Suite & Hamburger Menu */}
        <div className="nav-right">
          <button
            type="button"
            className={`ambient-pill ${activeTrack ? "active" : ""}`}
            onClick={() => setAudioModalOpen(true)}
            title="সাহিত্য পড়ার সুর ও প্রাকৃতিক পরিবেশ নির্বাচন করুন"
          >
            {activeTrack && (
              <span className="sound-bars">
                <span className="bar bar-1" />
                <span className="bar bar-2" />
                <span className="bar bar-3" />
              </span>
            )}
            <span className="ambient-label-desktop">
              {activeTrack && currentPlayingTrackInfo
                ? `${currentPlayingTrackInfo.icon} ${currentPlayingTrackInfo.name}`
                : "🎧 সুর ও আবহ"}
            </span>
            <span className="ambient-label-mobile">
              {activeTrack && currentPlayingTrackInfo
                ? `${currentPlayingTrackInfo.icon}`
                : "🎧 সুর"}
            </span>
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

      {/* Ambient Audio Suite Modal */}
      {audioModalOpen && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAudioModalOpen(false);
          }}
        >
          <div className="audio-palette-modal">
            <div className="audio-modal-header">
              <div>
                <span className="audio-modal-eyebrow">সাহিত্য পাঠের জন্য শান্ত পরিবেশ</span>
                <h3 className="audio-modal-title">প্রাকৃতিক সুর ও আবহ সঙ্গীত</h3>
              </div>
              <button
                type="button"
                className="audio-modal-close"
                onClick={() => setAudioModalOpen(false)}
                aria-label="বন্ধ করুন"
              >
                ✕
              </button>
            </div>

            <p className="audio-modal-desc">
              বই ও গল্প পড়ার সময় মনোযোগ ও মানসিক প্রশান্তির জন্য আপনার পছন্দমতো স্নিগ্ধ সুর বেছে নিন।
            </p>

            {/* Sound Tracks List */}
            <div className="audio-tracks-grid">
              {SOUND_TRACKS.map((track) => {
                const isSelected = activeTrack === track.id;
                return (
                  <button
                    key={track.id}
                    type="button"
                    className={`audio-track-card ${isSelected ? "playing" : ""}`}
                    onClick={() => handleSelectTrack(track.id)}
                  >
                    <div className="track-icon-wrapper">{track.icon}</div>
                    <div className="track-info">
                      <div className="track-name-row">
                        <span className="track-title">{track.name}</span>
                        {isSelected && <span className="playing-tag">বাজছে</span>}
                      </div>
                      <span className="track-tagline">{track.tagline}</span>
                    </div>
                    <div className="track-action-state">
                      {isSelected ? "⏸️" : "▶️"}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Master Volume Slider & Controls */}
            <div className="audio-master-controls">
              <div className="volume-label-row">
                <span style={{ fontSize: "13px", fontWeight: "600" }}>শব্দের মাত্রা (Volume)</span>
                <span style={{ font: "12px monospace", color: "var(--muted)" }}>
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="audio-volume-slider"
              />

              <div className="audio-modal-footer-row">
                {activeTrack && (
                  <button
                    type="button"
                    className="stop-all-audio-btn"
                    onClick={() => ambientAudio?.stop()}
                  >
                    সুর বন্ধ করুন
                  </button>
                )}
                <button
                  type="button"
                  className="close-audio-palette-btn"
                  onClick={() => setAudioModalOpen(false)}
                >
                  পড়াতে ফিরে যান
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              src={author.avatarUrl || AUTHOR_INFO.avatarUrl}
              alt={author.name || AUTHOR_INFO.name}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80";
              }}
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid var(--gold)",
              }}
            />
            <div>
              <div style={{ fontWeight: "700", fontSize: "17px" }}>{author.name || AUTHOR_INFO.name}</div>
              <div style={{ fontSize: "11px", color: "var(--muted)" }}>{author.englishName || AUTHOR_INFO.englishName}</div>
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
            <span className="icon">📖</span>
            <span>মূল পাতা (Home)</span>
          </Link>
          <Link
            href="/#novels"
            className="drawer-link"
            onClick={() => setDrawerOpen(false)}
          >
            <span className="icon">📚</span>
            <span>উপন্যাস ও ধারাবাহিক</span>
          </Link>
          <Link
            href="/#writings"
            className="drawer-link"
            onClick={() => setDrawerOpen(false)}
          >
            <span className="icon">✍️</span>
            <span>ছোটগল্প ও কবিতা</span>
          </Link>
          <Link
            href="/about"
            className="drawer-link"
            onClick={() => setDrawerOpen(false)}
          >
            <span className="icon">👤</span>
            <span>লেখিকার কথা ও জীবনী</span>
          </Link>
          <Link
            href="/journal"
            className="drawer-link"
            onClick={() => setDrawerOpen(false)}
          >
            <span className="icon">🖋️</span>
            <span>সাহিত্যিক দিনলিপি</span>
          </Link>
          <Link
            href="/contact"
            className="drawer-link"
            onClick={() => setDrawerOpen(false)}
          >
            <span className="icon">✉️</span>
            <span>চিঠিপত্র ও প্রতিক্রিয়া</span>
          </Link>
        </nav>

        {/* Ambient Audio Quick Bar inside Drawer */}
        <div style={{ padding: "16px 20px", background: "var(--surface)", borderRadius: "8px", margin: "10px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--ink)" }}>আবহ সঙ্গীত</span>
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                setAudioModalOpen(true);
              }}
              style={{ fontSize: "11px", color: "var(--accent)", background: "transparent", border: 0, cursor: "pointer" }}
            >
              সবগুলো দেখুন ↗
            </button>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {SOUND_TRACKS.slice(0, 3).map((tr) => (
              <button
                key={tr.id}
                type="button"
                onClick={() => handleSelectTrack(tr.id)}
                style={{
                  fontSize: "11px",
                  padding: "5px 10px",
                  borderRadius: "4px",
                  border: "1px solid var(--line)",
                  background: activeTrack === tr.id ? "var(--ink)" : "var(--card)",
                  color: activeTrack === tr.id ? "var(--paper)" : "var(--ink)",
                  cursor: "pointer",
                }}
              >
                {tr.icon} {tr.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="drawer-footer">
          <div style={{ fontSize: "11px", color: "var(--muted)", fontStyle: "italic" }}>
            © {new Date().getFullYear()} {author.name || AUTHOR_INFO.name} · সর্বস্বত্ব সংরক্ষিত
          </div>
        </div>
      </aside>
    </>
  );
}
