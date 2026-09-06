"use client";

import { useEffect, useState, FormEvent, useMemo } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import {
  getNovels,
  addEpisodeToNovel,
  Novel,
  MAX_WORDS_LIMIT,
  countWordsWithoutSpace,
  formatBengaliNumber,
} from "@/lib/store";
import SpellingHighlightedEditor from "@/components/SpellingHighlightedEditor";
import { checkSpelling } from "@/lib/spelling";

export default function NewEpisode() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [saved, setSaved] = useState(false);
  const [createdEpisode, setCreatedEpisode] = useState<{
    episodeNumber: number;
    title: string;
    status: string;
    readTime: string;
  } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [wordError, setWordError] = useState<string | null>(null);

  // Form states
  const [epNumber, setEpNumber] = useState(1);
  const [title, setTitle] = useState("");
  const [teaser, setTeaser] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"প্রকাশিত" | "খসড়া">("প্রকাশিত");

  useEffect(() => {
    if (localStorage.getItem("ahona-admin") !== "true") {
      router.replace("/admin/login");
    } else {
      const all = getNovels();
      const found = all.find((n) => n.id === params.id);
      if (found) {
        setNovel(found);
        setEpNumber((found.episodes?.length || 0) + 1);
      }
    }
  }, [router, params.id]);

  const wordCount = countWordsWithoutSpace(content);
  const isOverLimit = wordCount > MAX_WORDS_LIMIT;

  const spellResult = useMemo(() => {
    return checkSpelling(content);
  }, [content]);

  const calculateReadTime = (text: string): string => {
    const words = countWordsWithoutSpace(text);
    const minutes = Math.max(1, Math.ceil(words / 130));
    const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    const bMinutes = String(minutes).replace(/\d/g, (d) => bengaliDigits[Number(d)]);
    return `${bMinutes} মিনিট`;
  };

  const handlePublish = (e: FormEvent, forcedStatus?: "প্রকাশিত" | "খসড়া") => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !novel) return;

    if (isOverLimit) {
      setWordError(
        `সর্বোচ্চ ৬,০০০ শব্দের সীমা অতিক্রম করেছে! বর্তমান শব্দ সংখ্যা: ${wordCount}৤ অনুগ্রহ করে পর্বটি ৬,০০০ শব্দের মধ্যে রাখুন৤`
      );
      return;
    }
    setWordError(null);

    const actualStatus = forcedStatus || status;
    const finalTeaser =
      teaser.trim() ||
      (content.trim().slice(0, 100) + (content.trim().length > 100 ? "..." : ""));

    const readTimeCalc = calculateReadTime(content);
    addEpisodeToNovel(novel.id, {
      episodeNumber: epNumber,
      title: title.trim(),
      teaser: finalTeaser,
      content: content.trim(),
      readTime: readTimeCalc,
      status: actualStatus,
    });

    setCreatedEpisode({
      episodeNumber: epNumber,
      title: title.trim(),
      status: actualStatus,
      readTime: readTimeCalc,
    });
    setShowSuccessModal(true);
    setSaved(true);

    // Reset and clear form
    setTitle("");
    setTeaser("");
    setContent("");
    setEpNumber((prev) => prev + 1);
  };

  return (
    <main className="editor-page">
      <header className="post-top">
        <a href={`/admin/novels/${params.id}/episodes`} className="admin-back">
          ← পর্ব তালিকায় ফিরে যান
        </a>
        <a href="/admin/dashboard" className="admin-back">
          ড্যাশবোর্ড ↗
        </a>
      </header>

      <div className="admin-top">
        <div>
          <p className="eyebrow">{novel?.title || "উপন্যাস"} · NEW EPISODE</p>
          <h1>
            নতুন <em>পর্ব প্রকাশ</em>
          </h1>
        </div>
        <div className="admin-top-actions">
          <button
            type="button"
            className="admin-button secondary"
            onClick={(e) => handlePublish(e, "খসড়া")}
          >
            খসড়া হিসেবে রাখুন
          </button>
          <button
            type="button"
            className="admin-button"
            onClick={(e) => handlePublish(e, "প্রকাশিত")}
          >
            পর্ব সরাসরি প্রকাশ করুন →
          </button>
        </div>
      </div>

      {/* Episode Success Modal */}
      {showSuccessModal && createdEpisode && typeof document !== "undefined" && createPortal(
        <div
          className="admin-modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999999,
            padding: "20px",
          }}
          onClick={() => {
            setShowSuccessModal(false);
            setCreatedEpisode(null);
          }}
        >
          <div
            className="admin-modal-card"
            style={{
              background: "var(--card-bg, #ffffff)",
              color: "var(--foreground, #1a1a1a)",
              maxWidth: "520px",
              width: "100%",
              borderRadius: "16px",
              padding: "32px 28px",
              boxShadow: "0 20px 45px rgba(0, 0, 0, 0.3)",
              border: "1px solid var(--border-color, rgba(0, 0, 0, 0.12))",
              position: "relative",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                setCreatedEpisode(null);
              }}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "transparent",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "var(--muted-text, #666)",
                lineHeight: 1,
              }}
              aria-label="বন্ধ করুন"
            >
              ×
            </button>

            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.12)",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: "30px",
              }}
            >
              ✓
            </div>

            <p
              style={{
                fontSize: "12px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#10b981",
                fontWeight: 600,
                marginBottom: "6px",
              }}
            >
              EPISODE PUBLISHED
            </p>

            <h3
              style={{
                fontSize: "22px",
                fontWeight: 600,
                margin: "0 0 10px",
                fontFamily: "var(--font-serif, serif)",
              }}
            >
              পর্বটি সফলভাবে যোগ হয়েছে!
            </h3>

            <p style={{ fontSize: "14px", color: "var(--muted-text, #555)", marginBottom: "20px", lineHeight: "1.5" }}>
              উপন্যাসে পর্বটি সংরক্ষিত হয়েছে এবং পরবর্তী পর্বের জন্য ফর্ম খালি করে দেওয়া হয়েছে৤
            </p>

            <div
              style={{
                background: "var(--bg-secondary, rgba(0, 0, 0, 0.03))",
                borderRadius: "12px",
                padding: "16px",
                border: "1px solid var(--border-color, rgba(0, 0, 0, 0.08))",
                textAlign: "left",
                marginBottom: "24px",
              }}
            >
              <div style={{ fontSize: "11px", color: "var(--muted-text, #777)", marginBottom: "4px" }}>
                উপন্যাস: {novel?.title}
              </div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "var(--foreground, #111)",
                }}
              >
                পর্ব {formatBengaliNumber(createdEpisode.episodeNumber)}: &apos;{createdEpisode.title}&apos;
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "12px" }}>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: "20px",
                    background: "rgba(16, 185, 129, 0.12)",
                    color: "#059669",
                    fontWeight: 500,
                  }}
                >
                  অবস্থা: {createdEpisode.status}
                </span>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: "20px",
                    background: "rgba(0, 0, 0, 0.06)",
                  }}
                >
                  পাঠের সময়: {createdEpisode.readTime}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                className="admin-button"
                style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "15px" }}
                onClick={() => {
                  setShowSuccessModal(false);
                  setCreatedEpisode(null);
                }}
              >
                + পরবর্তী পর্ব লিখুন
              </button>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button
                  type="button"
                  className="admin-button secondary"
                  style={{ width: "100%", justifyContent: "center", padding: "10px", fontSize: "13px" }}
                  onClick={() => router.push(`/admin/novels/${params.id}/episodes`)}
                >
                  পর্ব তালিকায় যান
                </button>
                <a
                  href="/#novels"
                  target="_blank"
                  rel="noreferrer"
                  className="admin-button secondary"
                  style={{ width: "100%", justifyContent: "center", padding: "10px", fontSize: "13px", textDecoration: "none" }}
                >
                  ওয়েবসাইটে পড়ুন ↗
                </a>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {saved && !showSuccessModal && (
        <div className="admin-alert-banner success" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            পর্ব সফলভাবে যোগ হয়েছে! পরবর্তী পর্বের জন্য ফর্ম প্রস্তুত৤
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <a href="/#novels" target="_blank" className="admin-button" style={{ padding: "5px 12px", fontSize: "12px", minHeight: "32px", textDecoration: "none" }}>
              ওয়েবসাইটে পড়ুন ↗
            </a>
            <a href={`/admin/novels/${params.id}/episodes`} className="admin-button secondary" style={{ padding: "5px 12px", fontSize: "12px", minHeight: "32px", textDecoration: "none" }}>
              পর্ব তালিকায় যান
            </a>
          </div>
        </div>
      )}

      <form className="editor-form" onSubmit={(e) => handlePublish(e)}>
        <div className="form-grid">
          <label>
            পর্ব নম্বর (Episode Number)
            <input
              type="number"
              min="1"
              value={epNumber}
              onChange={(e) => setEpNumber(Number(e.target.value))}
              required
            />
          </label>

          <label>
            পর্বের নাম (Episode Title)
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: অচেনা বাঁকের সন্ধান"
            />
          </label>
        </div>

        <label>
          সংক্ষিপ্ত ভূমিকা বা টিজার (Teaser)
          <textarea
            rows={2}
            value={teaser}
            onChange={(e) => setTeaser(e.target.value)}
            placeholder="এই পর্ব সম্পর্কে পাঠকদের জন্য এক বা দুই লাইনের চমকপ্রদ অংশ..."
          />
        </label>

        <label>
          সম্পূর্ণ পর্বের লেখা (সর্বোচ্চ ৬,০০০ শব্দ)
          <div style={{ marginTop: "6px" }}>
            <SpellingHighlightedEditor
              value={content}
              onChange={(newText) => {
                setContent(newText);
                if (wordError) setWordError(null);
              }}
              placeholder="এখানে পর্বের কাহিনী বিস্তারিতভাবে লিখুন... (ভুল বানানের নিচে স্বয়ংক্রিয়ভাবে লাল দাগ প্রদর্শিত হবে)"
              rows={14}
              minHeight="340px"
              required
            />
          </div>

          {/* Word count & Limit Meter */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", fontSize: "12px", color: "var(--adm-muted)", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div>
                <span>শব্দ সংখ্যা: </span>
                <strong style={{ color: isOverLimit ? "var(--adm-danger)" : "var(--adm-ink)", fontSize: "14px" }}>
                  {formatBengaliNumber(wordCount)}
                </strong> / ৬,০০০ শব্দ
                {isOverLimit && <span style={{ marginLeft: "8px", color: "var(--adm-danger)", fontWeight: "700" }}>⚠️ সীমা অতিক্রম করেছে!</span>}
              </div>

              {spellResult.totalMistakes > 0 ? (
                <span
                  style={{
                    background: "#fee2e2",
                    color: "#b91c1c",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    fontWeight: 600,
                    fontSize: "12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>⚠️</span>
                  <span>{formatBengaliNumber(spellResult.totalMistakes)}টি ভুল বানানে লাল দাগ রয়েছে</span>
                </span>
              ) : content.trim().length > 0 ? (
                <span
                  style={{
                    background: "#dcfce7",
                    color: "#15803d",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    fontWeight: 600,
                    fontSize: "12px",
                  }}
                >
                  ✓ কোনো ভুল বানান নেই
                </span>
              ) : null}
            </div>
            <div>
              <span>পড়ার সময়: {calculateReadTime(content)}</span>
            </div>
          </div>

          <div className="word-count-bar-wrap">
            <div
              className={`word-count-bar-fill ${
                wordCount > 5500 ? (isOverLimit ? "danger" : "warning") : ""
              }`}
              style={{ width: `${Math.min(100, (wordCount / MAX_WORDS_LIMIT) * 100)}%` }}
            />
          </div>

          {wordError && (
            <div className="admin-alert-banner danger" style={{ marginTop: "12px", marginBottom: "4px" }}>
              <span>⚠️</span>
              <span>{wordError}</span>
            </div>
          )}
        </label>

        <div className="episode-note">
          ✓ তথ্য: উপন্যাসের প্রতিটি পর্বের জন্য আলাদা cover ছবি লাগবে না—উপন্যাসের মূল কাভার আর্ট স্বয়ংক্রিয়ভাবে পুরো সিরিজের জন্য ব্যবহৃত হয়৤
        </div>

        <label>
          স্ট্যাটাস
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "প্রকাশিত" | "খসড়া")}
          >
            <option value="প্রকাশিত">প্রকাশিত (Live on website)</option>
            <option value="খসড়া">খসড়া (Draft)</option>
          </select>
        </label>

        <div className="editor-actions">
          <button className="admin-button" type="submit">
            পর্ব প্রকাশ করুন
          </button>
          <a
            href={`/admin/novels/${params.id}/episodes`}
            className="admin-button secondary"
          >
            বাতিল
          </a>
        </div>
      </form>
    </main>
  );
}
