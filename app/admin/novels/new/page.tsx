/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addNovel } from "@/lib/store";

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/admin/novels" className="admin-back">
          ← উপন্যাসে ফিরে যান
        </a>
        <a href="/admin/dashboard" className="admin-back">
          ড্যাশবোর্ড
        </a>
      </div>

      <header>
        <div>
          <p className="eyebrow">NEW NOVEL CREATION</p>
          <h1>
            নতুন <em>উপন্যাস শুরু করুন</em>
          </h1>
        </div>
      </header>

      {saved && createdId && (
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
            ✓ &apos;{title}&apos; উপন্যাসটি তৈরি হয়েছে। এবার পর্ব (Episode) যোগ করতে পারেন।
          </span>
          <div style={{ display: "flex", gap: "10px" }}>
            <a
              href={`/admin/novels/${createdId}/episodes/new`}
              style={{ fontWeight: "700", textDecoration: "underline" }}
            >
              + প্রথম পর্ব লিখুন →
            </a>
            <a href="/admin/novels" style={{ textDecoration: "underline" }}>
              উপন্যাস তালিকায় যান
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
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

        <label>
          ঐচ্ছিক Cover ছবি আপলোড
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => setCover(reader.result as string);
                reader.readAsDataURL(file);
              }
            }}
          />
        </label>

        {cover ? (
          <img className="novel-cover-preview" src={cover} alt="উপন্যাসের cover preview" />
        ) : (
          <div
            className={`cover-empty`}
            style={{
              background:
                coverTone === "sage"
                  ? "#b8c0a5"
                  : coverTone === "rose"
                  ? "#ddc0ba"
                  : coverTone === "gold"
                  ? "#d0b87d"
                  : "#b7bed5",
              color: "#fff",
              fontSize: "48px",
              fontFamily: "'Instrument Serif', serif",
            }}
          >
            {coverLetter || title.charAt(0) || "আ"}
          </div>
        )}

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
          ধরন / Genre
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

        <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
          <button className="admin-button" type="submit">
            উপন্যাস সংরক্ষণ করুন →
          </button>
          <a
            href="/admin/novels"
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
