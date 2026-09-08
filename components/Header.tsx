/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Theme, AUTHOR_INFO, useAuthorProfile } from "@/lib/store";
import { ambientAudio, SOUND_TRACKS, SoundTrackId } from "@/lib/sound";
import { getCurrentUser, ReaderUser } from "@/lib/userAuth";

const UserAuthModal = dynamic(() => import("@/components/UserAuthModal"), { ssr: false });
const UserPanel = dynamic(() => import("@/components/UserPanel"), { ssr: false });

interface HeaderProps {
  currentTheme?: Theme;
  onThemeChange?: (theme: Theme) => void;
}

export default function Header({ currentTheme, onThemeChange }: HeaderProps) {
  const author = useAuthorProfile();
  const [theme, setTheme] = useState<Theme>("paper");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [audioModalOpen, setAudioModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [authInitialMode, setAuthInitialMode] = useState<"login" | "register" | "verify">("login");
  const authReasonRef = useRef<string | null>(null);
  const [userPanelOpen, setUserPanelOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<ReaderUser | null>(null);
  const [activeTrack, setActiveTrack] = useState<SoundTrackId | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentUser(getCurrentUser());

    const handleAuthChange = () => {
      const user = getCurrentUser();
      setCurrentUser(user);
    };

    const handleOpenPanel = () => {
      const user = getCurrentUser();
      if (user) {
        setUserPanelOpen(true);
      } else {
        authReasonRef.current = "panel";
        setAuthInitialMode("login");
        setAuthNotice("আপনার পাঠক প্যানেলে প্রবেশ করতে অনুগ্রহ করে লগইন করুন");
        setAuthModalOpen(true);
      }
    };

    const handleOpenAuth = (e?: any) => {
      const detail = e?.detail;
      authReasonRef.current = detail?.reason || null;
      if (detail?.mode) {
        setAuthInitialMode(detail.mode);
      } else {
        setAuthInitialMode("login");
      }
      if (detail?.notice) {
        setAuthNotice(detail.notice);
      } else if (detail?.title) {
        setAuthNotice(`"${detail.title}" সম্পূর্ণ পড়তে পাঠক একাউন্টে লগইন বা নিবন্ধন করুন`);
      } else if (detail?.reason === "read") {
        setAuthNotice("লেখাটি সম্পূর্ণ পড়তে অনুগ্রহ করে পাঠক একাউন্টে লগইন করুন");
      } else if (detail?.reason === "rating") {
        setAuthNotice("রেটিং ও মতামত প্রদান করতে অনুগ্রহ করে পাঠক একাউন্টে লগইন করুন");
      } else if (detail?.reason === "comment") {
        setAuthNotice("মন্তব্য করতে অনুগ্রহ করে পাঠক একাউন্টে লগইন করুন");
      } else {
        setAuthNotice(null);
      }
      setAuthModalOpen(true);
    };

    window.addEventListener("ahona-auth-changed", handleAuthChange);
    window.addEventListener("ahona-open-user-panel", handleOpenPanel);
    window.addEventListener("ahona-open-auth-modal", handleOpenAuth);

    return () => {
      window.removeEventListener("ahona-auth-changed", handleAuthChange);
      window.removeEventListener("ahona-open-user-panel", handleOpenPanel);
      window.removeEventListener("ahona-open-auth-modal", handleOpenAuth);
    };
  }, []);

  // Lock background scroll when audio modal is open
  useEffect(() => {
    if (audioModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [audioModalOpen]);

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
          <Link href="/" prefetch={true} className="author-brand">
            <img
              src={(!author.avatarUrl || author.avatarUrl.includes("unsplash.com")) ? "/ahona.png" : author.avatarUrl}
              alt={author.name || AUTHOR_INFO.name}
              width={44}
              height={44}
              loading="eager"
              decoding="async"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/ahona.png";
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

          {/* Reader User Profile / User Panel / Login Button */}
          <button
            type="button"
            className="user-profile-btn"
            onClick={() => {
              if (currentUser) {
                setUserPanelOpen(true);
              } else {
                setAuthModalOpen(true);
              }
            }}
            title={currentUser ? `পাঠক প্যানেল: ${currentUser.name}` : "পাঠক একাউন্ট / লগইন"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "20px",
              border: "1px solid var(--line, #e2e8f0)",
              background: currentUser ? "var(--surface, rgba(202, 168, 105, 0.12))" : "var(--card, #ffffff)",
              color: "var(--ink)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {currentUser ? (
              <>
                <span style={{ position: "relative", display: "inline-flex" }}>
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "1px solid var(--gold)",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        background: currentUser.avatarColor,
                        color: "#fff",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      {currentUser.name.charAt(0)}
                    </span>
                  )}
                  {currentUser.emailVerified && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: "-2px",
                        right: "-2px",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#16a34a",
                        border: "1px solid #ffffff",
                      }}
                    />
                  )}
                </span>
                <span className="ambient-label-desktop" style={{ maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {currentUser.name.split(" ")[0]}
                </span>
              </>
            ) : (
              <>
                <span>👤</span>
                <span className="ambient-label-desktop">লগইন</span>
              </>
            )}
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
      {mounted && audioModalOpen && createPortal(
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
        </div>,
        document.body
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
              src={(!author.avatarUrl || author.avatarUrl.includes("unsplash.com")) ? "/ahona.png" : author.avatarUrl}
              alt={author.name || AUTHOR_INFO.name}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/ahona.png";
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
            prefetch={true}
            className="drawer-link"
            onClick={() => setDrawerOpen(false)}
          >
            <span className="icon">📖</span>
            <span>মূল পাতা (Home)</span>
          </Link>
          <Link
            href="/#novels"
            prefetch={true}
            className="drawer-link"
            onClick={() => setDrawerOpen(false)}
          >
            <span className="icon">📚</span>
            <span>উপন্যাস ও ধারাবাহিক</span>
          </Link>
          <Link
            href="/#writings"
            prefetch={true}
            className="drawer-link"
            onClick={() => setDrawerOpen(false)}
          >
            <span className="icon">✍️</span>
            <span>ছোটগল্প ও কবিতা</span>
          </Link>
          <Link
            href="/about"
            prefetch={true}
            className="drawer-link"
            onClick={() => setDrawerOpen(false)}
          >
            <span className="icon">👤</span>
            <span>লেখিকার কথা ও জীবনী</span>
          </Link>
          <Link
            href="/journal"
            prefetch={true}
            className="drawer-link"
            onClick={() => setDrawerOpen(false)}
          >
            <span className="icon">🖋️</span>
            <span>সাহিত্যিক দিনলিপি</span>
          </Link>
          <Link
            href="/contact"
            prefetch={true}
            className="drawer-link"
            onClick={() => setDrawerOpen(false)}
          >
            <span className="icon">✉️</span>
            <span>চিঠিপত্র ও প্রতিক্রিয়া</span>
          </Link>
          <button
            type="button"
            className="drawer-link"
            onClick={() => {
              setDrawerOpen(false);
              if (currentUser) {
                setUserPanelOpen(true);
              } else {
                setAuthModalOpen(true);
              }
            }}
            style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
          >
            <span className="icon">{currentUser ? "👤" : "🔑"}</span>
            <span>{currentUser ? `পাঠক প্যানেল (${currentUser.name})` : "পাঠক লগইন / নিবন্ধন"}</span>
          </button>
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

      {/* Reader User Auth & Login/Register Modal */}
      <UserAuthModal
        isOpen={authModalOpen}
        notice={authNotice}
        initialMode={authInitialMode}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthNotice(null);
        }}
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          if (
            authReasonRef.current !== "read" &&
            authReasonRef.current !== "rating" &&
            authReasonRef.current !== "comment"
          ) {
            setUserPanelOpen(true);
          }
          setAuthNotice(null);
        }}
      />

      {/* Reader User Panel Modal */}
      <UserPanel
        isOpen={userPanelOpen}
        onClose={() => setUserPanelOpen(false)}
        onOpenReader={(item) => {
          window.dispatchEvent(new CustomEvent("ahona-open-reader", { detail: item }));
        }}
      />
    </>
  );
}
