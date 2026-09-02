"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getPosts,
  getNovels,
  getComments,
  getSubscribers,
  deleteComment,
  formatBengaliNumber,
  Post,
  Novel,
  ReaderComment,
  Subscriber,
} from "@/lib/store";

export default function Dashboard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [novels, setNovels] = useState<Novel[]>([]);
  const [comments, setComments] = useState<ReaderComment[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "comments" | "subscribers">("overview");

  useEffect(() => {
    if (localStorage.getItem("ahona-admin") !== "true") {
      router.replace("/admin/login");
    } else {
      setReady(true);
      loadData();
    }
  }, [router]);

  const loadData = () => {
    setPosts(getPosts());
    setNovels(getNovels());
    setComments(getComments());
    setSubscribers(getSubscribers());
  };

  const logout = () => {
    localStorage.removeItem("ahona-admin");
    window.location.assign("/admin/login");
  };

  const handleDeleteComment = (id: string) => {
    deleteComment(id);
    setComments(getComments());
  };

  if (!ready) return <main className="admin-loading">লোড হচ্ছে...</main>;

  const totalEpisodes = novels.reduce((acc, n) => acc + (n.episodes?.length || 0), 0);
  const totalClaps = posts.reduce((acc, p) => acc + (p.claps || 0), 0);

  return (
    <main className="admin-shell">
      <aside className="admin-side">
        <Link href="/" className="brand">
          <span className="mark">আ</span>
          <span>
            অহনা ইসলাম<small>সাহিত্য ও উপন্যাস CMS</small>
          </span>
        </Link>

        <nav>
          <button
            className={activeTab === "overview" ? "selected" : ""}
            onClick={() => setActiveTab("overview")}
            style={{ textAlign: "left", background: "none", border: "0", cursor: "pointer" }}
          >
            ▦ ড্যাশবোর্ড
          </button>
          <a href="/admin/posts">▤ সব লেখা ({formatBengaliNumber(posts.length)})</a>
          <a href="/admin/posts/new">＋ নতুন লেখা প্রকাশ</a>
          <a href="/admin/novels">◫ উপন্যাস ও Episodes ({formatBengaliNumber(novels.length)})</a>
          <button
            className={activeTab === "comments" ? "selected" : ""}
            onClick={() => setActiveTab("comments")}
            style={{ textAlign: "left", background: "none", border: "0", cursor: "pointer" }}
          >
            ◌ পাঠকের মন্তব্য ({formatBengaliNumber(comments.length)})
          </button>
          <button
            className={activeTab === "subscribers" ? "selected" : ""}
            onClick={() => setActiveTab("subscribers")}
            style={{ textAlign: "left", background: "none", border: "0", cursor: "pointer" }}
          >
            ✉ সাবস্ক্রাইবারগণ ({formatBengaliNumber(subscribers.length)})
          </button>
          <a href="/" target="_blank" rel="noreferrer" style={{ marginTop: "18px", borderTop: "1px solid #3b453e" }}>
            ↗ মূল ওয়েবসাইট দেখুন
          </a>
        </nav>

        <button onClick={logout} className="logout">
          ↗ লগ আউট
        </button>
      </aside>

      <section className="admin-content">
        <header className="admin-top">
          <div>
            <p className="eyebrow">WRITER CONTROL PANEL</p>
            <h1>
              সুপ্রভাত, <em>অহনা</em>
            </h1>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <a className="admin-button" href="/admin/posts/new">
              + নতুন লেখা
            </a>
            <a className="admin-button" href="/admin/novels/new" style={{ background: "#4a5d44" }}>
              + নতুন উপন্যাস
            </a>
          </div>
        </header>

        {/* Stats Section */}
        <section className="stats">
          <article>
            <span className="stat-icon">✦</span>
            <p>মোট প্রকাশনা</p>
            <strong>{formatBengaliNumber(posts.length)}</strong>
            <small>গল্প, কবিতা ও প্রবন্ধ</small>
          </article>
          <article>
            <span className="stat-icon">◫</span>
            <p>উপন্যাস ও পর্ব</p>
            <strong>
              {formatBengaliNumber(novels.length)}/{formatBengaliNumber(totalEpisodes)}
            </strong>
            <small>চলমান ধারাবাহিক</small>
          </article>
          <article>
            <span className="stat-icon">♡</span>
            <p>মোট প্রতিক্রিয়া ও ভালোবাসা</p>
            <strong>{formatBengaliNumber(totalClaps)}</strong>
            <small>পাঠকদের লাইক/ক্ল্যাপ</small>
          </article>
          <article>
            <span className="stat-icon">↗</span>
            <p>নিউজলেটার পাঠক</p>
            <strong>{formatBengaliNumber(subscribers.length)}</strong>
            <small>সরাসরি গ্রাহক</small>
          </article>
        </section>

        {activeTab === "overview" && (
          <section className="admin-grid">
            {/* Recent Writings */}
            <article className="recent">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">CONTENT</p>
                  <h2>সাম্প্রতিক প্রকাশনা</h2>
                </div>
                <a href="/admin/posts">সব দেখুন →</a>
              </div>

              <div className="post-list">
                {posts.slice(0, 5).map((post) => (
                  <div className="admin-post" key={post.id}>
                    <span className="post-art">
                      {post.type === "কবিতা" ? "❋" : post.type === "উপন্যাস" ? "◫" : "✦"}
                    </span>
                    <div>
                      <strong>{post.title}</strong>
                      <p>
                        {post.type} · {post.date} · {formatBengaliNumber(post.claps || 0)} claps
                      </p>
                    </div>
                    <span className={`status ${post.status === "প্রকাশিত" ? "live" : ""}`}>
                      {post.status}
                    </span>
                    <a
                      href="/admin/posts"
                      style={{ fontSize: "12px", borderBottom: "1px solid", textDecoration: "none" }}
                      title="ব্যবস্থাপনা"
                    >
                      ⋮
                    </a>
                  </div>
                ))}
              </div>
            </article>

            {/* Quick Novel & Serialized Story Action */}
            <article className="activity">
              <p className="eyebrow">SERIALIZED NOVELS</p>
              <h2>উপন্যাস ও পর্ব ব্যবস্থাপনা</h2>
              <p className="chart-copy">
                উপন্যাস একটি cover দিয়ে তৈরি হয়, আর পর্বগুলোতে আলাদা আলাদা episode ক্রমান্বয়ে
                প্রকাশিত হয়।
              </p>

              <div style={{ marginTop: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {novels.map((novel) => (
                  <div
                    key={novel.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 12px",
                      background: "#f7f4ec",
                      border: "1px solid #e7e1d7",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "14px" }}>{novel.title}</strong>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#6e756b" }}>
                        {formatBengaliNumber(novel.episodes.length)}টি পর্ব প্রকাশিত · {novel.status}
                      </p>
                    </div>
                    <a
                      href={`/admin/novels/${novel.id}/episodes`}
                      style={{ fontSize: "12px", fontWeight: "600", textDecoration: "underline" }}
                    >
                      পর্বসমূহ →
                    </a>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "20px" }}>
                <a className="admin-button" href="/admin/novels/new" style={{ width: "100%", justifyContent: "center" }}>
                  + নতুন উপন্যাস যোগ করুন →
                </a>
              </div>
            </article>
          </section>
        )}

        {/* Tab: Comments Moderation */}
        {activeTab === "comments" && (
          <article className="recent" style={{ marginTop: "24px" }}>
            <div className="panel-head">
              <div>
                <p className="eyebrow">MODERATION</p>
                <h2>পাঠকের মন্তব্য ও প্রতিক্রিয়া</h2>
              </div>
            </div>

            <div className="post-list">
              {comments.length === 0 ? (
                <p style={{ padding: "20px", color: "var(--muted)", textAlign: "center" }}>
                  এখনও কোনো মন্তব্য জমা পড়েনি।
                </p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: "16px",
                      borderBottom: "1px solid #e6dfd3",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", gap: "12px", alignItems: "baseline", marginBottom: "4px" }}>
                        <strong style={{ fontSize: "15px" }}>{c.authorName}</strong>
                        <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                          লেখার শিরোনাম: {c.targetTitle}
                        </span>
                        <small style={{ fontSize: "11px", color: "var(--muted)" }}>{c.date}</small>
                      </div>
                      <p style={{ margin: "6px 0 0", fontSize: "14px", lineHeight: "1.6" }}>{c.content}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      style={{
                        background: "none",
                        border: "1px solid #c97e74",
                        color: "#a1493b",
                        padding: "4px 8px",
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >
                      মুছুন
                    </button>
                  </div>
                ))
              )}
            </div>
          </article>
        )}

        {/* Tab: Newsletter Subscribers */}
        {activeTab === "subscribers" && (
          <article className="recent" style={{ marginTop: "24px" }}>
            <div className="panel-head">
              <div>
                <p className="eyebrow">NEWSLETTER</p>
                <h2>নিউজলেটার গ্রাহক তালিকা</h2>
              </div>
              <span>মোট {formatBengaliNumber(subscribers.length)} জন</span>
            </div>

            <div className="post-list">
              {subscribers.map((sub) => (
                <div
                  key={sub.id}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #e7e1d7",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <strong>{sub.email}</strong>
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>যুক্ত হয়েছেন: {sub.date}</span>
                </div>
              ))}
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
