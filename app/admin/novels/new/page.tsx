/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { addNovel } from "@/lib/store";
import ImagePicker from "@/components/ImagePicker";

export default function NewNovel() {
  const router = useRouter();
  const [cover, setCover] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [createdTitle, setCreatedTitle] = useState("");
  const [createdGenre, setCreatedGenre] = useState("");

  // Form states
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [genre, setGenre] = useState("সামাজিক উপন্যাস · মনস্তাত্ত্বিক");
  const [status, setStatus] = useState<"চলমান" | "সম্পূর্ণ">("চলমান");
  const [coverTone, setCoverTone] = useState<"sage" | "rose" | "gold" | "lavender">("sage");
  const [coverLetter, setCoverLetter] = useState("");

  useEffect(() => {
    if (localStorage.getItem("ahona-admin") !== "true") {
      router.replace("/admin/login");
    }
  }, [router]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !synopsis.trim()) return;

    const letter = coverLetter.trim() || title.trim().charAt(0) || "উ";
    const finalGenre = genre.trim() || "ধারাবাহিক উপন্যাস";

    const created = addNovel({
      title: title.trim(),
      synopsis: synopsis.trim(),
      genre: finalGenre,
      status,
      coverLetter: letter,
      coverTone,
      coverUrl: cover || undefined,
    });

    setCreatedId(created.id);
    setCreatedTitle(title.trim());
    setCreatedGenre(finalGenre);
    setSaved(true);

    // Form reset / refresh so submitted text doesn't linger
    setTitle("");
    setSynopsis("");
    setCover(null);
    setCoverLetter("");
    setGenre("সামাজিক উপন্যাস · মনস্তাত্ত্বিক");
    setStatus("চলমান");
  };

  return (
    <main className="editor-page">
      <header className="post-top">
        <a href="/admin/novels" className="admin-back">
          ← উপন্যাসে ফিরে যান
        </a>
        <a href="/admin/dashboard" className="admin-back">
          ড্যাশবোর্ড ↗
        </a>
      </header>

      <div className="admin-top">
        <div>
          <p className="eyebrow">NEW NOVEL CREATION</p>
          <h1>
            নতুন <em>উপন্যাস শুরু করুন</em>
          </h1>
        </div>
      </div>

      {saved && createdId && (
        <div className="admin-alert-banner success" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <strong>&apos;{title}&apos;</strong> উপন্যাসটি তৈরি হয়েছে৤ এবার পর্ব (Episode) যোগ করতে পারেন৤
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <a
              href={`/admin/novels/${createdId}/episodes/new`}
              className="admin-button"
              style={{ padding: "6px 14px", fontSize: "12px", minHeight: "34px", textDecoration: "none" }}
            >
              + প্রথম পর্ব লিখুন →
            </a>
            <a
              href="/admin/novels"
              className="admin-button secondary"
              style={{ padding: "6px 14px", fontSize: "12px", minHeight: "34px", textDecoration: "none" }}
            >
              উপন্যাস তালিকা
            </a>
          </div>
        </div>
      )}

      <form className="editor-form" onSubmit={handleSubmit}>
        <label>
          উপন্যাসের নাম
          <input
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!coverLetter && e.target.value) {
                setCoverLetter(e.target.value.charAt(0));
              }
            }}
            placeholder="যেমন: কুয়াশার নদী"
          />
        </label>

        <div className="form-grid">
          <label>
            কাভার বর্ণ (Cover Letter)
            <input
              maxLength={2}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="যেমন: ক"
            />
          </label>

          <label>
            কাভারের রঙ (Visual Tone)
            <select
              value={coverTone}
              onChange={(e) =>
                setCoverTone(e.target.value as "sage" | "rose" | "gold" | "lavender")
              }
            >
              <option value="sage">সবুজ পাতা (Sage)</option>
              <option value="rose">গোলাপী আভা (Rose)</option>
              <option value="gold">সোনালী রোদ্দুর (Gold)</option>
              <option value="lavender">গোধূলি বেগুনি (Lavender)</option>
            </select>
          </label>
        </div>

        <ImagePicker
          value={cover}
          onChange={(url) => setCover(url)}
          presetType="novelCovers"
          aspectRatio="cover"
          label="উপন্যাসের কভার ছবি (Cover Picture)"
          hint="ডিভাইস থেকে কভার আপলোড করুন, সরাসরি ফটো URL বসান অথবা নিচে সংরক্ষিত নান্দনিক সাহিত্যিক কালেকশন থেকে পছন্দ করুন৤"
        />

        <label>
          উপন্যাসের সংক্ষিপ্ত পরিচিতি / পটভূমি (Synopsis)
          <textarea
            rows={4}
            required
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            placeholder="পাঠককে উপন্যাসটির কাহিনী ও দর্শন সম্পর্কে সংক্ষেপে বলুন..."
          />
        </label>

        <label>
          ধারা / Genre
          <input
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="যেমন: রোমান্টিক, রহস্য, সামাজিক, মনস্তাত্ত্বিক"
          />
        </label>

        <label>
          চলমান অবস্থা / স্ট্যাটাস
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "চলমান" | "সম্পূর্ণ")}
          >
            <option value="চলমান">চলমান (Ongoing)</option>
            <option value="সম্পূর্ণ">সম্পূর্ণ (Completed)</option>
          </select>
        </label>

        <div className="editor-actions">
          <button className="admin-button" type="submit">
            উপন্যাস সংরক্ষণ করুন →
          </button>
          <a
            href="/admin/novels"
            className="admin-button secondary"
          >
            বাতিল
          </a>
        </div>
      </form>

      {/* Success Modal Pop-up */}
      {saved && createdId && typeof document !== "undefined" && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            animation: "fadeIn 0.2s ease-out",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSaved(false);
          }}
        >
          <div
            style={{
              background: "var(--bg-primary, #ffffff)",
              color: "var(--text-primary, #1c1917)",
              borderRadius: "16px",
              padding: "32px 28px",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
              border: "1px solid var(--border-color, rgba(0, 0, 0, 0.1))",
              textAlign: "center",
              position: "relative",
            }}
          >
            <button
              onClick={() => setSaved(false)}
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
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
              NOVEL CREATED
            </p>

            <h3
              style={{
                fontSize: "22px",
                fontWeight: 600,
                margin: "0 0 10px",
                fontFamily: "var(--font-serif, serif)",
              }}
            >
              উপন্যাসটি সফলভাবে তৈরি হয়েছে!
            </h3>

            <p style={{ fontSize: "14px", color: "var(--muted-text, #555)", marginBottom: "20px", lineHeight: "1.5" }}>
              উপন্যাসের ভিত্তি প্রস্তুত হয়েছে৤ আপনি এখন সরাসরি প্রথম পর্ব লিখে প্রকাশ করতে পারেন অথবা উপন্যাস তালিকায় যেতে পারেন৤
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
                উপন্যাসের শিরোনাম ও ধারা:
              </div>
              <strong style={{ fontSize: "16px", color: "var(--adm-ink, #1c1917)", display: "block" }}>
                {createdTitle}
              </strong>
              <div style={{ fontSize: "12px", color: "var(--adm-accent, #991b1b)", marginTop: "4px" }}>
                {createdGenre} · স্ট্যাটাস: চলমান
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a
                href={`/admin/novels/${createdId}/episodes/new`}
                className="admin-button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "12px 20px",
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                + এই উপন্যাসের প্রথম পর্ব লিখুন →
              </a>

              <div style={{ display: "flex", gap: "10px" }}>
                <a
                  href="/admin/novels"
                  className="admin-button secondary"
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10px 16px",
                    fontSize: "13px",
                    textDecoration: "none",
                  }}
                >
                  উপন্যাস তালিকায় যান
                </a>
                <button
                  type="button"
                  onClick={() => setSaved(false)}
                  className="admin-button secondary"
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  আরেকটি উপন্যাস শুরু করুন
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  );
}
