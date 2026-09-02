/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getPosts,
  getNovels,
  getComments,
  getSubscribers,
  deleteComment,
  deleteSubscriber,
  getAuthorProfile,
  saveAuthorProfile,
  formatBengaliNumber,
  LITERARY_IMAGE_PRESETS,
  Post,
  Novel,
  ReaderComment,
  Subscriber,
  AuthorProfile,
} from "@/lib/store";
import ImagePicker from "@/components/ImagePicker";

type AdminTab = "overview" | "comments" | "subscribers" | "author" | "media";

export default function Dashboard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [novels, setNovels] = useState<Novel[]>([]);
  const [comments, setComments] = useState<ReaderComment[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Author Profile States
  const [profile, setProfile] = useState<AuthorProfile>({
    name: "অহনা ইসলাম",
    englishName: "Ahona Islam",
    tagline: "কথা ও শব্দের নান্দনিক আঙিনা",
    subTagline: "সমসাময়িক কথাসাহিত্য, গল্প ও মনস্তাত্ত্বিক উপন্যাস",
    bio: `“অহনা ইসলাম” নামটি যদিও কাল্পনিক, তবুও এটা এখন এক বাস্তবিক পরিচিতি।
বাবা-মায়ের দেওয়া নাম আলাদা হলেও পাঠকের হৃদয়ে তিনি জায়গা করে নিয়েছেন “অহনা ইসলাম” নামেই। যা তার শখ ও লেখালেখির পরিচয়ের প্রতীক।
এই ছোট্ট লেখিকা “২০০৮ সালের ১২ ই মার্চ” পৃথিবীতে আসেন বাবা-মায়ের কোল আলো করে। বর্তমানে তিনি ইন্টার দ্বিতীয় বর্ষের ছাত্রী। অল্প বয়সেই কলমের জাদুতে গল্প, কবিতা আর উপন্যাসের জগতে নিজের আলাদা স্থান তৈরি করেছেন তিনি। তার লেখায় থাকে অনুভূতির উষ্ণতা, কল্পনার রঙ আর জীবনের স্পর্শ, যা পাঠককে বারবার টেনে আনে তার সৃষ্টির ভুবনে।`,
    avatarUrl: "/ahona.png",
    location: "ঢাকা, বাংলাদেশ",
    email: "contact@ahonaislam.com",
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (localStorage.getItem("ahona-admin") !== "true") {
      router.replace("/admin/login");
    } else {
      setReady(true);
      loadData();
    }

    const handler = () => {
      loadData();
    };
    window.addEventListener("ahona_store_updated", handler);
    return () => window.removeEventListener("ahona_store_updated", handler);
  }, [router]);

  const loadData = () => {
    setPosts(getPosts());
    setNovels(getNovels());
    setComments(getComments());
    setSubscribers(getSubscribers());
    setProfile(getAuthorProfile());
  };

  const logout = () => {
    localStorage.removeItem("ahona-admin");
    window.location.assign("/admin/login");
  };

  const handleDeleteComment = (id: string) => {
    if (confirm("আপনি কি নিশ্চিত এই মন্তব্যটি মুছে ফেলতে চান?")) {
      deleteComment(id);
      setComments(getComments());
    }
  };

  const handleDeleteSubscriber = (id: string, email: string) => {
    if (confirm(`আপনি কি পাঠক '${email}' কে গ্রাহক তালিকা থেকে মুছে ফেলতে চান?`)) {
      deleteSubscriber(id);
      setSubscribers(getSubscribers());
    }
  };

  const handleSaveProfile = (e: FormEvent) => {
    e.preventDefault();
    saveAuthorProfile(profile);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 4000);
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  if (!ready) return <main className="admin-loading">লোড হচ্ছে...</main>;

  const totalEpisodes = novels.reduce((acc, n) => acc + (n.episodes?.length || 0), 0);
  const totalClaps = posts.reduce((acc, p) => acc + (p.claps || 0), 0);

  return (
    <main className="admin-shell">
      {/* Mobile Topbar */}
      <header className="admin-mobile-topbar">
        <div className="admin-mobile-brand">
          <span className="mark">আ</span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "14px", fontWeight: "700" }}>{profile.name}</span>
            <span style={{ fontSize: "10px", color: "var(--adm-sidebar-muted)" }}>Firebase ক্লাউড CMS</span>
          </div>
        </div>
        <div className="admin-mobile-actions">
          <Link
            href="/admin/posts/new"
            className="admin-button"
            style={{ padding: "6px 12px", fontSize: "12px", minHeight: "34px", textDecoration: "none" }}
          >
            + নতুন লেখা
          </Link>
          <button
            type="button"
            className="admin-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="মেনু খুলুন"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </header>

      {/* Mobile Off-Canvas Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="admin-mobile-drawer">
          <button
            className={`admin-nav-item ${activeTab === "overview" ? "selected" : ""}`}
            onClick={() => {
              setActiveTab("overview");
              setMobileMenuOpen(false);
            }}
          >
            <span className="nav-left">
              <span>▦</span> <span>ড্যাশবোর্ড ওভারভিউ</span>
            </span>
          </button>
          <Link href="/admin/posts" className="admin-nav-item" onClick={() => setMobileMenuOpen(false)}>
            <span className="nav-left">
              <span>▤</span> <span>সব লেখা ({formatBengaliNumber(posts.length)})</span>
            </span>
          </Link>
          <Link href="/admin/novels" className="admin-nav-item" onClick={() => setMobileMenuOpen(false)}>
            <span className="nav-left">
              <span>◫</span> <span>উপন্যাস ও পর্ব ({formatBengaliNumber(novels.length)})</span>
            </span>
          </Link>
          <button
            className={`admin-nav-item ${activeTab === "author" ? "selected" : ""}`}
            onClick={() => {
              setActiveTab("author");
              setMobileMenuOpen(false);
            }}
          >
            <span className="nav-left">
              <span>👤</span> <span>লেখিকার প্রোফাইল ও ছবি</span>
            </span>
          </button>
          <button
            className={`admin-nav-item ${activeTab === "media" ? "selected" : ""}`}
            onClick={() => {
              setActiveTab("media");
              setMobileMenuOpen(false);
            }}
          >
            <span className="nav-left">
              <span>🖼</span> <span>ছবি ও কভার গ্যালারি</span>
            </span>
          </button>
          <button
            className={`admin-nav-item ${activeTab === "comments" ? "selected" : ""}`}
            onClick={() => {
              setActiveTab("comments");
              setMobileMenuOpen(false);
            }}
          >
            <span className="nav-left">
              <span>◌</span> <span>পাঠকের মন্তব্য</span>
            </span>
            <span className="nav-count">{formatBengaliNumber(comments.length)}</span>
          </button>
          <button
            className={`admin-nav-item ${activeTab === "subscribers" ? "selected" : ""}`}
            onClick={() => {
              setActiveTab("subscribers");
              setMobileMenuOpen(false);
            }}
          >
            <span className="nav-left">
              <span>✉</span> <span>নিউজলেটার পাঠক</span>
            </span>
            <span className="nav-count">{formatBengaliNumber(subscribers.length)}</span>
          </button>
          <div className="nav-divider" />
          <button onClick={logout} className="logout">
            ↗ লগ আউট করুন
          </button>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="admin-side">
        <div className="brand">
          <span className="mark">আ</span>
          <div className="brand-title">
            <span>{profile.name}</span>
            <span className="brand-subtitle">Firebase ক্লাউড CMS</span>
          </div>
        </div>

        <nav>
          <button
            className={`admin-nav-item ${activeTab === "overview" ? "selected" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <span className="nav-left">
              <span>▦</span> <span>ড্যাশবোর্ড</span>
            </span>
          </button>

          <Link href="/admin/posts" className="admin-nav-item">
            <span className="nav-left">
              <span>▤</span> <span>সব লেখা</span>
            </span>
            <span className="nav-count">{formatBengaliNumber(posts.length)}</span>
          </Link>

          <Link href="/admin/posts/new" className="admin-nav-item">
            <span className="nav-left">
              <span>＋</span> <span>নতুন লেখা প্রকাশ</span>
            </span>
          </Link>

          <Link href="/admin/novels" className="admin-nav-item">
            <span className="nav-left">
              <span>◫</span> <span>উপন্যাস ও পর্ব</span>
            </span>
            <span className="nav-count">{formatBengaliNumber(novels.length)}</span>
          </Link>

          <button
            className={`admin-nav-item ${activeTab === "author" ? "selected" : ""}`}
            onClick={() => setActiveTab("author")}
          >
            <span className="nav-left">
              <span>👤</span> <span>লেখিকার প্রোফাইল ও ছবি</span>
            </span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === "media" ? "selected" : ""}`}
            onClick={() => setActiveTab("media")}
          >
            <span className="nav-left">
              <span>🖼</span> <span>ছবি ও কভার গ্যালারি</span>
            </span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === "comments" ? "selected" : ""}`}
            onClick={() => setActiveTab("comments")}
          >
            <span className="nav-left">
              <span>◌</span> <span>পাঠকের মন্তব্য</span>
            </span>
            <span className="nav-count">{formatBengaliNumber(comments.length)}</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === "subscribers" ? "selected" : ""}`}
            onClick={() => setActiveTab("subscribers")}
          >
            <span className="nav-left">
              <span>✉</span> <span>সাবস্ক্রাইবারগণ</span>
            </span>
            <span className="nav-count">{formatBengaliNumber(subscribers.length)}</span>
          </button>
        </nav>

        <div style={{ padding: "16px 14px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: "11px", color: "var(--adm-sidebar-muted)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }}></span>
            <span>Firestore ক্লাউড লাইভ</span>
          </div>
          <Link href="/" target="_blank" style={{ color: "#a7f3d0", textDecoration: "none", display: "block", marginBottom: "12px" }}>
            ওয়েবসাইট প্রিভিউ দেখুন ↗
          </Link>
          <button onClick={logout} className="logout" style={{ width: "100%", padding: "6px 10px", textAlign: "left" }}>
            ↗ লগ আউট
          </button>
        </div>
      </aside>

      {/* Admin Content Area */}
      <section className="admin-content">
        <header className="admin-top">
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 8px", background: "rgba(34,197,94,0.12)", color: "#15803d", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, marginBottom: "6px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e" }}></span>
              Firebase Firestore সংযুক্ত
            </div>
            <p className="eyebrow">WRITER CONTROL PANEL</p>
            <h1>
              স্বাগতম, <em>{profile.name}</em>
            </h1>
          </div>
          <div className="admin-top-actions">
            <Link className="admin-button" href="/admin/posts/new" style={{ textDecoration: "none" }}>
              + নতুন লেখা
            </Link>
            <Link className="admin-button" href="/admin/novels/new" style={{ background: "var(--adm-accent)", textDecoration: "none" }}>
              + নতুন উপন্যাস
            </Link>
          </div>
        </header>

        {/* Top Tab Bar for Mobile & Quick Navigation */}
        <div style={{ display: "flex", gap: "8px", margin: "20px 0 0", overflowX: "auto", paddingBottom: "4px" }}>
          <button
            type="button"
            className={`tone-choice-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            ▦ সার্বিক চিত্র
          </button>
          <button
            type="button"
            className={`tone-choice-btn ${activeTab === "author" ? "active" : ""}`}
            onClick={() => setActiveTab("author")}
          >
            👤 লেখিকার প্রোফাইল ও ছবি
          </button>
          <button
            type="button"
            className={`tone-choice-btn ${activeTab === "media" ? "active" : ""}`}
            onClick={() => setActiveTab("media")}
          >
            🖼 ছবি ও কভার গ্যালারি
          </button>
          <button
            type="button"
            className={`tone-choice-btn ${activeTab === "comments" ? "active" : ""}`}
            onClick={() => setActiveTab("comments")}
          >
            ◌ পাঠকের মন্তব্য ({formatBengaliNumber(comments.length)})
          </button>
          <button
            type="button"
            className={`tone-choice-btn ${activeTab === "subscribers" ? "active" : ""}`}
            onClick={() => setActiveTab("subscribers")}
          >
            ✉ সাবস্ক্রাইবারগণ ({formatBengaliNumber(subscribers.length)})
          </button>
        </div>

        {/* Stats Section */}
        <section className="stats">
          <article>
            <div className="stat-header">
              <p>মোট প্রকাশনা</p>
              <span className="stat-icon">✦</span>
            </div>
            <strong>{formatBengaliNumber(posts.length)}</strong>
            <small>গল্প, কবিতা ও দিনলিপি</small>
          </article>
          <article>
            <div className="stat-header">
              <p>উপন্যাস ও পর্ব</p>
              <span className="stat-icon">◫</span>
            </div>
            <strong>
              {formatBengaliNumber(novels.length)} / {formatBengaliNumber(totalEpisodes)}
            </strong>
            <small>ধারাবাহিক উপন্যাস ও পর্ব</small>
          </article>
          <article>
            <div className="stat-header">
              <p>মোট প্রতিক্রিয়া</p>
              <span className="stat-icon">♡</span>
            </div>
            <strong>{formatBengaliNumber(totalClaps)}</strong>
            <small>পাঠকদের ভালোবাসা ও ক্ল্যাপ</small>
          </article>
          <article>
            <div className="stat-header">
              <p>নিউজলেটার পাঠক</p>
              <span className="stat-icon">✉</span>
            </div>
            <strong>{formatBengaliNumber(subscribers.length)}</strong>
            <small>ইমেইল পাঠক পরিবার</small>
          </article>
        </section>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <section className="admin-grid">
            {/* Recent Writings */}
            <article className="recent">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">CONTENT & PHOTOS</p>
                  <h2>সাম্প্রতিক প্রকাশনা ও ছবি</h2>
                </div>
                <Link href="/admin/posts" style={{ fontSize: "13px", fontWeight: 600, color: "var(--adm-accent)", textDecoration: "none" }}>
                  সব লেখা দেখুন →
                </Link>
              </div>

              <div className="post-list">
                {posts.slice(0, 5).map((post) => (
                  <div className="admin-post" key={post.id} style={{ alignItems: "center" }}>
                    {post.coverUrl ? (
                      <img
                        src={post.coverUrl}
                        alt={post.title}
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "6px",
                          objectFit: "cover",
                          flexShrink: 0,
                          border: "1px solid var(--adm-line)",
                        }}
                      />
                    ) : (
                      <span className="post-art">
                        {post.type === "কবিতা" ? "❋" : post.type === "উপন্যাস" ? "◫" : "✦"}
                      </span>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 className="admin-post-title" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {post.title}
                      </h4>
                      <p className="admin-post-meta">
                        {post.type} · {post.date} · {formatBengaliNumber(post.claps || 0)} claps
                      </p>
                    </div>
                    <span className={`status ${post.status === "প্রকাশিত" ? "live" : "draft"}`}>
                      {post.status}
                    </span>
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      style={{
                        padding: "6px 10px",
                        fontSize: "12px",
                        color: "var(--adm-accent)",
                        textDecoration: "none",
                        fontWeight: 600,
                        border: "1px solid var(--adm-line)",
                        borderRadius: "6px",
                        background: "var(--adm-bg)",
                      }}
                      title="লেখা ও ছবি সম্পাদনা"
                    >
                      এডিট ও ছবি ✎
                    </Link>
                  </div>
                ))}
              </div>
            </article>

            {/* Serialized Novels Quick Action */}
            <article className="activity">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">SERIALIZED NOVELS</p>
                  <h2>উপন্যাস ও কভার ছবি</h2>
                </div>
                <Link href="/admin/novels" style={{ fontSize: "13px", fontWeight: 600, color: "var(--adm-accent)", textDecoration: "none" }}>
                  সকল উপন্যাস →
                </Link>
              </div>
              <p style={{ fontSize: "13px", lineHeight: "1.7", color: "var(--adm-muted)", margin: "0 0 16px" }}>
                উপন্যাসে পর্বভিত্তিক ধারাবাহিক গল্প সাজানো থাকে। যেকোনো উপন্যাসের কভার ছবি ও পর্ব এখান থেকে নিয়ন্ত্রণ করা যায়।
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {novels.map((novel) => (
                  <div
                    key={novel.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 14px",
                      background: "var(--adm-bg)",
                      border: "1px solid var(--adm-line)",
                      borderRadius: "var(--adm-radius)",
                      gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", minWidth: 0 }}>
                      {novel.coverUrl ? (
                        <img
                          src={novel.coverUrl}
                          alt={novel.title}
                          style={{ width: "36px", height: "48px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "36px",
                            height: "48px",
                            borderRadius: "4px",
                            background: "var(--adm-accent-light)",
                            color: "var(--adm-accent)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {novel.coverLetter || novel.title.charAt(0)}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ fontSize: "14px", color: "var(--adm-ink)", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {novel.title}
                        </strong>
                        <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--adm-muted)" }}>
                          {formatBengaliNumber(novel.episodes?.length || 0)}টি পর্ব · {novel.status}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                      <Link
                        href={`/admin/novels/${novel.id}/edit`}
                        className="admin-button secondary"
                        style={{ padding: "4px 8px", fontSize: "11px", minHeight: "28px", textDecoration: "none" }}
                      >
                        কভার ছবি ✎
                      </Link>
                      <Link
                        href={`/admin/novels/${novel.id}/episodes`}
                        className="admin-button"
                        style={{ padding: "4px 8px", fontSize: "11px", minHeight: "28px", textDecoration: "none" }}
                      >
                        পর্বসমূহ →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "18px" }}>
                <Link
                  className="admin-button"
                  href="/admin/novels/new"
                  style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}
                >
                  + নতুন উপন্যাস যোগ করুন →
                </Link>
              </div>
            </article>
          </section>
        )}

        {/* Tab 2: Author Profile & Picture */}
        {activeTab === "author" && (
          <article className="recent" style={{ maxWidth: "800px" }}>
            <div className="panel-head">
              <div>
                <p className="eyebrow">AUTHOR BRANDING & PROFILE</p>
                <h2>লেখিকার পরিচিতি ও প্রোফাইল ছবি</h2>
              </div>
            </div>
            <p style={{ fontSize: "14px", color: "var(--adm-muted)", margin: "0 0 20px", lineHeight: "1.6" }}>
              এখানে সংরক্ষিত নাম, পরিচিতি ও ছবি পুরো ওয়েবসাইটের হেডার, ফুটার এবং &apos;লেখিকা পরিচিতি&apos; পেজে স্বয়ংক্রিয়ভাবে প্রদর্শিত হয় এবং ফায়ারবেস ক্লাউডে তাৎক্ষণিক সিঙ্ক হয়।
            </p>

            {profileSaved && (
              <div className="save-toast" style={{ marginBottom: "20px" }}>
                ✓ লেখিকার প্রোফাইল ও ছবি সফলভাবে ফায়ারবেস ক্লাউডে সংরক্ষিত হয়েছে!
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="admin-form">
              {/* Profile Avatar Image Picker */}
              <ImagePicker
                value={profile.avatarUrl}
                onChange={(url) => setProfile({ ...profile, avatarUrl: url || "" })}
                presetType="avatars"
                aspectRatio="avatar"
                label="লেখিকার প্রোফাইল ছবি (Author Avatar/Photo)"
                hint="ডিভাইস থেকে নিজের ছবি আপলোড করুন, অনলাইন ছবির URL বসান অথবা নিচে দেওয়া স্টাইলিশ সাহিত্যিক পোর্ট্রেট থেকে পছন্দ করুন।"
              />

              <div className="form-grid">
                <label>
                  লেখিকার নাম (বাংলায়)
                  <input
                    required
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="যেমন: অহনা ইসলাম"
                  />
                </label>

                <label>
                  লেখিকার নাম (English)
                  <input
                    value={profile.englishName}
                    onChange={(e) => setProfile({ ...profile, englishName: e.target.value })}
                    placeholder="e.g. Ahona Islam"
                  />
                </label>
              </div>

              <div className="form-grid">
                <label>
                  প্রধান স্লোগান / ট্যাগলাইন
                  <input
                    value={profile.tagline}
                    onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                    placeholder="যেমন: কথা ও শব্দের নান্দনিক আঙিনা"
                  />
                </label>

                <label>
                  উপ-স্লোগান (Sub-tagline)
                  <input
                    value={profile.subTagline}
                    onChange={(e) => setProfile({ ...profile, subTagline: e.target.value })}
                    placeholder="যেমন: সমসাময়িক কথাসাহিত্য, গল্প ও মনস্তাত্ত্বিক উপন্যাস"
                  />
                </label>
              </div>

              <div className="form-grid">
                <label>
                  অবস্থান (Location)
                  <input
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="যেমন: ঢাকা, বাংলাদেশ"
                  />
                </label>

                <label>
                  যোগাযোগ ইমেইল (Contact Email)
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="e.g. contact@ahonaislam.com"
                  />
                </label>
              </div>

              <label>
                লেখিকার জীবন ও সাহিত্য ভাবনা (Biography)
                <textarea
                  rows={5}
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="আপনার সাহিত্য পরিচয়, লেখালেখির প্রেরণা ও পরিচিতি..."
                />
              </label>

              <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
                <button className="admin-button" type="submit" style={{ minWidth: "180px" }}>
                  প্রোফাইল আপডেট করুন
                </button>
                <Link href="/about" target="_blank" className="admin-button secondary" style={{ textDecoration: "none" }}>
                  পাবলিক &apos;পরিচিতি&apos; পেজ দেখুন ↗
                </Link>
              </div>
            </form>
          </article>
        )}

        {/* Tab 3: Media & Photos Library */}
        {activeTab === "media" && (
          <article className="recent">
            <div className="panel-head">
              <div>
                <p className="eyebrow">LITERARY MEDIA LIBRARY</p>
                <h2>নান্দনিক সাহিত্যিক ছবির সংগ্রহশালা</h2>
              </div>
              <span style={{ fontSize: "12px", color: "var(--adm-muted)" }}>
                এক ক্লিকে কপি করে যেকোনো লেখা বা উপন্যাসে ব্যবহার করুন
              </span>
            </div>

            {copiedUrl && (
              <div className="save-toast" style={{ marginBottom: "16px" }}>
                ✓ ছবির লিংক ক্লিপবোর্ডে কপি করা হয়েছে!
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {/* Novel Covers */}
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 12px", color: "var(--adm-ink)" }}>
                  📖 উপন্যাসের প্রিমিয়াম কভার আর্ট (Novel Covers)
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
                  {LITERARY_IMAGE_PRESETS.novelCovers.map((item) => (
                    <div
                      key={item.url}
                      style={{
                        background: "var(--adm-surface)",
                        border: "1px solid var(--adm-line)",
                        borderRadius: "8px",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={item.url}
                        alt={item.label}
                        style={{ width: "100%", height: "130px", objectFit: "cover" }}
                      />
                      <div style={{ padding: "10px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--adm-ink)", marginBottom: "8px" }}>
                          {item.label}
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.url)}
                          className="admin-button secondary"
                          style={{ width: "100%", fontSize: "11px", padding: "4px 8px", minHeight: "28px" }}
                        >
                          {copiedUrl === item.url ? "✓ কপি হয়েছে" : "লিংক কপি করুন"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Post Covers */}
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 12px", color: "var(--adm-ink)" }}>
                  ✍️ গল্প ও কবিতার আবহ ছবি (Atmospheric Backgrounds)
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                  {LITERARY_IMAGE_PRESETS.postCovers.map((item) => (
                    <div
                      key={item.url}
                      style={{
                        background: "var(--adm-surface)",
                        border: "1px solid var(--adm-line)",
                        borderRadius: "8px",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={item.url}
                        alt={item.label}
                        style={{ width: "100%", height: "110px", objectFit: "cover" }}
                      />
                      <div style={{ padding: "10px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--adm-ink)", marginBottom: "8px" }}>
                          {item.label}
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.url)}
                          className="admin-button secondary"
                          style={{ width: "100%", fontSize: "11px", padding: "4px 8px", minHeight: "28px" }}
                        >
                          {copiedUrl === item.url ? "✓ কপি হয়েছে" : "লিংক কপি করুন"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Author Portraits */}
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 12px", color: "var(--adm-ink)" }}>
                  👤 লেখিকার পোর্ট্রেট ছবি (Writer Portraits)
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "16px" }}>
                  {LITERARY_IMAGE_PRESETS.avatars.map((item) => (
                    <div
                      key={item.url}
                      style={{
                        background: "var(--adm-surface)",
                        border: "1px solid var(--adm-line)",
                        borderRadius: "8px",
                        padding: "12px",
                        textAlign: "center",
                      }}
                    >
                      <img
                        src={item.url}
                        alt={item.label}
                        style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", margin: "0 auto 8px" }}
                      />
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--adm-ink)", marginBottom: "8px" }}>
                        {item.label}
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.url)}
                        className="admin-button secondary"
                        style={{ width: "100%", fontSize: "11px", padding: "4px 8px", minHeight: "28px" }}
                      >
                        {copiedUrl === item.url ? "✓ কপি হয়েছে" : "লিংক কপি করুন"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>
        )}

        {/* Tab 4: Comments Moderation */}
        {activeTab === "comments" && (
          <article className="recent">
            <div className="panel-head">
              <div>
                <p className="eyebrow">MODERATION</p>
                <h2>পাঠকের মন্তব্য ও চিঠিপত্র</h2>
              </div>
              <span style={{ fontSize: "12px", color: "var(--adm-muted)" }}>
                মোট {formatBengaliNumber(comments.length)}টি মন্তব্য
              </span>
            </div>

            <div className="post-list">
              {comments.length === 0 ? (
                <div style={{ padding: "32px", color: "var(--adm-muted)", textAlign: "center" }}>
                  এখনও কোনো পাঠক মন্তব্য জমা পড়েনি।
                </div>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: "16px",
                      border: "1px solid var(--adm-line)",
                      borderRadius: "var(--adm-radius)",
                      background: "var(--adm-bg)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <strong style={{ fontSize: "15px", color: "var(--adm-ink)" }}>{c.authorName}</strong>
                        <span style={{ fontSize: "11px", color: "var(--adm-muted)", marginLeft: "8px" }}>
                          (লেখা: {c.targetTitle || "চিঠিপত্র"}) · {c.date}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="admin-button danger"
                        style={{ padding: "4px 10px", fontSize: "11px", minHeight: "30px" }}
                      >
                        মুছুন
                      </button>
                    </div>
                    <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.7", color: "var(--adm-ink)" }}>
                      {c.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>
        )}

        {/* Tab 5: Newsletter Subscribers */}
        {activeTab === "subscribers" && (
          <article className="recent">
            <div className="panel-head">
              <div>
                <p className="eyebrow">NEWSLETTER</p>
                <h2>নিউজলেটার পাঠক পরিবার</h2>
              </div>
              <span style={{ fontSize: "12px", color: "var(--adm-accent)", fontWeight: 600 }}>
                মোট {formatBengaliNumber(subscribers.length)} জন গ্রাহক
              </span>
            </div>

            <div className="post-list">
              {subscribers.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: "var(--adm-muted)" }}>
                  এখনও কোনো সাবস্ক্রাইবার যুক্ত হননি।
                </div>
              ) : (
                subscribers.map((sub) => (
                  <div
                    key={sub.id}
                    style={{
                      padding: "12px 16px",
                      border: "1px solid var(--adm-line)",
                      borderRadius: "var(--adm-radius)",
                      background: "var(--adm-bg)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "14px", color: "var(--adm-ink)" }}>{sub.email}</strong>
                      <span style={{ fontSize: "11px", color: "var(--adm-muted)", marginLeft: "8px" }}>
                        · {sub.date}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                      className="admin-button danger"
                      style={{ padding: "4px 10px", fontSize: "11px", minHeight: "28px" }}
                      title="তালিকা থেকে বাদ দিন"
                    >
                      বাদ দিন
                    </button>
                  </div>
                ))
              )}
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
