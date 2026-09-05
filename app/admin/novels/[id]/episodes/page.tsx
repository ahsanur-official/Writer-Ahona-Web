"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getNovels, deleteEpisodeFromNovel, Novel, formatBengaliNumber, countWordsWithoutSpace } from "@/lib/store";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function NovelEpisodes() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemTitle?: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("ahona-admin") !== "true") {
      router.replace("/admin/login");
    } else {
      const all = getNovels();
      const found = all.find((n) => n.id === params.id);
      if (found) {
        setNovel(found);
      }
    }
  }, [router, params.id]);

  const handleDeleteEpisode = (episodeId: string, title: string) => {
    if (!novel) return;
    setConfirmState({
      isOpen: true,
      title: "পর্ব মুছে ফেলবেন?",
      message: "এই পর্বটি উপন্যাস ও ওয়েবসাইট থেকে স্থায়ীভাবে মুছে যাবে।",
      itemTitle: title,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await deleteEpisodeFromNovel(novel.id, episodeId);
          const updated = getNovels().find((n) => n.id === params.id);
          if (updated) setNovel({ ...updated });
        } finally {
          setIsDeleting(false);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  if (!novel) {
    return (
      <main className="episodes-page">
        <p>উপন্যাস লোড হচ্ছে...</p>
      </main>
    );
  }

  return (
    <main className="episodes-page">
      <header className="post-top">
        <a href="/admin/novels" className="admin-back">
          ← সব উপন্যাস
        </a>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Link className="admin-button" href={`/admin/novels/${novel.id}/episodes/new`}>
            + নতুন পর্ব যোগ করুন
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
          <strong style={{ fontSize: "16px", color: "var(--adm-ink)" }}>{novel.title}</strong>
          <span style={{ fontSize: "12px", color: "var(--adm-muted)", marginLeft: "8px" }}>
            ({novel.genre} · {novel.status})
          </span>
          <p style={{ margin: "6px 0 0", fontSize: "13px", lineHeight: "1.6", color: "var(--adm-muted)" }}>
            {novel.synopsis}
          </p>
        </div>
      </div>

      <div className="episode-list">
        {novel.episodes.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--adm-muted)" }}>
            এই উপন্যাসে এখনও কোনো পর্ব যোগ করা হয়নি। উপরে &apos;+ নতুন পর্ব যোগ করুন&apos; বাটনে চাপুন।
          </div>
        ) : (
          novel.episodes.map((ep) => (
            <article key={ep.id} className="episode-item">
              <span className="status" style={{ background: "var(--adm-accent-light)", color: "var(--adm-accent)", fontWeight: 700 }}>
                পর্ব {formatBengaliNumber(ep.episodeNumber)}
              </span>
              <div>
                <strong style={{ fontSize: "15px", color: "var(--adm-ink)" }}>{ep.title}</strong>
                <p style={{ margin: "3px 0 0", fontSize: "12px", color: "var(--adm-muted)", lineHeight: "1.5" }}>
                  {ep.teaser || "কোনো ভূমিকা দেওয়া হয়নি"}
                </p>
              </div>
              <div style={{ fontSize: "11px", color: "var(--adm-muted)" }}>
                <span>{ep.status}</span> · <span>{ep.date}</span>
                <br />
                <small style={{ color: "var(--adm-accent)", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                  <span>{ep.readTime}</span>
                  <span>·</span>
                  <span style={{ color: "var(--adm-ink)", background: "rgba(197,160,89,0.15)", padding: "1px 6px", borderRadius: "4px" }}>
                    📝 {formatBengaliNumber(countWordsWithoutSpace(ep.content || ""))} শব্দ
                  </span>
                </small>
              </div>
              <button
                onClick={() => handleDeleteEpisode(ep.id, ep.title)}
                className="admin-button danger delete-btn"
              >
                মুছুন
              </button>
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
        isLoading={isDeleting}
        onConfirm={confirmState.onConfirm}
        onCancel={() => !isDeleting && setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </main>
  );
}
