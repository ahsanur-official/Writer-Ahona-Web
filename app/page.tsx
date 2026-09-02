/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Post,
  Novel,
  NovelEpisode,
  getPosts,
  getNovels,
  clapPost,
  getBookmarks,
  toggleBookmark,
  formatBengaliNumber,
} from "@/lib/store";

interface ActiveReadingItem {
  id: string;
  title: string;
  type: string;
  content: string;
  date: string;
  readTime: string;
  coverUrl?: string;
  claps?: number;
  novelId?: string;
  novelTitle?: string;
  episodeNumber?: number;
  totalEpisodes?: number;
}

interface SliderItem {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
  imageUrl: string;
  novelId?: string;
  episodeNumber?: number;
  novelTitle?: string;
}

const CATEGORIES = ["সব লেখা", "গল্প", "কবিতা", "প্রবন্ধ", "দিনলিপি", "বুকমার্ক"];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("সব লেখা");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Store data
  const [posts, setPosts] = useState<Post[]>([]);
  const [novels, setNovels] = useState<Novel[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  // Reader state
  const [readingItem, setReadingItem] = useState<ActiveReadingItem | null>(null);
  const [fontChoice, setFontChoice] = useState<"bengali" | "english">("bengali");
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [scrollProgress, setScrollProgress] = useState(0);

  // Novel episodes slider pagination state (per novel: novelId -> page index)
  const [novelPages, setNovelPages] = useState<Record<string, number>>({});

  // Auto Slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sliderPaused, setSliderPaused] = useState(false);
  const autoSlideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load store data
  const reloadData = () => {
    const p = getPosts();
    const n = getNovels();
    setPosts(p);
    setNovels(n);
    setBookmarks(getBookmarks());
  };

  useEffect(() => {
    reloadData();
    const handleUpdate = () => reloadData();
    window.addEventListener("ahona_store_updated", handleUpdate);
    return () => window.removeEventListener("ahona_store_updated", handleUpdate);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Compile top 5 items for the Hero Slider
  const sliderItems: SliderItem[] = useMemo(() => {
    const items: SliderItem[] = [];

    // Add latest posts
    posts.slice(0, 5).forEach((p) => {
      items.push({
        id: p.id,
        title: p.title,
        category: p.type,
        excerpt: p.excerpt,
        content: p.body,
        date: p.date,
        readTime: p.readTime,
        imageUrl:
          p.coverUrl ||
          "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
      });
    });

    // If needed, supplement with novel episodes
    if (items.length < 5) {
      novels.forEach((nov) => {
        nov.episodes?.forEach((ep) => {
          if (items.length < 5) {
            items.push({
              id: ep.id,
              title: `${nov.title} — পর্ব ${formatBengaliNumber(ep.episodeNumber)}: ${ep.title}`,
              category: "উপন্যাস পর্ব",
              excerpt: ep.teaser,
              content: ep.content,
              date: ep.date,
              readTime: ep.readTime,
              imageUrl:
                nov.coverUrl ||
                "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
              novelId: nov.id,
              episodeNumber: ep.episodeNumber,
              novelTitle: nov.title,
            });
          }
        });
      });
    }

    return items.slice(0, 5);
  }, [posts, novels]);

  // Auto Slider Timer (slides every 4.5s)
  useEffect(() => {
    if (sliderPaused || sliderItems.length <= 1) return;

    autoSlideTimerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderItems.length);
    }, 4500);

    return () => {
      if (autoSlideTimerRef.current) {
        clearInterval(autoSlideTimerRef.current);
      }
    };
  }, [sliderPaused, sliderItems.length]);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliderItems.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + sliderItems.length) % sliderItems.length);
  };

  // Filter writings
  const filteredPosts = useMemo(() => {
    let list = [...posts];

    if (activeCategory === "বুকমার্ক") {
      list = list.filter((p) => bookmarks.includes(p.id));
    } else if (activeCategory !== "সব লেখা") {
      list = list.filter((p) => p.type === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.body.toLowerCase().includes(q)
      );
    }

    return list;
  }, [posts, activeCategory, searchQuery, bookmarks]);

  // Open Post in Reader Modal
  const openPostInReader = (post: Post) => {
    setReadingItem({
      id: post.id,
      title: post.title,
      type: post.type,
      content: post.body,
      date: post.date,
      readTime: post.readTime,
      coverUrl: post.coverUrl,
      claps: post.claps,
    });
    setScrollProgress(0);
  };

  // Open Novel Episode in Reader Modal
  const openEpisodeInReader = (novel: Novel, episode: NovelEpisode) => {
    setReadingItem({
      id: episode.id,
      title: `${novel.title} — পর্ব ${formatBengaliNumber(episode.episodeNumber)}: ${episode.title}`,
      type: "উপন্যাস পর্ব",
      content: episode.content,
      date: episode.date,
      readTime: episode.readTime,
      novelId: novel.id,
      novelTitle: novel.title,
      episodeNumber: episode.episodeNumber,
      totalEpisodes: novel.episodesCount,
    });
    setScrollProgress(0);
  };

  // Open Slider Item in Reader Modal
  const openSliderItem = (item: SliderItem) => {
    setReadingItem({
      id: item.id,
      title: item.title,
      type: item.category,
      content: item.content,
      date: item.date,
      readTime: item.readTime,
      coverUrl: item.imageUrl,
      novelId: item.novelId,
      novelTitle: item.novelTitle,
      episodeNumber: item.episodeNumber,
    });
    setScrollProgress(0);
  };

  // Handle claps
  const handleClap = () => {
    if (!readingItem) return;
    clapPost(readingItem.id);
    setReadingItem((prev) => (prev ? { ...prev, claps: (prev.claps || 0) + 1 } : null));
    showToast("আপনার ভালোবাসা ও সাধুবাদ যোগ হয়েছে! ❤️");
  };

  // Handle bookmark
  const handleBookmark = () => {
    if (!readingItem) return;
    const isBookmarked = toggleBookmark(readingItem.id);
    setBookmarks(getBookmarks());
    showToast(isBookmarked ? "সংরক্ষণ করা হয়েছে 🔖" : "সংরক্ষণ তালিকা থেকে সরানো হয়েছে");
  };

  // Reading modal scroll tracking
  const handleReaderScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const progress = Math.min(100, Math.round((scrollTop / (scrollHeight - clientHeight)) * 100));
    setScrollProgress(progress);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Sticky Header with Name/Avatar on left, Theme Picker in center, Hamburger on right */}
      <Header />

      <main style={{ flex: 1 }}>
        {/* 
          1. Auto Hero Slider for 5 newest items
          Has Image with bottom dark gradient overlay, Title, Excerpt, Date, and Read button.
        */}
        {sliderItems.length > 0 && (
          <section
            className="hero-slider-section"
            onMouseEnter={() => setSliderPaused(true)}
            onMouseLeave={() => setSliderPaused(false)}
          >
            <div className="hero-slider-container">
              {sliderItems.map((item, idx) => (
                <div
                  key={item.id}
                  className={`slider-slide ${idx === currentSlide ? "active" : ""}`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="slider-image"
                  />
                  <div className="slider-overlay">
                    <div className="slider-badge-row">
                      <span className="slider-badge">{item.category}</span>
                      <span className="slider-date">{item.date}</span>
                    </div>

                    <h2 className="slider-title">{item.title}</h2>
                    <p className="slider-excerpt">{item.excerpt}</p>

                    <div className="slider-actions">
                      <button
                        type="button"
                        className="slider-read-btn"
                        onClick={() => openSliderItem(item)}
                      >
                        লেখাটি পড়ুন →
                      </button>
                      <span className="slider-read-time">
                        {item.readTime} পাঠ
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Prev / Next Arrows */}
              <button
                type="button"
                className="slider-prev"
                onClick={handlePrevSlide}
                aria-label="পূর্ববর্তী স্লাইড"
              >
                ‹
              </button>
              <button
                type="button"
                className="slider-next"
                onClick={handleNextSlide}
                aria-label="পরবর্তী স্লাইড"
              >
                ›
              </button>

              {/* 5 Dots indicators */}
              <div className="slider-dots">
                {sliderItems.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    className={`slider-dot ${dotIdx === currentSlide ? "active" : ""}`}
                    onClick={() => setCurrentSlide(dotIdx)}
                    aria-label={`স্লাইড ${dotIdx + 1}`}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 
          2. Serialized Novels Section
          Shows 3 episodes per novel card with an inline slider for the rest!
        */}
        <section className="novels-section" id="novels">
          <div className="section-head">
            <div>
              <p className="eyebrow">SERIALIZED NOVELS · উপন্যাস</p>
              <h2>
                ধারাবাহিক <em>উপন্যাস ও সিরিজ</em>
              </h2>
            </div>
            <span className="result-count">
              মোট উপন্যাস: {formatBengaliNumber(novels.length)}টি
            </span>
          </div>

          <div className="novel-showcase-grid">
            {novels.map((novel) => {
              const episodes = novel.episodes || [];
              const episodesPerPage = 3;
              const totalPages = Math.max(1, Math.ceil(episodes.length / episodesPerPage));
              const currentPage = novelPages[novel.id] || 0;
              const displayedEpisodes = episodes.slice(
                currentPage * episodesPerPage,
                (currentPage + 1) * episodesPerPage
              );

              return (
                <div key={novel.id} className="serial-card">
                  {/* Novel Top Summary */}
                  <div className="serial-top">
                    {novel.coverUrl ? (
                      <img
                        src={novel.coverUrl}
                        alt={novel.title}
                        style={{
                          width: "105px",
                          height: "145px",
                          borderRadius: "4px",
                          objectFit: "cover",
                          boxShadow: "3px 3px 0 var(--line)",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div className={`serial-cover ${novel.coverTone || "sage"}`}>
                        {novel.title.charAt(0)}
                      </div>
                    )}

                    <div className="serial-meta">
                      <span className="serial-genre">{novel.genre}</span>
                      <h3>{novel.title}</h3>
                      <span className="status live">
                        {novel.status === "চলমান" ? "● চলমান ধারাবাহিক" : "✓ সম্পূর্ণ গ্রন্থ"}
                      </span>
                      <p className="serial-synopsis">{novel.synopsis}</p>
                    </div>
                  </div>

                  {/* 3-Episode Slider Area */}
                  <div className="serial-episodes-wrap">
                    <div className="episodes-slider-header">
                      <span>
                        পর্বসমূহ ({formatBengaliNumber(currentPage * episodesPerPage + 1)} -{" "}
                        {formatBengaliNumber(
                          Math.min((currentPage + 1) * episodesPerPage, episodes.length)
                        )}{" "}
                        / মোট {formatBengaliNumber(episodes.length)}টি)
                      </span>

                      {/* Inline Slider Controls for 3 episodes */}
                      {totalPages > 1 && (
                        <div className="episode-slider-controls">
                          <button
                            type="button"
                            className="ep-page-btn"
                            disabled={currentPage === 0}
                            onClick={() =>
                              setNovelPages((prev) => ({
                                ...prev,
                                [novel.id]: Math.max(0, currentPage - 1),
                              }))
                            }
                            title="পূর্ববর্তী ৩টি পর্ব"
                          >
                            ‹ আগের ৩টি
                          </button>
                          <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                            {formatBengaliNumber(currentPage + 1)}/{formatBengaliNumber(totalPages)}
                          </span>
                          <button
                            type="button"
                            className="ep-page-btn"
                            disabled={currentPage >= totalPages - 1}
                            onClick={() =>
                              setNovelPages((prev) => ({
                                ...prev,
                                [novel.id]: Math.min(totalPages - 1, currentPage + 1),
                              }))
                            }
                            title="পরবর্তী ৩টি পর্ব"
                          >
                            পরের ৩টি ›
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Episodes List */}
                    <div className="episodes-list-box">
                      {displayedEpisodes.length === 0 ? (
                        <p style={{ fontSize: "13px", color: "var(--muted)", fontStyle: "italic" }}>
                          কোনো পর্ব পাওয়া যায়নি।
                        </p>
                      ) : (
                        displayedEpisodes.map((ep) => (
                          <div
                            key={ep.id}
                            className="episode-item"
                            onClick={() => openEpisodeInReader(novel, ep)}
                          >
                            <div>
                              <span className="episode-num">
                                পর্ব {formatBengaliNumber(ep.episodeNumber)}:
                              </span>
                              <span style={{ fontWeight: "600" }}>{ep.title}</span>
                            </div>
                            <span style={{ fontSize: "11px", color: "var(--muted)", whiteSpace: "nowrap" }}>
                              {ep.readTime} →
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 
          3. Literary Works Section (Stories, Poems, Essays)
        */}
        <section className="latest" id="writings">
          <div className="section-head">
            <div>
              <p className="eyebrow">COLLECTED WRITINGS · সাহিত্য</p>
              <h2>
                নির্বাচিত <em>গল্প ও কবিতা</em>
              </h2>
            </div>
            <span className="result-count">
              মোট: {formatBengaliNumber(filteredPosts.length)}টি রচনা
            </span>
          </div>

          {/* Filter and Search Bar */}
          <div className="filter-row">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={activeCategory === cat ? "active" : ""}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}

            <div className="search">
              <span style={{ fontSize: "13px" }}>🔍</span>
              <input
                type="text"
                placeholder="শিরোনাম বা শব্দ দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{ background: "none", border: "0", cursor: "pointer", fontSize: "12px" }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Writings Grid */}
          <div className="work-grid">
            {filteredPosts.length === 0 ? (
              <div className="empty" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px" }}>
                <p style={{ fontSize: "18px", color: "var(--muted)" }}>
                  কোনো লেখা খুঁজে পাওয়া যায়নি।
                </p>
                <button
                  type="button"
                  className="button dark"
                  onClick={() => {
                    setActiveCategory("সব লেখা");
                    setSearchQuery("");
                  }}
                  style={{ marginTop: "14px" }}
                >
                  সব লেখা দেখুন
                </button>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <article key={post.id} className="work-card">
                  <div className="card-art-cover">
                    <img
                      src={
                        post.coverUrl ||
                        "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80"
                      }
                      alt={post.title}
                    />
                    <span className="card-type-badge">{post.type}</span>
                  </div>

                  <div className="work-content">
                    <div className="meta">
                      <span>{post.date}</span>
                      <span>{post.readTime} পাঠ</span>
                    </div>
                    <h3>{post.title}</h3>
                    <p>{post.excerpt}</p>
                    <button
                      type="button"
                      className="read-link"
                      onClick={() => openPostInReader(post)}
                    >
                      <span>সম্পূর্ণ পড়ুন →</span>
                      <small>❤️ {formatBengaliNumber(post.claps)}</small>
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </main>

      {/* 
        Reading Modal
        Features font switching between Bengali (Kalpurush) and English (Roboto),
        size adjustments, progress bar, claps, and bookmarking.
      */}
      {readingItem && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setReadingItem(null);
          }}
        >
          <div className="reading-modal" onScroll={handleReaderScroll}>
            {/* Reading progress bar */}
            <div className="reading-progress-bar">
              <div
                className="reading-progress-fill"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>

            <button
              type="button"
              className="modal-close"
              onClick={() => setReadingItem(null)}
              aria-label="বন্ধ করুন"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div style={{ paddingRight: "40px" }}>
              <p className="eyebrow" style={{ color: "var(--accent)" }}>
                {readingItem.type} · {readingItem.date} · {readingItem.readTime} পাঠ
              </p>
              <h2 style={{ fontSize: "clamp(26px, 4vw, 36px)", margin: "0 0 16px", fontWeight: "700" }}>
                {readingItem.title}
              </h2>
            </div>

            {/* Reading Toolbar: Font Selection & Size */}
            <div className="reader-toolbar">
              {/* Font Selection (Kalpurush for Bengali, Roboto for English) */}
              <div className="reader-tools-group">
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>ফন্ট:</span>
                <button
                  type="button"
                  className={`reader-btn ${fontChoice === "bengali" ? "active" : ""}`}
                  onClick={() => setFontChoice("bengali")}
                  title="কালপুরুষ ফন্ট"
                >
                  কালপুরুষ (বাংলা)
                </button>
                <button
                  type="button"
                  className={`reader-btn ${fontChoice === "english" ? "active" : ""}`}
                  onClick={() => setFontChoice("english")}
                  title="Roboto ফন্ট"
                >
                  Roboto (English)
                </button>
              </div>

              {/* Font Size Adjuster */}
              <div className="reader-tools-group">
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>আকার:</span>
                <button
                  type="button"
                  className={`reader-btn ${fontSize === "sm" ? "active" : ""}`}
                  onClick={() => setFontSize("sm")}
                >
                  ছোট
                </button>
                <button
                  type="button"
                  className={`reader-btn ${fontSize === "base" ? "active" : ""}`}
                  onClick={() => setFontSize("base")}
                >
                  মাঝারি
                </button>
                <button
                  type="button"
                  className={`reader-btn ${fontSize === "lg" ? "active" : ""}`}
                  onClick={() => setFontSize("lg")}
                >
                  বড়
                </button>
              </div>
            </div>

            {/* Content Body with chosen font and size */}
            <div
              className={`reader-content ${fontSize === "sm" ? "font-sm" : fontSize === "lg" ? "font-lg" : ""} ${
                fontChoice === "bengali" ? "font-bengali" : "font-english"
              }`}
            >
              {readingItem.content}
            </div>

            {/* Reading Footer Actions */}
            <div
              style={{
                borderTop: "1px solid var(--line)",
                paddingTop: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "14px",
              }}
            >
              <button type="button" className="clap-btn" onClick={handleClap}>
                <span>❤️</span>
                <span>ভালোবাসা জানান ({formatBengaliNumber(readingItem.claps || 0)})</span>
              </button>

              <button
                type="button"
                className="reader-btn"
                onClick={handleBookmark}
                style={{ padding: "8px 16px" }}
              >
                🔖 {bookmarks.includes(readingItem.id) ? "সংরক্ষিত আছে" : "বুকমার্ক করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && <div className="toast-notice">{toast}</div>}

      {/* Literary Footer */}
      <Footer />
    </div>
  );
}
