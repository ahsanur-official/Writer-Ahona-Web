"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getNovels, saveNovels, deleteNovel, formatBengaliNumber, Novel } from "@/lib/store";

export default function Novels() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [novels, setNovels] = useState<Novel[]>([]);

  useEffect(() => {
    if (localStorage.getItem("ahona-admin") !== "true") {
      router.replace("/admin/login");
    } else {
      setReady(true);
      setNovels(getNovels());
    }
  }, [router]);

  const handleDelete = (id: string, title: string) => {
    if (confirm(`আপনি কি সত্যি উপন্যাস '${title}' মুছে ফেলতে চান?`)) {
      deleteNovel(id);
      setNovels(getNovels());
    }
  };

  const toggleStatus = (id: string) => {
    const updated = novels.map((n) => {
      if (n.id === id) {
        return {
          ...n,
          status: n.status === "চলমান" ? ("সম্পূর্ণ" as const) : ("চলমান" as const),
        };
      }
      return n;
    });
    saveNovels(updated);
    setNovels(updated);
  };

  if (!ready) return <main className="admin-loading">লোড হচ্ছে...</main>;

  return (
    <main className="novels-page">
      <header className="post-top">
        <a href="/admin/dashboard" className="admin-back">
          ← ড্যাশবোর্ড
        </a>
        <div style={{ display: "flex", gap: "10px" }}>
          <a href="/#novels" target="_blank" className="admin-back">
            ওয়েবসাইটে দেখুন ↗
          </a>
          <a href="/admin/novels/new" className="admin-button">
            + নতুন উপন্যাস
          </a>
        </div>
      </header>

      <p className="eyebrow">NOVEL MANAGEMENT</p>
      <h1>
        আমার <em>উপন্যাসসমূহ</em>
      </h1>
      <p className="novel-help">
        উপন্যাস তৈরি করার সময় একবার মূল তথ্য ও কাভার দিন। এরপর প্রতিটি উপন্যাসে ধারাবাহিকভাবে পর্ব
        (episodes) প্রকাশ করুন।
      </p>

      <div className="novel-grid">
        {novels.length === 0 ? (
          <div style={{ padding: "40px", background: "#fff", gridColumn: "1/-1", textAlign: "center" }}>
            এখনও কোনো উপন্যাস তৈরি করা হয়নি। &apos;+ নতুন উপন্যাস&apos; চাপুন।
          </div>
        ) : (
          novels.map((novel, index) => (
            <article key={novel.id} className="novel-card">
              <div className={`novel-cover cover-${novel.coverTone || index % 2}`}>
                <span>{novel.coverLetter || novel.title.charAt(0)}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button
                      onClick={() => toggleStatus(novel.id)}
                      className="status live"
                      style={{ border: 0, cursor: "pointer" }}
                      title="ক্লিক করে স্ট্যাটাস পরিবর্তন করুন"
                    >
                      {novel.status} ⇄
                    </button>
                    <button
                      onClick={() => handleDelete(novel.id, novel.title)}
                      style={{
                        background: "none",
                        border: 0,
                        color: "#a1493b",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      মুছুন
                    </button>
                  </div>
                  <h2>{novel.title}</h2>
                  <p style={{ fontSize: "11px", color: "var(--muted)", margin: "0 0 6px" }}>
                    {novel.genre}
                  </p>
                  <p>{formatBengaliNumber(novel.episodes?.length || 0)}টি episode প্রকাশিত</p>
                </div>

                <div style={{ display: "flex", gap: "14px", marginTop: "12px" }}>
                  <a
                    href={`/admin/novels/${novel.id}/episodes`}
                    style={{ fontWeight: "600", textDecoration: "underline" }}
                  >
                    Episodes পরিচালনা ({formatBengaliNumber(novel.episodes?.length || 0)}) →
                  </a>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </main>
  );
}
