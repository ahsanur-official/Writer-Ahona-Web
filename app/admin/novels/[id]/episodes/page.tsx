"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getNovels, saveNovels, formatBengaliNumber, Novel } from "@/lib/store";

export default function Episodes() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [novel, setNovel] = useState<Novel | null>(null);

  useEffect(() => {
    if (localStorage.getItem("ahona-admin") !== "true") {
      router.replace("/admin/login");
    } else {
      setReady(true);
      const all = getNovels();
      const found = all.find((n) => n.id === params.id);
      if (found) setNovel(found);
    }
  }, [router, params.id]);

  const handleDeleteEpisode = (epId: string, title: string) => {
    if (!novel) return;
    if (confirm(`আপনি কি সত্যি পর্ব '${title}' মুছে ফেলতে চান?`)) {
      const all = getNovels();
      const updated = all.map((n) => {
        if (n.id === novel.id) {
          const episodes = n.episodes.filter((e) => e.id !== epId);
          return {
            ...n,
            episodes,
            episodesCount: episodes.length,
          };
        }
        return n;
      });
      saveNovels(updated);
      setNovel(updated.find((n) => n.id === novel.id) || null);
    }
  };

  if (!ready) return <main className="admin-loading">লোড হচ্ছে...</main>;

  if (!novel) {
    return (
      <main className="episodes-page">
        <p>উপন্যাসটি খুঁজে পাওয়া যায়নি।</p>
        <a href="/admin/novels" className="admin-back">
          ← সব উপন্যাসে ফিরে যান
        </a>
      </main>
    );
  }

  return (
    <main className="episodes-page">
      <header className="post-top">
        <a href="/admin/novels" className="admin-back">
          ← সব উপন্যাস
        </a>
        <div style={{ display: "flex", gap: "10px" }}>
          <a href="/#novels" target="_blank" className="admin-back">
            ওয়েবসাইটে দেখুন ↗
          </a>
          <Link className="admin-button" href={`/admin/novels/${novel.id}/episodes/new`}>
            + নতুন Episode যোগ করুন
          </Link>
        </div>
      </header>

      <p className="eyebrow">NOVEL / EPISODES MANAGEMENT</p>
      <h1>
        {novel.title} · <em>পর্বসমূহ</em>
      </h1>

      <div className="novel-episode-head">
        <div className={`mini-cover ${novel.coverTone || ""}`}>
          {novel.coverLetter || novel.title.charAt(0)}
        </div>
        <div>
          <strong>{novel.title}</strong> ({novel.genre} · {novel.status})
          <p>{novel.synopsis}</p>
        </div>
      </div>

      <div className="episode-list">
        {novel.episodes.length === 0 ? (
          <div style={{ padding: "30px", textAlign: "center", color: "var(--muted)" }}>
            এই উপন্যাসে এখনও কোনো পর্ব যোগ করা হয়নি। উপরে &apos;+ নতুন Episode যোগ করুন&apos; চাপুন।
          </div>
        ) : (
          novel.episodes.map((ep) => (
            <article key={ep.id}>
              <span>পর্ব {formatBengaliNumber(ep.episodeNumber)}</span>
              <div>
                <strong>{ep.title}</strong>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                  {ep.teaser}
                </p>
              </div>
              <small>
                {ep.status} · {ep.date} ({ep.readTime})
              </small>
              <button
                onClick={() => handleDeleteEpisode(ep.id, ep.title)}
                style={{ color: "#a1493b" }}
              >
                মুছুন
              </button>
            </article>
          ))
        )}
      </div>
    </main>
  );
}
