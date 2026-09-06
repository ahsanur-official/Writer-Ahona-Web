/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { getNovels, updateNovel, Novel } from "@/lib/store";
import ImagePicker from "@/components/ImagePicker";
import Link from "next/link";

export default function EditNovel() {
  const router = useRouter();
  const params = useParams();
  const novelId = params?.id as string;

  const [novel, setNovel] = useState<Novel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [genre, setGenre] = useState("");
  const [status, setStatus] = useState<"চলমান" | "সম্পূর্ণ">("চলমান");
  const [coverTone, setCoverTone] = useState<"sage" | "rose" | "gold" | "lavender">("sage");
  const [coverLetter, setCoverLetter] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    if (localStorage.getItem("ahona-admin") !== "true") {
      router.replace("/admin/login");
      return;
    }

    const all = getNovels();
    const target = all.find((n) => n.id === novelId);
    if (target) {
      setNovel(target);
      setTitle(target.title);
      setSynopsis(target.synopsis);
      setGenre(target.genre);
      setStatus(target.status);
      setCoverTone(target.coverTone || "sage");
      setCoverLetter(target.coverLetter || "");
      setCoverUrl(target.coverUrl || null);
    }
    setLoading(false);
  }, [novelId, router]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!novelId || !title.trim() || !synopsis.trim()) return;

    updateNovel(novelId, {
      title: title.trim(),
      synopsis: synopsis.trim(),
      genre: genre.trim() || "ধারাবাহিক উপন্যাস",
      status,
      coverLetter: coverLetter.trim() || title.trim().charAt(0) || "উ",
      coverTone,
      coverUrl: coverUrl || undefined,
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

  if (!novel) {
    return (
      <main className="editor-page" style={{ textAlign: "center", padding: "80px 20px" }}>
        <h2>উপন্যাসটি পাওয়া যায়নি</h2>
        <p style={{ color: "var(--adm-muted)", margin: "14px 0 24px" }}>
          উপন্যাসটি হয়তো মুছে ফেলা হয়েছে অথবা আইডি সঠিক নয়৤
        </p>
        <Link href="/admin/novels" className="admin-button">
          ← সব উপন্যাসে ফিরে যান
        </Link>
      </main>
    );
  }

  return (
    <main className="editor-page">
      <header className="post-top">
        <Link href="/admin/novels" className="admin-back">
          ← সব উপন্যাস
        </Link>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link href={`/admin/novels/${novelId}/episodes`} className="admin-back">
            পর্বসমূহ পরিচালনা ({novel.episodes?.length || 0}) ↗
          </Link>
          <Link href="/admin/dashboard" className="admin-back">
            ড্যাশবোর্ড ↗
          </Link>
        </div>
      </header>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap" }}>
        <div>
          <p className="eyebrow">NOVEL SETTINGS & COVER</p>
          <h1>
            উপন্যাস <em>সম্পাদনা ও কভার ছবি</em>
          </h1>
        </div>
        <div style={{ fontSize: "12px", color: "var(--adm-muted)" }}>
          উপন্যাস আইডি: <code>{novelId}</code>
        </div>
      </div>

      {saved && (
        <div className="save-toast" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>✓ উপন্যাসের তথ্য ও কভার ছবি ক্লাউড ডাটাবেজে সফলভাবে আপডেট হয়েছে!</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <Link href="/admin/novels" className="admin-button secondary" style={{ fontSize: "12px", padding: "4px 10px" }}>
              উপন্যাস তালিকায় যান
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

      <form onSubmit={handleSubmit} className="admin-form">
        <label>
          উপন্যাসের নাম (Title)
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="উপন্যাসের পূর্ণ নাম..."
          />
        </label>

        <div className="form-grid">
          <label>
            উপন্যাসের ধরন / জনরা (Genre)
            <input
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="যেমন: সামাজিক উপন্যাস · মনস্তাত্ত্বিক"
            />
          </label>

          <label>
            উপন্যাসের বর্তমান স্থিতি (Status)
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "চলমান" | "সম্পূর্ণ")}
            >
              <option value="চলমান">চলমান (Ongoing Serial)</option>
              <option value="সম্পূর্ণ">সম্পূর্ণ (Completed Novel)</option>
            </select>
          </label>
        </div>

        {/* Novel Cover Image Control */}
        <ImagePicker
          value={coverUrl}
          onChange={(url) => setCoverUrl(url)}
          presetType="novelCovers"
          aspectRatio="cover"
          label="উপন্যাসের কভার ছবি (Cover Picture)"
          hint="ডিভাইস থেকে কভার আপলোড করুন, সরাসরি ফটো URL বসান অথবা নিচে সংরক্ষিত নান্দনিক সাহিত্যিক কালেকশন থেকে পছন্দ করুন৤"
        />

        <div className="form-grid">
          <label>
            কাভারের রঙ (যদি ছবি না থাকে)
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

          <label>
            কাভারের প্রথম বর্ণ / মনোগ্রাম
            <input
              maxLength={2}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder={title.charAt(0) || "উ"}
            />
          </label>
        </div>

        <label>
          উপন্যাসের সংক্ষিপ্ত পরিচিতি / পটভূমি (Synopsis)
          <textarea
            rows={4}
            required
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            placeholder="উপন্যাসের কাহিনী, চরিত্র ও পটভূমি সম্পর্কিত সারসংক্ষেপ..."
          />
        </label>

        <div className="editor-actions">
          <button className="admin-button" type="submit">
            পরিবর্তন সংরক্ষণ করুন
          </button>
          <Link href={`/admin/novels/${novelId}/episodes`} className="admin-button secondary">
            পর্বসমূহ পরিচালনা করুন →
          </Link>
          <Link href="/admin/novels" className="admin-button secondary">
            বাতিল
          </Link>
        </div>
      </form>
    </main>
  );
}
