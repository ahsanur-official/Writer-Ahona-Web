/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, FormEvent, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { addPost, PostType, MAX_WORDS_LIMIT, countWordsWithoutSpace, formatBengaliNumber } from "@/lib/store";
import ImagePicker from "@/components/ImagePicker";
import SpellingHighlightedEditor from "@/components/SpellingHighlightedEditor";
import { checkSpelling } from "@/lib/spelling";

export default function NewPost() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [createdPost, setCreatedPost] = useState<{
    id: string;
    title: string;
    type: PostType;
    status: string;
    readTime: string;
  } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Form states
  const [type, setType] = useState<PostType>("গল্প");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [tone, setTone] = useState<"rose" | "sage" | "gold" | "lavender">("rose");
  const [status, setStatus] = useState<"প্রকাশিত" | "খসড়া">("প্রকাশিত");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [wordError, setWordError] = useState<string | null>(null);

  const spellResult = useMemo(() => {
    return checkSpelling(body);
  }, [body]);

  useEffect(() => {
    if (localStorage.getItem("ahona-admin") !== "true") {
      router.replace("/admin/login");
    }
    const savedDraft = typeof window !== "undefined" ? sessionStorage.getItem("ahona_draft_text") : null;
    if (savedDraft) {
      setBody(savedDraft);
      sessionStorage.removeItem("ahona_draft_text");
    }
  }, [router]);

  const wordCount = countWordsWithoutSpace(body);
  const isOverLimit = wordCount > MAX_WORDS_LIMIT;

  const calculateReadTime = (text: string): string => {
    const words = countWordsWithoutSpace(text);
    const minutes = Math.max(1, Math.ceil(words / 130));
    const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    const bMinutes = String(minutes).replace(/\d/g, (d) => bengaliDigits[Number(d)]);
    return `${bMinutes} মিনিট`;
  };

  const handlePublish = (e: FormEvent, forcedStatus?: "প্রকাশিত" | "খসড়া") => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    if (isOverLimit) {
      setWordError(
        `সর্বোচ্চ ৬,০০০ শব্দের সীমা অতিক্রম করেছে! বর্তমান শব্দ সংখ্যা: ${wordCount}৤ অনুগ্রহ করে লেখাটি ৬,০০০ শব্দের মধ্যে রাখুন৤`
      );
      return;
    }
    setWordError(null);

    const actualStatus = forcedStatus || status;
    const finalExcerpt =
      excerpt.trim() ||
      (body.trim().slice(0, 100) + (body.trim().length > 100 ? "..." : ""));

    const newPost = addPost({
      title: title.trim(),
      type,
      excerpt: finalExcerpt,
      body: body.trim(),
      tone,
      readTime: calculateReadTime(body),
      status: actualStatus,
      coverUrl: imagePreview || undefined,
    });

    // Set post details for success modal
    setCreatedPost({
      id: newPost.id,
      title: newPost.title,
      type: newPost.type,
      status: actualStatus,
      readTime: newPost.readTime,
    });
    setShowSuccessModal(true);
    setSaved(true);

    // Form fields cleared completely (resolves "post korar por o lekha show kore")
    setTitle("");
    setExcerpt("");
    setBody("");
    setImagePreview(null);
    setWordError(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("ahona_draft_text");
    }
  };

  return (
    <main className="editor-page">
      <header className="post-top">
        <a href="/admin/posts" className="admin-back">
          ← সব লেখা
        </a>
        <a href="/admin/dashboard" className="admin-back">
          ড্যাশবোর্ড ↗
        </a>
      </header>

      <div className="admin-top">
        <div>
          <p className="eyebrow">NEW LITERARY PUBLICATION</p>
          <h1>
            নতুন <em>লেখা প্রকাশ</em>
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
            সরাসরি প্রকাশ করুন →
          </button>
        </div>
      </div>

      {/* Success Modal Popup */}
      {showSuccessModal && createdPost && typeof document !== "undefined" && createPortal(
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
            setCreatedPost(null);
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
                setCreatedPost(null);
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
              PUBLICATION SUCCESSFUL
            </p>

            <h3
              style={{
                fontSize: "22px",
                fontWeight: 600,
                margin: "0 0 10px",
                fontFamily: "var(--font-serif, serif)",
              }}
            >
              লেখাটি সফলভাবে {createdPost.status === "প্রকাশিত" ? "প্রকাশিত" : "সংরক্ষিত"} হয়েছে!
            </h3>

            <p style={{ fontSize: "14px", color: "var(--muted-text, #555)", marginBottom: "20px", lineHeight: "1.5" }}>
              আপনার ফর্মটি স্বয়ংক্রিয়ভাবে খালি ও রিফ্রেশ করা হয়েছে৤ আপনি এখন সরাসরি পরবর্তী সাহিত্যকর্ম লিখতে পারেন৤
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
                শিরোনাম:
              </div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  marginBottom: "10px",
                  color: "var(--foreground, #111)",
                }}
              >
                &apos;{createdPost.title}&apos;
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "12px" }}>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: "20px",
                    background: "rgba(0, 0, 0, 0.06)",
                    fontWeight: 500,
                  }}
                >
                  বিভাগ: {createdPost.type}
                </span>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: "20px",
                    background: "rgba(16, 185, 129, 0.12)",
                    color: "#059669",
                    fontWeight: 500,
                  }}
                >
                  অবস্থা: {createdPost.status}
                </span>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: "20px",
                    background: "rgba(0, 0, 0, 0.06)",
                  }}
                >
                  পাঠের সময়: {createdPost.readTime}
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
                  setCreatedPost(null);
                }}
              >
                + নতুন লেখা লিখুন (ফর্ম প্রস্তুত)
              </button>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button
                  type="button"
                  className="admin-button secondary"
                  style={{ width: "100%", justifyContent: "center", padding: "10px", fontSize: "13px" }}
                  onClick={() => router.push("/admin/posts")}
                >
                  সব লেখা দেখুন
                </button>
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="admin-button secondary"
                  style={{ width: "100%", justifyContent: "center", padding: "10px", fontSize: "13px", textDecoration: "none" }}
                >
                  ওয়েবসাইটে দেখুন ↗
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
            লেখা সফলভাবে সংরক্ষিত হয়েছে! নতুন লেখার জন্য ফর্ম প্রস্তুত রয়েছে৤
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <a href="/" target="_blank" className="admin-button" style={{ padding: "5px 12px", fontSize: "12px", minHeight: "32px", textDecoration: "none" }}>
              ওয়েবসাইটে দেখুন ↗
            </a>
            <a href="/admin/posts" className="admin-button secondary" style={{ padding: "5px 12px", fontSize: "12px", minHeight: "32px", textDecoration: "none" }}>
              সব লেখায় যান
            </a>
          </div>
        </div>
      )}

      <form className="editor-form" onSubmit={(e) => handlePublish(e)}>
        <div className="form-grid">
          <label>
            লেখার ধারা
            <select value={type} onChange={(e) => setType(e.target.value as PostType)}>
              <option value="গল্প">গল্প</option>
              <option value="কবিতা">কবিতা</option>
              <option value="প্রবন্ধ">প্রবন্ধ</option>
              <option value="দিনলিপি">দিনলিপি / নোট</option>
            </select>
          </label>

          <label>
            রঙের আভা (Visual Theme)
            <select
              value={tone}
              onChange={(e) =>
                setTone(e.target.value as "rose" | "sage" | "gold" | "lavender")
              }
            >
              <option value="rose">গোলাপী আভা (Rose)</option>
              <option value="sage">সবুজ পাতার সুর (Sage)</option>
              <option value="gold">সোনালী গোধূলি (Gold)</option>
              <option value="lavender">ল্যাভেন্ডার সন্ধ্যা (Lavender)</option>
            </select>
          </label>
        </div>

        <label>
          শিরোনাম
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="আপনার লেখার আকর্ষণীয় শিরোনাম লিখুন..."
          />
        </label>

        <ImagePicker
          value={imagePreview}
          onChange={(url) => setImagePreview(url)}
          presetType="postCovers"
          aspectRatio="cover"
          label="লেখার কভার ছবি (Cover Picture)"
          hint="ডিভাইস থেকে ছবি আপলোড করুন, সরাসরি লিঙ্ক দিন অথবা নান্দনিক সাহিত্যিক সংগ্রহ থেকে পছন্দ করুন৤"
        />

        <label>
          সংক্ষিপ্ত ভূমিকা / টিজার
          <textarea
            rows={2}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="পাঠকের জন্য এক বা দুই বাক্যের চুম্বক ভূমিকা..."
          />
        </label>

        <label>
          মূল সাহিত্য রচনা (সর্বোচ্চ ৬,০০০ শব্দ)
          <div style={{ marginTop: "6px" }}>
            <SpellingHighlightedEditor
              value={body}
              onChange={(newText) => {
                setBody(newText);
                if (wordError) setWordError(null);
              }}
              placeholder="এখানে সম্পূর্ণ গল্প, কবিতা বা প্রবন্ধ লিখুন... (ভুল বানানের নিচে স্বয়ংক্রিয়ভাবে লাল দাগ প্রদর্শিত হবে)"
              rows={14}
              minHeight="340px"
              required
            />
          </div>

          {/* Live Word count & limit meter */}
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
              ) : body.trim().length > 0 ? (
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
              <span>আনুমানিক পড়ার সময়: {calculateReadTime(body)}</span>
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
            সংরক্ষণ ও প্রকাশ করুন
          </button>
          <a
            href="/admin/posts"
            className="admin-button secondary"
          >
            বাতিল
          </a>
        </div>
      </form>
    </main>
  );
}
