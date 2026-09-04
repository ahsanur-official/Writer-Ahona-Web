/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getNovels, saveNovels, deleteNovel, formatBengaliNumber, Novel } from "@/lib/store";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function Novels() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [novels, setNovels] = useState<Novel[]>([]);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemTitle?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  useEffect(() => {
    if (localStorage.getItem("ahona-admin") !== "true") {
      router.replace("/admin/login");
    } else {
      setReady(true);
      setNovels(getNovels());
    }

    const handler = () => setNovels(getNovels());
    window.addEventListener("ahona_store_updated", handler);
    return () => window.removeEventListener("ahona_store_updated", handler);
  }, [router]);

  const handleDelete = (id: string, title: string) => {
    setConfirmState({
      isOpen: true,
      title: "উপন্যাস মুছে ফেলবেন?",
      message: "এই উপন্যাস এবং এর সকল পর্ব প্ল্যাটফর্ম ও ক্লাউড ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হবে। এই কাজটি অপরিবর্তনীয়।",
      itemTitle: title,
      onConfirm: () => {
        deleteNovel(id);
        setNovels(getNovels());
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
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
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <a href="/admin/novels/new" className="admin-button">
            + নতুন উপন্যাস তৈরি
          </a>
        </div>
      </header>

      <p className="eyebrow">NOVEL MANAGEMENT</p>
      <h1>
        আমার <em>উপন্যাসসমূহ</em>
      </h1>
      <p style={{ fontSize: "14px", color: "var(--adm-muted)", margin: "8px 0 24px", lineHeight: "1.6" }}>
        উপন্যাস তৈরির পর পর্বভিত্তিক ধারাবাহিকভাবে নতুন পর্ব (episodes) যুক্ত ও পরিচালনা করতে পারবেন।
      </p>

      <div className="novel-grid">
        {novels.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              background: "var(--adm-surface)",
              border: "1px solid var(--adm-line)",
              borderRadius: "var(--adm-radius-lg)",
              gridColumn: "1/-1",
              textAlign: "center",
              color: "var(--adm-muted)",
            }}
          >
            এখনও কোনো উপন্যাস তৈরি করা হয়নি। উপরের &apos;+ নতুন উপন্যাস তৈরি&apos; বাটনে চাপুন।
          </div>
        ) : (
          novels.map((novel) => (
            <article key={novel.id} className="novel-card">
              {novel.coverUrl ? (
                <div style={{ width: "100%", height: "180px", overflow: "hidden", position: "relative" }}>
                  <img
                    src={novel.coverUrl}
                    alt={novel.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              ) : (
                <div className={`novel-cover cover-${novel.coverTone || "sage"}`}>
                  <span>{novel.coverLetter || novel.title.charAt(0)}</span>
                </div>
              )}
              <div className="novel-card-content">
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button
                      onClick={() => toggleStatus(novel.id)}
                      className={`status ${novel.status === "চলমান" ? "live" : "draft"}`}
                      style={{ border: 0, cursor: "pointer", padding: "4px 8px" }}
                      title="ক্লিক করে স্ট্যাটাস পরিবর্তন করুন"
                    >
                      {novel.status} ⇄
                    </button>
                    <button
                      onClick={() => handleDelete(novel.id, novel.title)}
                      className="admin-button danger delete-btn"
                    >
                      মুছুন
                    </button>
                  </div>

                  <h3 style={{ fontSize: "18px", fontWeight: "700", margin: "10px 0 4px", color: "var(--adm-ink)" }}>
                    {novel.title}
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--adm-muted)", margin: "0 0 6px" }}>
                    {novel.genre}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--adm-ink)", margin: 0, fontWeight: 500 }}>
                    {formatBengaliNumber(novel.episodes?.length || 0)}টি পর্ব প্রকাশিত
                  </p>
                </div>

                <div className="novel-card-actions">
                  <Link
                    href={`/admin/novels/${novel.id}/edit`}
                    className="admin-button edit-btn"
                  >
                    সম্পাদনা ও কভার ছবি ✎
                  </Link>
                  <Link
                    href={`/admin/novels/${novel.id}/episodes`}
                    className="admin-button secondary"
                  >
                    পর্বসমূহ পরিচালনা ({formatBengaliNumber(novel.episodes?.length || 0)}) →
                  </Link>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Literary High-Contrast Custom Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        itemTitle={confirmState.itemTitle}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </main>
  );
}
