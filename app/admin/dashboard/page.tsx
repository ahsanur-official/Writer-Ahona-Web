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
  getRatings,
  deleteComment,
  deleteSubscriber,
  deleteRating,
  getAuthorProfile,
  saveAuthorProfile,
  formatBengaliNumber,
  LITERARY_IMAGE_PRESETS,
  Post,
  Novel,
  ReaderComment,
  Subscriber,
  ItemRating,
  AuthorProfile,
  countWordsWithoutSpace,
  countCharacters,
  countSentences,
  countParagraphs,
  countUniqueWords,
  MAX_WORDS_LIMIT,
} from "@/lib/store";
import ImagePicker from "@/components/ImagePicker";
import SpellingCheckerWidget from "@/components/SpellingCheckerWidget";
import ConfirmDialog from "@/components/ConfirmDialog";

type AdminTab = "overview" | "wordcounter" | "spelling" | "ratings" | "comments" | "subscribers" | "author" | "media";

export default function Dashboard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [novels, setNovels] = useState<Novel[]>([]);
  const [comments, setComments] = useState<ReaderComment[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [ratings, setRatings] = useState<ItemRating[]>([]);
  const [ratingCategoryFilter, setRatingCategoryFilter] = useState<string>("all");
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
    location: "জয়পুরহাট, বাংলাদেশ",
    email: "contact@ahonaislam.com",
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Writer Word Counter States
  const [liveDraftText, setLiveDraftText] = useState("");
  const [wordGoal, setWordGoal] = useState<number>(1000);
  const [wordCopied, setWordCopied] = useState(false);

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
    setRatings(getRatings());
    setProfile(getAuthorProfile());
  };

  const logout = () => {
    localStorage.removeItem("ahona-admin");
    window.location.assign("/admin/login");
  };

  const handleDeleteRating = (id: string, readerName: string) => {
    setConfirmState({
      isOpen: true,
      title: "রেটিং মুছে ফেলবেন?",
      message: "এই রেটিং ও মন্তব্যটি সামগ্রিক পরিসংখ্যান ও তালিকা থেকে স্থায়ীভাবে মুছে ফেলা হবে।",
      itemTitle: `পাঠক: ${readerName}`,
      onConfirm: () => {
        deleteRating(id);
        setRatings(getRatings());
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleDeleteComment = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: "মন্তব্য মুছে ফেলবেন?",
      message: "আপনি কি নিশ্চিত এই মন্তব্যটি প্ল্যাটফর্ম থেকে স্থায়ীভাবে মুছে ফেলতে চান?",
      onConfirm: () => {
        deleteComment(id);
        setComments(getComments());
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleDeleteSubscriber = (id: string, email: string) => {
    setConfirmState({
      isOpen: true,
      title: "গ্রাহক মুছে ফেলবেন?",
      message: "এই ইমেইল ঠিকানাটি পাঠক পরিবার ও নিউজলেটার তালিকা থেকে সরিয়ে দেওয়া হবে।",
      itemTitle: email,
      onConfirm: () => {
        deleteSubscriber(id);
        setSubscribers(getSubscribers());
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
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

  const handleTransferToNewPost = (text: string) => {
    if (!text.trim()) return;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("ahona_draft_text", text);
    }
    router.push("/admin/posts/new");
  };

  const handleCopyDraftText = (text: string) => {
    if (!text.trim()) return;
    navigator.clipboard.writeText(text);
    setWordCopied(true);
    setTimeout(() => setWordCopied(false), 2500);
  };

  if (!ready) return <main className="admin-loading">লোড হচ্ছে...</main>;

  const totalEpisodes = novels.reduce((acc, n) => acc + (n.episodes?.length || 0), 0);
  const totalClaps = posts.reduce((acc, p) => acc + (p.claps || 0), 0);
  const totalWordsInPosts = posts.reduce((acc, p) => acc + countWordsWithoutSpace(p.body || ""), 0);
  const totalWordsInNovels = novels.reduce(
    (acc, n) => acc + (n.episodes?.reduce((eAcc, ep) => eAcc + countWordsWithoutSpace(ep.content || ""), 0) || 0),
    0
  );
  const totalWordsCount = totalWordsInPosts + totalWordsInNovels;

  // Live draft metrics
  const liveWordCount = countWordsWithoutSpace(liveDraftText);
  const liveCharsWithSpace = countCharacters(liveDraftText, false);
  const liveCharsNoSpace = countCharacters(liveDraftText, true);
  const liveSentences = countSentences(liveDraftText);
  const liveParagraphs = countParagraphs(liveDraftText);
  const liveUniqueWords = countUniqueWords(liveDraftText);
  const liveReadTimeMinutes = Math.max(1, Math.ceil(liveWordCount / 130));
  const liveSpeechTimeMinutes = Math.max(1, Math.ceil(liveWordCount / 100));
  const goalProgressPercent = Math.min(100, Math.round((liveWordCount / wordGoal) * 100));
  const isOverWordLimit = liveWordCount > MAX_WORDS_LIMIT;

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
            className={`admin-nav-item ${activeTab === "wordcounter" ? "selected" : ""}`}
            onClick={() => {
              setActiveTab("wordcounter");
              setMobileMenuOpen(false);
            }}
          >
            <span className="nav-left">
              <span>📝</span> <span>শব্দ গণক ও রাইটার হাব</span>
            </span>
            <span className="nav-count">{formatBengaliNumber(totalWordsCount)}</span>
          </button>
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
            className={`admin-nav-item ${activeTab === "ratings" ? "selected" : ""}`}
            onClick={() => {
              setActiveTab("ratings");
              setMobileMenuOpen(false);
            }}
          >
            <span className="nav-left">
              <span>⭐</span> <span>পাঠকের রেটিং</span>
            </span>
            <span className="nav-count">{formatBengaliNumber(ratings.length)}</span>
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
            className={`admin-nav-item ${activeTab === "wordcounter" ? "selected" : ""}`}
            onClick={() => setActiveTab("wordcounter")}
          >
            <span className="nav-left">
              <span>📝</span> <span>শব্দ গণক হাব</span>
            </span>
            <span className="nav-count">{formatBengaliNumber(totalWordsCount)}</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === "spelling" ? "selected" : ""}`}
            onClick={() => setActiveTab("spelling")}
          >
            <span className="nav-left">
              <span>🔍</span> <span>বানান পরীক্ষক (বাংলা ও ইংরেজি)</span>
            </span>
          </button>

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
            className={`admin-nav-item ${activeTab === "ratings" ? "selected" : ""}`}
            onClick={() => setActiveTab("ratings")}
          >
            <span className="nav-left">
              <span>⭐</span> <span>পাঠকের রেটিং</span>
            </span>
            <span className="nav-count">{formatBengaliNumber(ratings.length)}</span>
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
            className={`tone-choice-btn ${activeTab === "wordcounter" ? "active" : ""}`}
            onClick={() => setActiveTab("wordcounter")}
          >
            📝 শব্দ গণক ও রাইটার হাব
          </button>
          <button
            type="button"
            className={`tone-choice-btn ${activeTab === "spelling" ? "active" : ""}`}
            onClick={() => setActiveTab("spelling")}
          >
            🔍 বানান পরীক্ষক (বাংলা ও ইংরেজি)
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
            className={`tone-choice-btn ${activeTab === "ratings" ? "active" : ""}`}
            onClick={() => setActiveTab("ratings")}
          >
            ⭐ পাঠকদের রেটিং ({formatBengaliNumber(ratings.length)})
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
              <p>মোট রচিত শব্দ</p>
              <span className="stat-icon">✍</span>
            </div>
            <strong>{formatBengaliNumber(totalWordsCount)}</strong>
            <small>ছোটগল্প ও উপন্যাসের সমষ্টি</small>
          </article>
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
              <p>পাঠকদের রেটিং</p>
              <span className="stat-icon" style={{ color: "#eab308" }}>★</span>
            </div>
            <strong>
              {ratings.length > 0
                ? `${formatBengaliNumber((ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(1))} ★`
                : "০ ★"}
            </strong>
            <small>মোট {formatBengaliNumber(ratings.length)} জন পাঠকের মূল্যায়ন</small>
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

            {/* Quick Word Counter Widget in Overview */}
            <article className="recent" style={{ gridColumn: "1 / -1" }}>
              <div className="panel-head">
                <div>
                  <p className="eyebrow">LIVE WRITER HUB</p>
                  <h2>তাৎক্ষণিক শব্দ গণক ও ড্রাফটিং প্যাড</h2>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  {liveDraftText.trim() && (
                    <button
                      type="button"
                      onClick={() => setLiveDraftText("")}
                      className="admin-button secondary"
                      style={{ padding: "4px 10px", fontSize: "11px", minHeight: "30px", color: "var(--adm-danger)" }}
                    >
                      মুছে ফেলুন
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopyDraftText(liveDraftText)}
                    disabled={!liveDraftText.trim()}
                    className="admin-button secondary"
                    style={{ padding: "4px 10px", fontSize: "11px", minHeight: "30px" }}
                  >
                    {wordCopied ? "✓ কপি হয়েছে" : "কপি করুন"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTransferToNewPost(liveDraftText)}
                    disabled={!liveDraftText.trim()}
                    className="admin-button"
                    style={{ padding: "4px 12px", fontSize: "11px", minHeight: "30px" }}
                  >
                    নতুন পোস্টে পাঠান →
                  </button>
                </div>
              </div>

              <p style={{ fontSize: "13px", lineHeight: "1.6", color: "var(--adm-muted)", margin: "0 0 12px" }}>
                এখানে যেকোনো গল্পের খসড়া লিখুন বা পেস্ট করুন। স্বয়ংক্রিয়ভাবে রিয়েল-টাইম শব্দ সংখ্যা, অক্ষর ও পড়ার সময় হিসাব করা হবে।
              </p>

              {/* Quick Metrics Strip */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "10px",
                  marginBottom: "12px",
                }}
              >
                <div style={{ padding: "10px 14px", background: "var(--adm-bg)", border: "1px solid var(--adm-line)", borderRadius: "var(--adm-radius)" }}>
                  <span style={{ fontSize: "11px", color: "var(--adm-muted)", display: "block" }}>মোট শব্দ</span>
                  <strong style={{ fontSize: "18px", color: isOverWordLimit ? "#dc2626" : "var(--adm-accent)" }}>
                    {formatBengaliNumber(liveWordCount)}
                  </strong>
                  <span style={{ fontSize: "10px", color: "var(--adm-muted)", display: "block" }}>সর্বোচ্চ ৬,০০০ সীমা</span>
                </div>
                <div style={{ padding: "10px 14px", background: "var(--adm-bg)", border: "1px solid var(--adm-line)", borderRadius: "var(--adm-radius)" }}>
                  <span style={{ fontSize: "11px", color: "var(--adm-muted)", display: "block" }}>অক্ষর (স্পেস সহ/ছাড়া)</span>
                  <strong style={{ fontSize: "16px", color: "var(--adm-ink)" }}>
                    {formatBengaliNumber(liveCharsWithSpace)} / {formatBengaliNumber(liveCharsNoSpace)}
                  </strong>
                  <span style={{ fontSize: "10px", color: "var(--adm-muted)", display: "block" }}>বাংলা বর্ণ ও চিহ্ন</span>
                </div>
                <div style={{ padding: "10px 14px", background: "var(--adm-bg)", border: "1px solid var(--adm-line)", borderRadius: "var(--adm-radius)" }}>
                  <span style={{ fontSize: "11px", color: "var(--adm-muted)", display: "block" }}>বাক্য ও অনুচ্ছেদ</span>
                  <strong style={{ fontSize: "16px", color: "var(--adm-ink)" }}>
                    {formatBengaliNumber(liveSentences)} বাক্য · {formatBengaliNumber(liveParagraphs)} প্যারা
                  </strong>
                  <span style={{ fontSize: "10px", color: "var(--adm-muted)", display: "block" }}>গঠন বিন্যাস</span>
                </div>
                <div style={{ padding: "10px 14px", background: "var(--adm-bg)", border: "1px solid var(--adm-line)", borderRadius: "var(--adm-radius)" }}>
                  <span style={{ fontSize: "11px", color: "var(--adm-muted)", display: "block" }}>পাঠের সময়</span>
                  <strong style={{ fontSize: "16px", color: "var(--adm-ink)" }}>
                    প্রায় {formatBengaliNumber(liveReadTimeMinutes)} মিনিট
                  </strong>
                  <span style={{ fontSize: "10px", color: "var(--adm-muted)", display: "block" }}>নীরব পাঠের গতিতে</span>
                </div>
              </div>

              {/* Textarea */}
              <textarea
                value={liveDraftText}
                onChange={(e) => setLiveDraftText(e.target.value)}
                placeholder="এখানে আপনার নতুন গল্প, কবিতা বা উপন্যাসের খসড়া লিখুন বা পেস্ট করুন... রিয়েল-টাইম শব্দ গণনা শুরু হবে..."
                rows={5}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: "14px",
                  lineHeight: "1.7",
                  borderRadius: "var(--adm-radius)",
                  border: isOverWordLimit ? "1.5px solid #dc2626" : "1px solid var(--adm-line)",
                  background: "var(--adm-card)",
                  color: "var(--adm-ink)",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                <span style={{ fontSize: "12px", color: isOverWordLimit ? "#dc2626" : "var(--adm-muted)" }}>
                  {isOverWordLimit
                    ? `⚠️ লেখাটি নির্ধারিত সীমা ছাড়িয়েছে (${formatBengaliNumber(liveWordCount)} / ৬,০০০ শব্দ)!`
                    : `বর্তমান অগ্রগতি: ${formatBengaliNumber(liveWordCount)} / ৬,০০০ শব্দ`}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("wordcounter")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--adm-accent)",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  সম্পূর্ণ রাইটার হাব ও শব্দ বিশ্লেষণ খুলুন ↗
                </button>
              </div>
            </article>
          </section>
        )}

        {/* Tab: Dedicated Writer Word Counter Hub */}
        {activeTab === "wordcounter" && (
          <article className="recent" style={{ maxWidth: "1000px" }}>
            <div className="panel-head">
              <div>
                <p className="eyebrow">WRITER STUDIO & WORD ANALYTICS HUB</p>
                <h2>শব্দ গণক ও রাইটার হাব</h2>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => handleCopyDraftText(liveDraftText)}
                  disabled={!liveDraftText.trim()}
                  className="admin-button secondary"
                  style={{ padding: "6px 12px", fontSize: "12px", minHeight: "32px" }}
                >
                  {wordCopied ? "✓ কপি হয়েছে" : "কপি করুন"}
                </button>
                <button
                  type="button"
                  onClick={() => setLiveDraftText("")}
                  disabled={!liveDraftText.trim()}
                  className="admin-button danger"
                  style={{ padding: "6px 12px", fontSize: "12px", minHeight: "32px" }}
                >
                  মুছুন
                </button>
                <button
                  type="button"
                  onClick={() => handleTransferToNewPost(liveDraftText)}
                  disabled={!liveDraftText.trim()}
                  className="admin-button"
                  style={{ padding: "6px 14px", fontSize: "12px", minHeight: "32px" }}
                >
                  নতুন প্রকাশনায় ড্রাফট পাঠান →
                </button>
              </div>
            </div>

            <p style={{ fontSize: "14px", color: "var(--adm-muted)", margin: "0 0 20px", lineHeight: "1.7" }}>
              লেখার গভীরতা, শব্দসীমা ও সাহিত্যিক মেট্রিক্স পরিমাপের ডেডিকেটেড রাইটার হাব। এখানে লিখলে শব্দ গণনা স্বয়ংক্রিয়ভাবে কার্যকর হয় এবং এক ক্লিকে নতুন গল্প বা উপন্যাস হিসেবে সরাসরি প্রকাশনার ড্রাফটে পাঠানো যায়।
            </p>

            {wordCopied && (
              <div className="save-toast" style={{ marginBottom: "16px" }}>
                ✓ খসড়া লেখা সফলভাবে ক্লিপবোর্ডে কপি করা হয়েছে!
              </div>
            )}

            {/* Word Goal Selector */}
            <div
              style={{
                padding: "16px 18px",
                background: "var(--adm-bg)",
                border: "1px solid var(--adm-line)",
                borderRadius: "var(--adm-radius)",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
                <div>
                  <strong style={{ fontSize: "14px", color: "var(--adm-ink)", display: "block" }}>
                    লেখার লক্ষ্যমাত্রা (Word Goal Target)
                  </strong>
                  <span style={{ fontSize: "12px", color: "var(--adm-muted)" }}>
                    বর্তমান লক্ষ্য: {formatBengaliNumber(wordGoal)} শব্দ · অর্জন: {formatBengaliNumber(goalProgressPercent)}%
                  </span>
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {[500, 1000, 2000, 4000, 6000].map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => setWordGoal(goal)}
                      style={{
                        padding: "4px 10px",
                        fontSize: "12px",
                        borderRadius: "16px",
                        border: "1px solid var(--adm-line)",
                        background: wordGoal === goal ? "var(--adm-accent)" : "var(--adm-card)",
                        color: wordGoal === goal ? "#fff" : "var(--adm-ink)",
                        cursor: "pointer",
                        fontWeight: wordGoal === goal ? 600 : 400,
                        transition: "all 0.2s ease",
                      }}
                    >
                      {formatBengaliNumber(goal)} শব্দ
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress Bar */}
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  background: "rgba(0,0,0,0.06)",
                  borderRadius: "9999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${goalProgressPercent}%`,
                    background: isOverWordLimit
                      ? "#dc2626"
                      : goalProgressPercent >= 100
                      ? "#15803d"
                      : "var(--adm-accent)",
                    borderRadius: "9999px",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>

            {/* Main Focus Writing Textarea */}
            <div style={{ marginBottom: "20px" }}>
              <textarea
                value={liveDraftText}
                onChange={(e) => setLiveDraftText(e.target.value)}
                placeholder="এখানে আপনার নতুন গল্প, উপন্যাস বা কবিতার অনুচ্ছেদ লিখুন বা পেস্ট করুন... প্রতিটি শব্দ তাৎক্ষণিকভাবে পরিমাপ করা হচ্ছে..."
                rows={12}
                style={{
                  width: "100%",
                  padding: "16px 18px",
                  fontSize: "15px",
                  lineHeight: "1.8",
                  borderRadius: "var(--adm-radius)",
                  border: isOverWordLimit ? "2px solid #dc2626" : "1px solid var(--adm-line)",
                  background: "var(--adm-card)",
                  color: "var(--adm-ink)",
                  resize: "vertical",
                  fontFamily: "inherit",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.03)",
                }}
              />
            </div>

            {/* 6-Card Detailed Linguistic Metrics Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "12px",
                marginBottom: "28px",
              }}
            >
              <div style={{ padding: "14px", background: "var(--adm-bg)", border: "1px solid var(--adm-line)", borderRadius: "var(--adm-radius)" }}>
                <span style={{ fontSize: "11px", color: "var(--adm-muted)", display: "block", marginBottom: "4px" }}>
                  মোট শব্দ (Words)
                </span>
                <strong style={{ fontSize: "22px", color: isOverWordLimit ? "#dc2626" : "var(--adm-accent)", display: "block" }}>
                  {formatBengaliNumber(liveWordCount)}
                </strong>
                <span style={{ fontSize: "11px", color: isOverWordLimit ? "#dc2626" : "var(--adm-muted)" }}>
                  {isOverWordLimit ? "⚠️ সীমা অতিক্রান্ত!" : `সর্বোচ্চ ৬,০০০ শব্দের মধ্যে`}
                </span>
              </div>

              <div style={{ padding: "14px", background: "var(--adm-bg)", border: "1px solid var(--adm-line)", borderRadius: "var(--adm-radius)" }}>
                <span style={{ fontSize: "11px", color: "var(--adm-muted)", display: "block", marginBottom: "4px" }}>
                  অক্ষর (Characters)
                </span>
                <strong style={{ fontSize: "20px", color: "var(--adm-ink)", display: "block" }}>
                  {formatBengaliNumber(liveCharsWithSpace)}
                </strong>
                <span style={{ fontSize: "11px", color: "var(--adm-muted)" }}>
                  স্পেস ছাড়া: {formatBengaliNumber(liveCharsNoSpace)}
                </span>
              </div>

              <div style={{ padding: "14px", background: "var(--adm-bg)", border: "1px solid var(--adm-line)", borderRadius: "var(--adm-radius)" }}>
                <span style={{ fontSize: "11px", color: "var(--adm-muted)", display: "block", marginBottom: "4px" }}>
                  বাক্য ও অনুচ্ছেদ
                </span>
                <strong style={{ fontSize: "20px", color: "var(--adm-ink)", display: "block" }}>
                  {formatBengaliNumber(liveSentences)}
                </strong>
                <span style={{ fontSize: "11px", color: "var(--adm-muted)" }}>
                  {formatBengaliNumber(liveParagraphs)}টি অনুচ্ছেদ
                </span>
              </div>

              <div style={{ padding: "14px", background: "var(--adm-bg)", border: "1px solid var(--adm-line)", borderRadius: "var(--adm-radius)" }}>
                <span style={{ fontSize: "11px", color: "var(--adm-muted)", display: "block", marginBottom: "4px" }}>
                  অনন্য শব্দভাণ্ডার
                </span>
                <strong style={{ fontSize: "20px", color: "var(--adm-ink)", display: "block" }}>
                  {formatBengaliNumber(liveUniqueWords)}
                </strong>
                <span style={{ fontSize: "11px", color: "var(--adm-muted)" }}>
                  স্বতন্ত্র বাংলা শব্দ
                </span>
              </div>

              <div style={{ padding: "14px", background: "var(--adm-bg)", border: "1px solid var(--adm-line)", borderRadius: "var(--adm-radius)" }}>
                <span style={{ fontSize: "11px", color: "var(--adm-muted)", display: "block", marginBottom: "4px" }}>
                  নীরব পাঠের সময়
                </span>
                <strong style={{ fontSize: "20px", color: "var(--adm-ink)", display: "block" }}>
                  ~{formatBengaliNumber(liveReadTimeMinutes)} মিনিট
                </strong>
                <span style={{ fontSize: "11px", color: "var(--adm-muted)" }}>
                  ১৩০ শব্দ/মিনিট
                </span>
              </div>

              <div style={{ padding: "14px", background: "var(--adm-bg)", border: "1px solid var(--adm-line)", borderRadius: "var(--adm-radius)" }}>
                <span style={{ fontSize: "11px", color: "var(--adm-muted)", display: "block", marginBottom: "4px" }}>
                  আবৃত্তি ও বক্তব্য সময়
                </span>
                <strong style={{ fontSize: "20px", color: "var(--adm-ink)", display: "block" }}>
                  ~{formatBengaliNumber(liveSpeechTimeMinutes)} মিনিট
                </strong>
                <span style={{ fontSize: "11px", color: "var(--adm-muted)" }}>
                  ১০০ শব্দ/মিনিট
                </span>
              </div>
            </div>

            {/* Live Bangla & English Spelling Checker for live draft */}
            <div style={{ marginBottom: "28px" }}>
              <SpellingCheckerWidget
                text={liveDraftText}
                onTextChange={(newText) => setLiveDraftText(newText)}
                onTransferToPost={handleTransferToNewPost}
                showTransferButton={true}
              />
            </div>

            {/* Published Content Word Count Audit Table */}
            <div style={{ borderTop: "1px solid var(--adm-line)", paddingTop: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", color: "var(--adm-ink)" }}>
                    প্রকাশিত সাহিত্যকর্মের শব্দ সংখ্যা নিরীক্ষা (Word Count Audit)
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--adm-muted)" }}>
                    আপনার ব্লগে প্রকাশিত সকল ছোটগল্প, কবিতা ও উপন্যাসের শব্দের বিস্তারিত হিসাব
                  </p>
                </div>
                <span
                  style={{
                    padding: "4px 10px",
                    background: "var(--adm-accent-light)",
                    color: "var(--adm-accent)",
                    borderRadius: "16px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  সর্বমোট: {formatBengaliNumber(totalWordsCount)} শব্দ
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {posts.map((post) => {
                  const postWords = countWordsWithoutSpace(post.body || "");
                  const postChars = countCharacters(post.body || "", false);
                  return (
                    <div
                      key={post.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 14px",
                        background: "var(--adm-bg)",
                        border: "1px solid var(--adm-line)",
                        borderRadius: "var(--adm-radius)",
                        gap: "12px",
                      }}
                    >
                      <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            background: "var(--adm-card)",
                            color: "var(--adm-muted)",
                            border: "1px solid var(--adm-line)",
                            flexShrink: 0,
                          }}
                        >
                          {post.type}
                        </span>
                        <strong style={{ fontSize: "14px", color: "var(--adm-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {post.title}
                        </strong>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                            padding: "3px 8px",
                            background: "rgba(180, 83, 9, 0.08)",
                            color: "#b45309",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          ✍ {formatBengaliNumber(postWords)} শব্দ
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--adm-muted)", display: "none" }} className="md:inline">
                          {formatBengaliNumber(postChars)} অক্ষর
                        </span>
                        <Link
                          href={`/admin/posts/${post.id}/edit`}
                          className="admin-button secondary"
                          style={{ padding: "3px 8px", fontSize: "11px", minHeight: "26px", textDecoration: "none" }}
                        >
                          সম্পাদনা ✎
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>
        )}

        {/* Tab: Dedicated Writer Spelling Checker Studio */}
        {activeTab === "spelling" && (
          <article className="recent" style={{ maxWidth: "1000px" }}>
            <div className="panel-head">
              <div>
                <p className="eyebrow">BANGLA ACADEMY & ENGLISH GRAMMAR ENGINE</p>
                <h2>বাংলা ও ইংরেজি বানান পরীক্ষক স্টুডিও</h2>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                {liveDraftText.trim() && (
                  <button
                    type="button"
                    onClick={() => setLiveDraftText("")}
                    className="admin-button secondary"
                    style={{ padding: "6px 12px", fontSize: "12px", minHeight: "32px", color: "var(--adm-danger)" }}
                  >
                    🗑 লেখা মুছুন
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleTransferToNewPost(liveDraftText)}
                  disabled={!liveDraftText.trim()}
                  className="admin-button"
                  style={{ padding: "6px 14px", fontSize: "12px", minHeight: "32px" }}
                >
                  সংশোধিত লেখা নতুন পোস্টে পাঠান →
                </button>
              </div>
            </div>

            <p style={{ fontSize: "14px", color: "var(--adm-muted)", margin: "0 0 20px", lineHeight: "1.7" }}>
              বাংলা একাডেমি প্রমিত বানানরীতি (ই-কার, ঈ-কার, মূর্ধন্য-ষ, ন-ত্ব/ষ-ত্ব বিধান, রেফ-দ্বিত্ব বর্জন) এবং ইংরেজি ব্যাকরণ অনুযায়ী স্বয়ংক্রিয় বানান নিরীক্ষা ও সংশোধন ইঞ্জিন। যেকোনো টেক্সট এখানে সরাসরি সম্পাদনা, পরীক্ষা ও সংশোধন করা যায়।
            </p>

            {/* Editable Textarea for testing and writing */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", alignItems: "center" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--adm-ink)" }}>
                  পরীক্ষাধীন রচনা / খসড়া অনুচ্ছেদ
                </label>
                <span style={{ fontSize: "12px", color: "var(--adm-muted)" }}>
                  শব্দ সংখ্যা: {formatBengaliNumber(liveWordCount)}
                </span>
              </div>
              <textarea
                value={liveDraftText}
                onChange={(e) => setLiveDraftText(e.target.value)}
                placeholder="এখানে আপনার যে কোনো বাংলা বা ইংরেজি লেখা লিখুন বা পেস্ট করুন... প্রতিটি বানান তাৎক্ষণিকভাবে যাচাই করা হবে..."
                rows={10}
                style={{
                  width: "100%",
                  padding: "16px 18px",
                  fontSize: "15px",
                  lineHeight: "1.8",
                  borderRadius: "var(--adm-radius)",
                  border: "1px solid var(--adm-line)",
                  background: "var(--adm-card)",
                  color: "var(--adm-ink)",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <SpellingCheckerWidget
              text={liveDraftText}
              onTextChange={(newText) => setLiveDraftText(newText)}
              onTransferToPost={handleTransferToNewPost}
              showTransferButton={true}
            />
          </article>
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

        {/* Tab: Reader Ratings & Reviews */}
        {activeTab === "ratings" && (
          <article className="recent">
            <div className="panel-head">
              <div>
                <p className="eyebrow">READER REVIEWS & RATINGS</p>
                <h2>পাঠকদের রেটিং ও মূল্যায়ন</h2>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--adm-accent)" }}>
                  মোট {formatBengaliNumber(ratings.length)}টি রেটিং
                </span>
                {ratings.length > 0 && (
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "16px",
                      background: "rgba(202, 168, 105, 0.15)",
                      color: "#b45309",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    গড়: {formatBengaliNumber((ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(1))} ★
                  </span>
                )}
              </div>
            </div>

            {/* Filter buttons */}
            <div style={{ display: "flex", gap: "8px", margin: "16px 0", flexWrap: "wrap" }}>
              {[
                { label: "সকল রেটিং", val: "all" },
                { label: "ছোটগল্প", val: "ছোটগল্প" },
                { label: "কবিতা", val: "কবিতা" },
                { label: "উপন্যাস পর্ব", val: "উপন্যাস পর্ব" },
              ].map((f) => (
                <button
                  key={f.val}
                  type="button"
                  onClick={() => setRatingCategoryFilter(f.val)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "16px",
                    border: "1px solid var(--adm-line)",
                    background: ratingCategoryFilter === f.val ? "var(--adm-accent)" : "var(--adm-card)",
                    color: ratingCategoryFilter === f.val ? "#ffffff" : "var(--adm-ink)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="post-list">
              {(() => {
                const filteredRatings = ratings.filter((r) => {
                  if (ratingCategoryFilter === "all") return true;
                  return r.targetType === ratingCategoryFilter;
                });

                if (filteredRatings.length === 0) {
                  return (
                    <div style={{ padding: "40px", color: "var(--adm-muted)", textAlign: "center" }}>
                      এই বিভাগে এখনও কোনো পাঠক রেটিং পাওয়া যায়নি।
                    </div>
                  );
                }

                return filteredRatings.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: "16px",
                      border: "1px solid var(--adm-line)",
                      borderRadius: "var(--adm-radius)",
                      background: "var(--adm-bg)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <strong style={{ fontSize: "15px", color: "var(--adm-ink)" }}>{r.readerName || "অজ্ঞাত পাঠক"}</strong>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "12px",
                              background: "rgba(180, 83, 9, 0.12)",
                              color: "#b45309",
                              fontSize: "12px",
                              fontWeight: 700,
                              letterSpacing: "0.05em",
                            }}
                          >
                            {"★".repeat(r.rating)}
                            {"☆".repeat(5 - r.rating)}
                            <span style={{ marginLeft: "4px" }}>({formatBengaliNumber(r.rating)}/৫)</span>
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              padding: "2px 6px",
                              borderRadius: "6px",
                              background: "var(--adm-line)",
                              color: "var(--adm-muted)",
                            }}
                          >
                            {r.targetType}
                          </span>
                        </div>

                        <div style={{ fontSize: "12px", color: "var(--adm-muted)" }}>
                          <span>রচনা: <strong>{r.targetTitle}</strong></span>
                          <span style={{ margin: "0 6px" }}>·</span>
                          <span>{r.date}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteRating(r.id, r.readerName || "অজ্ঞাত পাঠক")}
                        className="admin-button danger"
                        style={{ padding: "4px 10px", fontSize: "11px", minHeight: "28px" }}
                        title="রেটিং মুছে ফেলুন"
                      >
                        মুছুন
                      </button>
                    </div>

                    {r.review && (
                      <p
                        style={{
                          margin: "2px 0 0",
                          padding: "10px 14px",
                          background: "var(--adm-card)",
                          borderRadius: "8px",
                          border: "1px solid var(--adm-line)",
                          fontSize: "13.5px",
                          lineHeight: "1.6",
                          color: "var(--adm-ink)",
                          fontStyle: "italic",
                        }}
                      >
                        “{r.review}”
                      </p>
                    )}
                  </div>
                ));
              })()}
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
