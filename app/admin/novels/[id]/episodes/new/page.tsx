"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getNovels,
  addEpisodeToNovel,
  Novel,
  MAX_WORDS_LIMIT,
  countWordsWithoutSpace,
  formatBengaliNumber,
} from "@/lib/store";

export default function NewEpisode() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [saved, setSaved] = useState(false);
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
        `সর্বোচ্চ ৬,০০০ শব্দের সীমা অতিক্রম করেছে! বর্তমান শব্দ সংখ্যা: ${wordCount}। অনুগ্রহ করে পর্বটি ৬,০০০ শব্দের মধ্যে রাখুন।`
      );
      return;
    }
    setWordError(null);

    const actualStatus = forcedStatus || status;
    const finalTeaser =
      teaser.trim() ||
      (content.trim().slice(0, 80) + (content.trim().length > 80 ? "..." : ""));

    addEpisodeToNovel(novel.id, {
      episodeNumber: Number(epNumber),
      title: title.trim(),
      teaser: finalTeaser,
      content: content.trim(),
      readTime: calculateReadTime(content),
      status: actualStatus,
    });

    setSaved(true);
  };

  return (
    <main className="editor-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href={`/admin/novels/${params.id}/episodes`} className="admin-back">
          ← Episodes তালিকায় ফিরে যান
        </a>
        <a href="/admin/novels" className="admin-back">
          উপন্যাস তালিকা
        </a>
      </div>

      <header>
        <div>
          <p className="eyebrow">{novel?.title || "উপন্যাস"} · NEW EPISODE</p>
          <h1>
            নতুন <em>পর্ব প্রকাশ</em>
          </h1>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="draft"
            onClick={(e) => handlePublish(e, "খসড়া")}
          >
            খসড়া হিসেবে রাখুন
          </button>
          <button
            type="button"
            className="admin-button"
            onClick={(e) => handlePublish(e, "প্রকাশিত")}
          >
            Episode প্রকাশ করুন →
          </button>
        </div>
      </header>

      {saved && (
        <div
          className="saved"
          style={{
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            ✓ &apos;{title}&apos; পর্বটি উপন্যাসে যোগ হয়েছে। উপন্যাসের মূল cover image স্বয়ংক্রিয়ভাবে
            ব্যবহৃত হবে।
          </span>
          <div style={{ display: "flex", gap: "12px" }}>
            <a href="/#novels" target="_blank" style={{ fontWeight: "600", textDecoration: "underline" }}>
              ওয়েবসাইটে পড়ুন ↗
            </a>
            <a href={`/admin/novels/${params.id}/episodes`} style={{ textDecoration: "underline" }}>
              পর্ব তালিকায় যান
            </a>
          </div>
        </div>
      )}

      <form className="editor-form" onSubmit={(e) => handlePublish(e)}>
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
            placeholder="যেমন: নীরব দুপুর বা অচেনা বাঁক"
          />
        </label>

        <label>
          ছোট ভূমিকা বা আকর্ষণীয় চুম্বক অংশ (Teaser)
          <textarea
            rows={2}
            value={teaser}
            onChange={(e) => setTeaser(e.target.value)}
            placeholder="এই পর্ব সম্পর্কে সংক্ষেপে এক বা দুই লাইন..."
          />
        </label>

        <label>
          সম্পূর্ণ পর্বের লেখা (সর্বোচ্চ ৬,০০০ শব্দ)
          <textarea
            className="writing-area"
            required
            rows={12}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (wordError) setWordError(null);
            }}
            placeholder="এখানে পর্বের বিস্তারিত কাহিনী লিখুন..."
          />

          {/* Word count & Limit Meter */}
          <div className={`word-meter-box ${isOverLimit ? "exceeded" : ""}`}>
            <div>
              <span>শব্দ সংখ্যা: </span>
              <strong>{formatBengaliNumber(wordCount)}</strong> / ৬,০০০ শব্দ
              {isOverLimit && <span style={{ marginLeft: "8px", fontWeight: "700" }}>⚠️ সীমা অতিক্রম করেছে!</span>}
            </div>
            <div>
              <span>পড়ার সময়: {calculateReadTime(content)}</span>
            </div>
          </div>

          <div className="word-meter-bar">
            <div
              className={`word-meter-fill ${
                wordCount > 5500 ? (isOverLimit ? "danger" : "warning") : ""
              }`}
              style={{ width: `${Math.min(100, (wordCount / MAX_WORDS_LIMIT) * 100)}%` }}
            />
          </div>

          {wordError && (
            <p style={{ color: "#d32f2f", fontSize: "13px", fontWeight: "600", marginTop: "8px" }}>
              {wordError}
            </p>
          )}
        </label>

        <p className="episode-note">
          ✓ তথ্য: উপন্যাসের প্রতিটি পর্বের জন্য আলাদা cover ছবি লাগবে না—উপন্যাসের মূল কাভার আর্ট
          স্বয়ংক্রিয়ভাবে পুরো সিরিজের জন্য ব্যবহৃত হয়।
        </p>

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

        <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
          <button className="admin-button" type="submit">
            পর্ব প্রকাশ করুন
          </button>
          <a
            href={`/admin/novels/${params.id}/episodes`}
            className="draft"
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            বাতিল
          </a>
        </div>
      </form>
    </main>
  );
}
