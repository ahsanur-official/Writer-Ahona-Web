/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addPost, PostType, MAX_WORDS_LIMIT, countWordsWithoutSpace, formatBengaliNumber } from "@/lib/store";
import ImagePicker from "@/components/ImagePicker";
import SpellingCheckerWidget from "@/components/SpellingCheckerWidget";

export default function NewPost() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [showSpellingChecker, setShowSpellingChecker] = useState(false);

  // Form states
  const [type, setType] = useState<PostType>("গল্প");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [tone, setTone] = useState<"rose" | "sage" | "gold" | "lavender">("rose");
  const [status, setStatus] = useState<"প্রকাশিত" | "খসড়া">("প্রকাশিত");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [wordError, setWordError] = useState<string | null>(null);

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
        `সর্বোচ্চ ৬,০০০ শব্দের সীমা অতিক্রম করেছে! বর্তমান শব্দ সংখ্যা: ${wordCount}। অনুগ্রহ করে লেখাটি ৬,০০০ শব্দের মধ্যে রাখুন।`
      );
      return;
    }
    setWordError(null);

    const actualStatus = forcedStatus || status;
    const finalExcerpt =
      excerpt.trim() ||
      (body.trim().slice(0, 100) + (body.trim().length > 100 ? "..." : ""));

    addPost({
      title: title.trim(),
      type,
      excerpt: finalExcerpt,
      body: body.trim(),
      tone,
      readTime: calculateReadTime(body),
      status: actualStatus,
      coverUrl: imagePreview || undefined,
    });

    setSaved(true);
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

      {saved && (
        <div className="admin-alert-banner success" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <strong>&apos;{title}&apos;</strong> সফলভাবে {status === "প্রকাশিত" ? "প্রকাশিত" : "সংরক্ষিত"} হয়েছে!
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
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
          hint="ডিভাইস থেকে ছবি আপলোড করুন, সরাসরি লিঙ্ক দিন অথবা নান্দনিক সাহিত্যিক সংগ্রহ থেকে পছন্দ করুন।"
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
          <textarea
            className="writing-area"
            required
            rows={12}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              if (wordError) setWordError(null);
            }}
            placeholder="এখানে সম্পূর্ণ গল্প, কবিতা বা প্রবন্ধ লিখুন..."
          />

          {/* Live Word count & limit meter */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", fontSize: "12px", color: "var(--adm-muted)", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <div>
                <span>শব্দ সংখ্যা: </span>
                <strong style={{ color: isOverLimit ? "var(--adm-danger)" : "var(--adm-ink)", fontSize: "14px" }}>
                  {formatBengaliNumber(wordCount)}
                </strong> / ৬,০০০ শব্দ
                {isOverLimit && <span style={{ marginLeft: "8px", color: "var(--adm-danger)", fontWeight: "700" }}>⚠️ সীমা অতিক্রম করেছে!</span>}
              </div>

              <button
                type="button"
                onClick={() => setShowSpellingChecker(!showSpellingChecker)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 10px",
                  borderRadius: "14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: showSpellingChecker ? "var(--adm-accent)" : "var(--adm-card)",
                  color: showSpellingChecker ? "#fff" : "var(--adm-ink)",
                  border: "1px solid var(--adm-line)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                🔍 বানান পরীক্ষক (বাংলা ও English) {showSpellingChecker ? "▲ বন্ধ" : "▼ পরীক্ষা করুন"}
              </button>
            </div>
            <div>
              <span>আনুমানিক পড়ার সময়: {calculateReadTime(body)}</span>
            </div>
          </div>

          {showSpellingChecker && (
            <SpellingCheckerWidget
              text={body}
              onTextChange={(newText) => setBody(newText)}
            />
          )}

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
