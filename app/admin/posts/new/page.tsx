/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addPost, PostType, MAX_WORDS_LIMIT, countWordsWithoutSpace, formatBengaliNumber } from "@/lib/store";

export default function NewPost() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [newPostId, setNewPostId] = useState<string | null>(null);

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
  }, [router]);

  const handleImage = (file?: File) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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

    const newCreated = addPost({
      title: title.trim(),
      type,
      excerpt: finalExcerpt,
      body: body.trim(),
      tone,
      readTime: calculateReadTime(body),
      status: actualStatus,
      coverUrl: imagePreview || undefined,
    });

    setNewPostId(newCreated.id);
    setSaved(true);
  };

  return (
    <main className="editor-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/admin/posts" className="admin-back">
          ← সব লেখায় ফিরে যান
        </a>
        <a href="/admin/dashboard" className="admin-back">
          ড্যাশবোর্ড
        </a>
      </div>

      <header>
        <div>
          <p className="eyebrow">NEW LITERARY PUBLICATION</p>
          <h1>
            নতুন <em>লেখা প্রকাশ</em>
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
            সরাসরি প্রকাশ করুন →
          </button>
        </div>
      </header>

      {saved && (
        <div
          className="saved"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <span>
            ✓ &apos;{title}&apos; সফলভাবে {status === "প্রকাশিত" ? "প্রকাশিত" : "সংরক্ষিত"} হয়েছে!
          </span>
          <div style={{ display: "flex", gap: "12px" }}>
            <a href="/" target="_blank" style={{ textDecoration: "underline", fontWeight: "600" }}>
              ওয়েবসাইটে দেখুন ↗
            </a>
            <a href="/admin/posts" style={{ textDecoration: "underline" }}>
              সব লেখায় যান
            </a>
          </div>
        </div>
      )}

      <form className="editor-form" onSubmit={(e) => handlePublish(e)}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <label>
            লেখার ধরন
            <select value={type} onChange={(e) => setType(e.target.value as PostType)}>
              <option value="গল্প">গল্প</option>
              <option value="কবিতা">কবিতা</option>
              <option value="প্রবন্ধ">প্রবন্ধ</option>
              <option value="দিনলিপি">দিনলিপি / নোট</option>
            </select>
          </label>

          <label>
            রঙের আভা (Tone / Visual Theme)
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
            placeholder="আপনার লেখার আকর্ষণীয় শিরোনাম লিখুন"
          />
        </label>

        <label>
          ঐচ্ছিক Cover ছবি
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImage(e.target.files?.[0])}
          />
        </label>
        {imagePreview && (
          <img
            className="cover-preview"
            src={imagePreview}
            alt="নির্বাচিত cover preview"
          />
        )}

        <label>
          সংক্ষিপ্ত ভূমিকা / টিজার
          <textarea
            rows={2}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="পাঠকের জন্য এক বা দুই বাক্যের চুম্বক অংশ..."
          />
        </label>

        <label>
          মূল সাহিত্য লেখা (সর্বোচ্চ ৬,০০০ শব্দ)
          <textarea
            className="writing-area"
            required
            rows={10}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              if (wordError) setWordError(null);
            }}
            placeholder="এখানে আপনার সম্পূর্ণ গল্প, কবিতা বা প্রবন্ধ লিখুন..."
          />

          {/* Word count & Limit Meter */}
          <div className={`word-meter-box ${isOverLimit ? "exceeded" : ""}`}>
            <div>
              <span>শব্দ সংখ্যা: </span>
              <strong>{formatBengaliNumber(wordCount)}</strong> / ৬,০০০ শব্দ
              {isOverLimit && <span style={{ marginLeft: "8px", fontWeight: "700" }}>⚠️ সীমা অতিক্রম করেছে!</span>}
            </div>
            <div>
              <span>আনুমানিক পড়ার সময়: {calculateReadTime(body)}</span>
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
            সংরক্ষণ ও প্রকাশ করুন
          </button>
          <a
            href="/admin/posts"
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
