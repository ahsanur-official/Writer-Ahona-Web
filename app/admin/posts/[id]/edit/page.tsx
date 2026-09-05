/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, FormEvent, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getPosts,
  updatePost,
  PostType,
  MAX_WORDS_LIMIT,
  countWordsWithoutSpace,
  formatBengaliNumber,
  Post,
} from "@/lib/store";
import ImagePicker from "@/components/ImagePicker";
import SpellingHighlightedEditor from "@/components/SpellingHighlightedEditor";
import { checkSpelling } from "@/lib/spelling";
import Link from "next/link";

export default function EditPost() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

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
      return;
    }

    const all = getPosts();
    const target = all.find((p) => p.id === postId);
    if (target) {
      setPost(target);
      setType(target.type);
      setTitle(target.title);
      setExcerpt(target.excerpt);
      setBody(target.body);
      setTone(target.tone || "rose");
      setStatus(target.status);
      setImagePreview(target.coverUrl || null);
    }
    setLoading(false);
  }, [postId, router]);

  const wordCount = countWordsWithoutSpace(body);
  const isOverLimit = wordCount > MAX_WORDS_LIMIT;

  const spellResult = useMemo(() => {
    return checkSpelling(body);
  }, [body]);

  const calculateReadTime = (text: string): string => {
    const words = countWordsWithoutSpace(text);
    const minutes = Math.max(1, Math.ceil(words / 130));
    const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    const bMinutes = String(minutes).replace(/\d/g, (d) => bengaliDigits[Number(d)]);
    return `${bMinutes} মিনিট`;
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!postId || !title.trim() || !body.trim()) return;

    if (isOverLimit) {
      setWordError(
        `সর্বোচ্চ ৬,০০০ শব্দের সীমা অতিক্রম করেছে! বর্তমান শব্দ সংখ্যা: ${wordCount}। অনুগ্রহ করে লেখাটি ৬,০০০ শব্দের মধ্যে রাখুন।`
      );
      return;
    }
    setWordError(null);

    const finalExcerpt =
      excerpt.trim() ||
      (body.trim().slice(0, 100) + (body.trim().length > 100 ? "..." : ""));

    updatePost(postId, {
      title: title.trim(),
      type,
      excerpt: finalExcerpt,
      body: body.trim(),
      tone,
      readTime: calculateReadTime(body),
      status,
      coverUrl: imagePreview || undefined,
    });

    setSaved(true);
  };

  if (loading) {
    return (
      <main className="editor-page" style={{ textAlign: "center", padding: "80px 20px" }}>
        <p>তথ্য লোড হচ্ছে...</p>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="editor-page" style={{ textAlign: "center", padding: "80px 20px" }}>
        <h2>লেখাটি পাওয়া যায়নি</h2>
        <p style={{ color: "var(--adm-muted)", margin: "14px 0 24px" }}>
          লেখাটি হয়তো মুছে ফেলা হয়েছে অথবা আইডি ভুল।
        </p>
        <Link href="/admin/posts" className="admin-button">
          ← সব লেখায় ফিরে যান
        </Link>
      </main>
    );
  }

  return (
    <main className="editor-page">
      <header className="post-top">
        <Link href="/admin/posts" className="admin-back">
          ← সব লেখা
        </Link>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link href="/admin/dashboard" className="admin-back">
            ড্যাশবোর্ড ↗
          </Link>
          <a href="/" target="_blank" className="admin-back" rel="noreferrer">
            ওয়েবসাইট দেখুন ↗
          </a>
        </div>
      </header>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap" }}>
        <div>
          <p className="eyebrow">EDIT & MANAGE CONTENT</p>
          <h1>
            লেখা <em>সম্পাদনা ও ছবি পরিবর্তন</em>
          </h1>
        </div>
        <div style={{ fontSize: "12px", color: "var(--adm-muted)" }}>
          পোস্ট আইডি: <code>{postId}</code>
        </div>
      </div>

      {saved && (
        <div className="save-toast" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>✓ লেখাটি এবং ছবি ক্লাউড ডাটাবেজে সফলভাবে সংরক্ষিত হয়েছে!</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <Link href="/admin/posts" className="admin-button secondary" style={{ fontSize: "12px", padding: "4px 10px" }}>
              তালিকায় যান
            </Link>
            <button
              type="button"
              onClick={() => setSaved(false)}
              style={{ background: "transparent", border: "none", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="admin-form">
        <div className="form-grid">
          <label>
            রচনার ধারা (Category)
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
            placeholder="আপনার লেখার শিরোনাম লিখুন..."
          />
        </label>

        {/* Image Picker for Post Cover */}
        <ImagePicker
          value={imagePreview}
          onChange={(url) => setImagePreview(url)}
          presetType="postCovers"
          aspectRatio="cover"
          label="লেখার কভার ছবি (Cover Picture)"
          hint="ডিভাইস থেকে যেকোনো ছবি আপলোড করুন, সরাসরি URL লিঙ্ক বসান অথবা সংরক্ষিত নান্দনিক সাহিত্যিক কালেকশন থেকে পছন্দ করুন।"
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "12px",
              fontSize: "12px",
              color: "var(--adm-muted)",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div>
                <span>শব্দ সংখ্যা: </span>
                <strong style={{ color: isOverLimit ? "var(--adm-danger)" : "var(--adm-ink)", fontSize: "14px" }}>
                  {formatBengaliNumber(wordCount)}
                </strong>{" "}
                / ৬,০০০ শব্দ
                {isOverLimit && (
                  <span style={{ marginLeft: "8px", color: "var(--adm-danger)", fontWeight: "700" }}>
                    ⚠️ সীমা অতিক্রম করেছে!
                  </span>
                )}
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
            <p style={{ color: "var(--adm-danger)", fontSize: "13px", fontWeight: "600", marginTop: "8px" }}>
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

        <div className="editor-actions">
          <button className="admin-button" type="submit">
            পরিবর্তন সংরক্ষণ করুন
          </button>
          <Link href="/admin/posts" className="admin-button secondary">
            বাতিল
          </Link>
        </div>
      </form>
    </main>
  );
}
