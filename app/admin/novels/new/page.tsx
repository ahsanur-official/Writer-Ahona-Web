/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addNovel } from "@/lib/store";
import ImagePicker from "@/components/ImagePicker";

export default function NewNovel() {
  const router = useRouter();
  const [cover, setCover] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

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

    const created = addNovel({
      title: title.trim(),
      synopsis: synopsis.trim(),
      genre: genre.trim() || "ধারাবাহিক উপন্যাস",
      status,
      coverLetter: letter,
      coverTone,
      coverUrl: cover || undefined,
    });

    setCreatedId(created.id);
    setSaved(true);
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
        <div
          style={{
            background: "var(--adm-accent-light)",
            border: "1px solid var(--adm-accent)",
            color: "var(--adm-accent)",
            padding: "16px 20px",
            borderRadius: "var(--adm-radius)",
            margin: "20px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <strong>
            ✓ &apos;{title}&apos; উপন্যাসটি তৈরি হয়েছে। এবার পর্ব (Episode) যোগ করতে পারেন।
          </strong>
          <div style={{ display: "flex", gap: "10px" }}>
            <a
              href={`/admin/novels/${createdId}/episodes/new`}
              className="admin-button"
              style={{ padding: "6px 12px", fontSize: "12px", minHeight: "34px" }}
            >
              + প্রথম পর্ব লিখুন →
            </a>
            <a href="/admin/novels" className="admin-button secondary" style={{ padding: "6px 12px", fontSize: "12px", minHeight: "34px" }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
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
          hint="ডিভাইস থেকে কভার আপলোড করুন, সরাসরি ফটো URL বসান অথবা নিচে সংরক্ষিত নান্দনিক সাহিত্যিক কালেকশন থেকে পছন্দ করুন।"
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

        <div style={{ marginTop: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button className="admin-button" type="submit" style={{ minWidth: "160px" }}>
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
    </main>
  );
}
