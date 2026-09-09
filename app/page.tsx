/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";

const RatingModal = dynamic(() => import("@/components/RatingModal"), { ssr: false });
const CommentsSection = dynamic(() => import("@/components/CommentsSection"), { ssr: false });
import { getCurrentUser, verifyEmailCode, ReaderUser } from "@/lib/userAuth";
import {
  Post,
  Novel,
  NovelEpisode,
  getPosts,
  getNovels,
  toggleLikePost,
  getLikedPosts,
  getBookmarks,
  toggleBookmark,
  getItemRatingStats,
  getUserRatingFor,
  getTotalCommentsCountForTarget,
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
  originalCoverUrl?: string;
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
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<ReaderUser | null>(null);
  const pendingReadingItemRef = useRef<ActiveReadingItem | null>(null);
  const readingScrollRef = useRef<HTMLDivElement>(null);

  // Reader state
  const [readingItem, setReadingItem] = useState<ActiveReadingItem | null>(null);
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [fullViewImageUrl, setFullViewImageUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Reader Rating modal state
  const [ratingModalItem, setRatingModalItem] = useState<{
    id: string;
    title: string;
    type: string;
  } | null>(null);
  const [promptedRatings, setPromptedRatings] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
    setCurrentUser(getCurrentUser());

    const handleAuth = () => {
      const user = getCurrentUser();
      setCurrentUser(user);

      // If reader was waiting for login to open an item, open it immediately!
      if (user && pendingReadingItemRef.current) {
        const item = pendingReadingItemRef.current;
        pendingReadingItemRef.current = null;
        setTimeout(() => {
          setReadingItem(item);
          setScrollProgress(0);
          showToast(`স্বাগতম ${user.name}! "${item.title}" উন্মুক্ত হয়েছে 📖`);
        }, 300);
      }
    };

    const handleOpenReader = (e: any) => {
      if (e.detail) {
        setReadingItem(e.detail);
        setScrollProgress(0);
      }
    };

    window.addEventListener("ahona-auth-changed", handleAuth);
    window.addEventListener("ahona-open-reader", handleOpenReader);

    return () => {
      window.removeEventListener("ahona-auth-changed", handleAuth);
      window.removeEventListener("ahona-open-reader", handleOpenReader);
    };
  }, []);

  // Prevent background scrolling while reading modal is open without shifting scroll position
  const isReadingModalActive = Boolean(readingItem);
  useEffect(() => {
    if (isReadingModalActive) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isReadingModalActive]);

  // Reset reader scroll position ONLY when a brand new reading item or episode is loaded
  const prevReadingItemIdRef = useRef<string | null>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [readerCommentsCount, setReaderCommentsCount] = useState(0);

  const readingItemId = readingItem?.id;
  useEffect(() => {
    if (readingItemId) {
      if (prevReadingItemIdRef.current !== readingItemId) {
        prevReadingItemIdRef.current = readingItemId;
        if (readingScrollRef.current) {
          readingScrollRef.current.scrollTop = 0;
        }
      }
      setReaderCommentsCount(getTotalCommentsCountForTarget(readingItemId));
    } else {
      prevReadingItemIdRef.current = null;
    }
  }, [readingItemId]);

  useEffect(() => {
    const handleStoreUpdate = () => {
      if (readingItemId) {
        setReaderCommentsCount(getTotalCommentsCountForTarget(readingItemId));
      }
    };
    window.addEventListener("ahona_store_updated", handleStoreUpdate);
    return () => {
      window.removeEventListener("ahona_store_updated", handleStoreUpdate);
    };
  }, [readingItemId]);

  // Novel episodes slider pagination state (per novel: novelId -> page index)
  const [novelPages, setNovelPages] = useState<Record<string, number>>({});

  // Auto Slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sliderPaused, setSliderPaused] = useState(false);
  const autoSlideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  // Load store data
  const reloadData = () => {
    const u = getCurrentUser();
    const p = getPosts();
    const n = getNovels();
    setPosts(p);
    setNovels(n);
    setBookmarks(getBookmarks(u?.id));
    setLikedPosts(getLikedPosts(u?.id));
  };

  useEffect(() => {
    reloadData();
    const handleUpdate = () => reloadData();
    const handleAuthChange = () => {
      const u = getCurrentUser();
      setCurrentUser(u);
      reloadData();
    };

    window.addEventListener("ahona_store_updated", handleUpdate);
    window.addEventListener("ahona-auth-changed", handleAuthChange);

    // Auto-verify if user visits direct verification link (?verify_email=...&code=...)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const vEmail = params.get("verify_email");
      const vCode = params.get("code");
      if (vEmail && vCode) {
        verifyEmailCode(vEmail, vCode)
          .then((res) => {
            if (res.success) {
              setCurrentUser(res.user);
              setToast(`অভিনন্দন ${res.user.name}! আপনার ইমেইল সফলভাবে ভেরিফাইড হয়েছে 🎉`);
              setTimeout(() => setToast(null), 4000);
              window.dispatchEvent(new CustomEvent("ahona-auth-changed", { detail: res.user }));
              const cleanUrl = window.location.pathname;
              window.history.replaceState({}, document.title, cleanUrl);
            }
          })
          .catch((err) => {
            setToast(err?.message || "ভেরিফিকেশন কোডের মেয়াদ শেষ হয়ে গেছে বা সঠিক নয়।");
            setTimeout(() => setToast(null), 4000);
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          });
      }
    }

    return () => {
      window.removeEventListener("ahona_store_updated", handleUpdate);
      window.removeEventListener("ahona-auth-changed", handleAuthChange);
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Compile items for the Hero Slider:
  // Shows only actual posts with images (recent 5 highest, whatever count exists, minimum can be anything, strictly no duplication)
  const sliderItems: SliderItem[] = useMemo(() => {
    const items: SliderItem[] = [];
    const seenIds = new Set<string>();
    const seenUrls = new Set<string>();

    // 1. Filter published posts that actually have a valid non-empty coverUrl
    const postsWithImages = posts.filter(
      (p) =>
        p.status === "প্রকাশিত" &&
        typeof p.coverUrl === "string" &&
        p.coverUrl.trim().length > 5
    );

    for (const p of postsWithImages) {
      if (items.length >= 5) break;
      const url = p.coverUrl!.trim();
      if (!seenIds.has(p.id) && !seenUrls.has(url)) {
        seenIds.add(p.id);
        seenUrls.add(url);
        items.push({
          id: p.id,
          title: p.title,
          category: p.type,
          excerpt: p.excerpt,
          content: p.body,
          date: p.date,
          readTime: p.readTime,
          imageUrl: url,
        });
      }
    }

    // 2. Also incorporate novels with coverUrl if available and space remains (< 5)
    if (items.length < 5) {
      for (const n of novels) {
        if (items.length >= 5) break;
        if (n.coverUrl && typeof n.coverUrl === "string" && n.coverUrl.trim().length > 5) {
          const url = n.coverUrl.trim();
          if (!seenIds.has(n.id) && !seenUrls.has(url)) {
            seenIds.add(n.id);
            seenUrls.add(url);
            const firstEp = n.episodes && n.episodes.length > 0 ? n.episodes[0] : null;
            items.push({
              id: firstEp ? firstEp.id : n.id,
              title: `${n.title} ${firstEp ? `(পর্ব ১: ${firstEp.title})` : ""}`,
              category: "উপন্যাস",
              excerpt: n.synopsis,
              content: firstEp ? firstEp.content : n.synopsis,
              date: n.status || "চলমান",
              readTime: firstEp ? firstEp.readTime : "১০ মিনিট",
              imageUrl: url,
              novelId: n.id,
              novelTitle: n.title,
              episodeNumber: 1,
            });
          }
        }
      }
    }

    return items;
  }, [posts, novels]);

  // Keep current slide within valid bounds if items count changes
  useEffect(() => {
    if (currentSlide >= sliderItems.length && sliderItems.length > 0) {
      setCurrentSlide(0);
    }
  }, [sliderItems.length, currentSlide]);

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

  // Open Post in Reader Modal (Requires Login to read)
  const openPostInReader = (post: Post) => {
    const item: ActiveReadingItem = {
      id: post.id,
      title: post.title,
      type: post.type,
      content: post.body,
      date: post.date,
      readTime: post.readTime,
      coverUrl: post.coverUrl,
      originalCoverUrl: post.originalCoverUrl || post.coverUrl,
      claps: post.claps,
    };

    const user = currentUser || getCurrentUser();
    if (!user || !user.emailVerified) {
      pendingReadingItemRef.current = item;
      window.dispatchEvent(
        new CustomEvent("ahona-open-auth-modal", {
          detail: { reason: "read", title: post.title },
        })
      );
    }

    setReadingItem(item);
    setScrollProgress(0);
    if (readingScrollRef.current) {
      readingScrollRef.current.scrollTop = 0;
    }
  };

  // Open Novel Episode in Reader Modal
  const openEpisodeInReader = (novel: Novel, episode: NovelEpisode) => {
    const item: ActiveReadingItem = {
      id: episode.id,
      title: `${novel.title} — পর্ব ${formatBengaliNumber(episode.episodeNumber)}: ${episode.title}`,
      type: "উপন্যাস পর্ব",
      content: episode.content,
      date: episode.date,
      readTime: episode.readTime,
      coverUrl: novel.coverUrl,
      originalCoverUrl: novel.originalCoverUrl || novel.coverUrl,
      novelId: novel.id,
      novelTitle: novel.title,
      episodeNumber: episode.episodeNumber,
      totalEpisodes: novel.episodesCount,
    };

    const user = currentUser || getCurrentUser();
    if (!user || !user.emailVerified) {
      pendingReadingItemRef.current = item;
      window.dispatchEvent(
        new CustomEvent("ahona-open-auth-modal", {
          detail: { reason: "read", title: `${novel.title} — পর্ব ${formatBengaliNumber(episode.episodeNumber)}` },
        })
      );
    }

    setReadingItem(item);
    setScrollProgress(0);
    if (readingScrollRef.current) {
      readingScrollRef.current.scrollTop = 0;
    }
  };

  // Open Slider Item in Reader Modal
  const openSliderItem = (item: SliderItem) => {
    const foundPost = posts.find((p) => p.id === item.id);
    const foundNovel = novels.find((n) => n.id === item.novelId);
    const origCover = foundPost?.originalCoverUrl || foundNovel?.originalCoverUrl || item.imageUrl;

    const rItem: ActiveReadingItem = {
      id: item.id,
      title: item.title,
      type: item.category,
      content: item.content,
      date: item.date,
      readTime: item.readTime,
      coverUrl: item.imageUrl,
      originalCoverUrl: origCover,
      novelId: item.novelId,
      novelTitle: item.novelTitle,
      episodeNumber: item.episodeNumber,
    };

    const user = currentUser || getCurrentUser();
    if (!user || !user.emailVerified) {
      pendingReadingItemRef.current = rItem;
      window.dispatchEvent(
        new CustomEvent("ahona-open-auth-modal", {
          detail: { reason: "read", title: item.title },
        })
      );
    }

    setReadingItem(rItem);
    setScrollProgress(0);
    if (readingScrollRef.current) {
      readingScrollRef.current.scrollTop = 0;
    }
  };

  // Handle claps with instant optimistic realtime feedback (zero page reload/lag, stays right here)
  const handleClap = async () => {
    if (!readingItem) return;
    const user = currentUser || getCurrentUser();
    if (!user) {
      window.dispatchEvent(
        new CustomEvent("ahona-open-auth-modal", {
          detail: { reason: "read", title: readingItem.title },
        })
      );
      return;
    }

    const wasLiked = likedPosts.includes(readingItem.id);
    const nextLiked = !wasLiked;
    const currentClaps = readingItem.claps || 0;
    const nextClaps = nextLiked ? currentClaps + 1 : Math.max(0, currentClaps - 1);

    // Instant Realtime optimistic update (0ms lag, no page reload, no scroll change)
    setLikedPosts((prev) =>
      nextLiked ? [...prev, readingItem.id] : prev.filter((id) => id !== readingItem.id)
    );
    setReadingItem((prev) => (prev ? { ...prev, claps: nextClaps } : null));
    setPosts((prev) =>
      prev.map((p) => (p.id === readingItem.id ? { ...p, claps: nextClaps } : p))
    );
    setNovels((prev) =>
      prev.map((n) => ({
        ...n,
        episodes: n.episodes?.map((e) =>
          e.id === readingItem.id ? { ...e, claps: nextClaps } : e
        ),
      }))
    );

    // Perform server sync in background without showing any modal or toast
    try {
      const res = await toggleLikePost(readingItem.id, user.id);
      if (res && typeof res.claps === "number") {
        setReadingItem((prev) => (prev ? { ...prev, claps: res.claps } : null));
      }
    } catch {
      // Revert if error
    }
  };

  // Handle bookmark
  const handleBookmark = () => {
    if (!readingItem) return;
    const user = currentUser || getCurrentUser();
    if (!user) {
      showToast("বুকমার্ক সংরক্ষণ করতে অনুগ্রহ করে লগইন করুন 🔖");
      window.dispatchEvent(
        new CustomEvent("ahona-open-auth-modal", {
          detail: { reason: "read", title: readingItem.title },
        })
      );
      return;
    }
    const isBookmarked = toggleBookmark(readingItem.id, user.id);
    setBookmarks(getBookmarks(user.id));
    showToast(isBookmarked ? "সংরক্ষণ করা হয়েছে 🔖" : "সংরক্ষণ তালিকা থেকে সরানো হয়েছে");
  };

  // Reading modal scroll tracking & automatic completion detection
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
            <div
              className="hero-slider-container"
              onTouchStart={(e) => {
                touchStartXRef.current = e.touches[0].clientX;
                setSliderPaused(true);
              }}
              onTouchEnd={(e) => {
                if (touchStartXRef.current !== null) {
                  const diff = touchStartXRef.current - e.changedTouches[0].clientX;
                  if (diff > 45) {
                    handleNextSlide();
                  } else if (diff < -45) {
                    handlePrevSlide();
                  }
                  touchStartXRef.current = null;
                }
                setSliderPaused(false);
              }}
            >
              {sliderItems.map((item, idx) => (
                <div
                  key={item.id}
                  className={`slider-slide ${idx === currentSlide ? "active" : ""}`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="slider-image"
                    loading={idx === 0 ? "eager" : "lazy"}
                    decoding="async"
                    {...(idx === 0 ? { fetchPriority: "high" } : {})}
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
                        {currentUser ? "লেখাটি পড়ুন →" : "🔒 পড়ুন (লগইন আবশ্যক) →"}
                      </button>
                      <span className="slider-read-time">
                        {item.readTime} পাঠ
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Prev / Next Arrows and Dots (only rendered when there is more than 1 slide) */}
              {sliderItems.length > 1 && (
                <>
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
                </>
              )}
            </div>
          </section>
        )}

        {/* 
          2. Serialized Novels Section
          Shows 3 episodes per novel card with an inline slider for the rest!
        */}
        <section className="novels-section" id="novels">
          <div className="section-head scroll-reveal">
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
                <div key={novel.id} className="serial-card scroll-reveal">
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
                    <div key={currentPage} className="episodes-list-box">
                      {displayedEpisodes.length === 0 ? (
                        <p style={{ fontSize: "13px", color: "var(--muted)", fontStyle: "italic" }}>
                          কোনো পর্ব পাওয়া যায়নি৤
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
                              {!currentUser && (
                                <span
                                  style={{
                                    marginLeft: "8px",
                                    fontSize: "11px",
                                    color: "var(--accent, #a04834)",
                                    background: "rgba(160, 72, 52, 0.08)",
                                    padding: "2px 7px",
                                    borderRadius: "8px",
                                    fontWeight: 600,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "3px",
                                  }}
                                >
                                  <span>🔒</span>
                                  <span>লগইন আবশ্যক</span>
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {(() => {
                                const epStats = getItemRatingStats(ep.id);
                                return epStats.count > 0 ? (
                                  <span style={{ color: "var(--gold, #caa869)", fontSize: "11px", fontWeight: 600 }}>
                                    ★ {formatBengaliNumber(epStats.average)}
                                  </span>
                                ) : null;
                              })()}
                              <span style={{ fontSize: "11px", color: "var(--muted)", whiteSpace: "nowrap" }}>
                                {ep.readTime} →
                              </span>
                            </div>
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
          <div className="section-head scroll-reveal">
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

          {/* Desktop Filter and Search Bar */}
          <div className="filter-row desktop-filter-row scroll-reveal">
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

          {/* Mobile Filter & Category Options */}
          <div className="mobile-filter-row">
            <div className="mobile-filter-header">
              <span className="mobile-filter-label">বিভাগ নির্বাচন করুন:</span>
              <div className="mobile-select-wrapper">
                <select
                  className="mobile-category-select"
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  aria-label="বিভাগ নির্বাচন করুন"
                >
                  <option value="সব লেখা">সব লেখা ({formatBengaliNumber(posts.length)}টি)</option>
                  <option value="গল্প">গল্প (ছোটগল্প)</option>
                  <option value="কবিতা">কবিতা (কাব্য)</option>
                  <option value="প্রবন্ধ">প্রবন্ধ ও ভাবনা</option>
                  <option value="দিনলিপি">দিনলিপি</option>
                  <option value="বুকমার্ক">সংরক্ষিত বুকমার্ক ({formatBengaliNumber(bookmarks.length)}টি)</option>
                </select>
                <span className="mobile-select-arrow">▾</span>
              </div>
            </div>

            <div className="mobile-filter-chips">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`mobile-chip-btn ${activeCategory === cat ? "active" : ""}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat === "বুকমার্ক" ? "★ বুকমার্ক" : cat}
                </button>
              ))}
            </div>

            <div className="search mobile-search">
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
          <div key={activeCategory + searchQuery} className="work-grid">
            {filteredPosts.length === 0 ? (
              <div className="empty" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px" }}>
                <p style={{ fontSize: "18px", color: "var(--muted)" }}>
                  কোনো লেখা খুঁজে পাওয়া যায়নি৤
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
                <article key={post.id} className="work-card scroll-reveal">
                  <div className="card-art-cover">
                    <img
                      src={
                        post.coverUrl ||
                        "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80"
                      }
                      alt={post.title}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="card-type-badge">{post.type}</span>
                  </div>

                  <div className="work-content">
                    <div className="meta">
                      <span>{post.date}</span>
                      <span>{post.readTime} পাঠ</span>
                      {(() => {
                        const rStats = getItemRatingStats(post.id);
                        return rStats.count > 0 ? (
                          <span style={{ color: "var(--gold, #caa869)", fontWeight: 600 }}>
                            ★ {formatBengaliNumber(rStats.average)} ({formatBengaliNumber(rStats.count)})
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <h3>{post.title}</h3>
                    <p>{post.excerpt}</p>
                    <button
                      type="button"
                      className="read-link"
                      onClick={() => openPostInReader(post)}
                    >
                      <span>{currentUser ? "সম্পূর্ণ পড়ুন →" : "🔒 পড়ুন (লগইন আবশ্যক) →"}</span>
                      <small>❤️ {formatBengaliNumber(post.claps || 0)}</small>
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
        Rendered directly into document.body via Portal to open exactly in the viewport wherever the reader is
      */}
      {mounted && readingItem && createPortal(
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setReadingItem(null);
          }}
        >
          <div className="reading-modal-card">
            {/* Reading progress bar at the very top edge */}
            <div className="reading-progress-track">
              <div
                className="reading-progress-fill"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>

            {/* Modal Header */}
            <div className="reading-modal-header">
              <div className="reading-modal-title-area">
                <p className="eyebrow" style={{ color: "var(--accent)", margin: "0 0 6px" }}>
                  {readingItem.type} · {readingItem.date} · {readingItem.readTime} পাঠ
                </p>
                <h2 className="reading-modal-title">
                  {readingItem.title}
                </h2>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setReadingItem(null)}
                aria-label="বন্ধ করুন"
                title="বন্ধ করুন"
              >
                ✕
              </button>
            </div>

            {/* Reading Toolbar: Font Size Adjuster only */}
            <div className="reader-toolbar">
              <div className="reader-tools-group">
                <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>আকার:</span>
                <button
                  type="button"
                  className={`reader-btn ${fontSize === "sm" ? "active" : ""}`}
                  onClick={() => setFontSize("sm")}
                  title="ছোট হরফ"
                >
                  ছোট
                </button>
                <button
                  type="button"
                  className={`reader-btn ${fontSize === "base" ? "active" : ""}`}
                  onClick={() => setFontSize("base")}
                  title="স্বাভাবিক হরফ"
                >
                  মাঝারি
                </button>
                <button
                  type="button"
                  className={`reader-btn ${fontSize === "lg" ? "active" : ""}`}
                  onClick={() => setFontSize("lg")}
                  title="বড় হরফ"
                >
                  বড়
                </button>
              </div>

              <div className="reader-mode-tag">
                📖 বাংলা হরফে পাঠ
              </div>
            </div>

            {/* Scrollable Content Body with chosen font size */}
            <div
              ref={readingScrollRef}
              className="reading-scroll-body prevent-copy"
              onScroll={handleReaderScroll}
            >
              {/* Cover Banner with option to view full original main picture */}
              {readingItem.coverUrl && (
                <div
                  style={{
                    marginBottom: "24px",
                    borderRadius: "14px",
                    overflow: "hidden",
                    position: "relative",
                    maxHeight: "360px",
                    background: "rgba(0,0,0,0.03)",
                    border: "1px solid var(--border-color, rgba(0,0,0,0.08))",
                    boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
                  }}
                >
                  <img
                    src={readingItem.coverUrl}
                    alt={readingItem.title}
                    style={{
                      width: "100%",
                      maxHeight: "360px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  {readingItem.originalCoverUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setFullViewImageUrl(readingItem.originalCoverUrl || readingItem.coverUrl || null)
                      }
                      style={{
                        position: "absolute",
                        bottom: "12px",
                        right: "12px",
                        background: "rgba(20, 15, 12, 0.78)",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        border: "1px solid rgba(255, 255, 255, 0.25)",
                        borderRadius: "20px",
                        color: "#ffffff",
                        padding: "6px 14px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                      }}
                      title="মূল পূর্ণাঙ্গ ছবিটি বড় করে দেখুন"
                    >
                      <span>🔍</span>
                      <span>সম্পূর্ণ মূল ছবি দেখুন</span>
                    </button>
                  )}
                </div>
              )}

              {!currentUser || !currentUser.emailVerified ? (
                <div style={{ position: "relative", minHeight: "260px", marginBottom: "24px" }}>
                  {/* Heavily blurred teaser content */}
                  <div
                    className={`reader-content prevent-copy ${fontSize === "sm" ? "font-sm" : fontSize === "lg" ? "font-lg" : ""} font-bengali`}
                    style={{
                      filter: "blur(6px)",
                      opacity: 0.28,
                      userSelect: "none",
                      WebkitUserSelect: "none",
                      pointerEvents: "none",
                      maxHeight: "150px",
                      overflow: "hidden",
                    }}
                    aria-hidden="true"
                  >
                    {readingItem.content.slice(0, 240)}...
                  </div>

                  {/* High-Contrast Literary Lock Overlay */}
                  <div
                    style={{
                      position: "relative",
                      marginTop: "-60px",
                      padding: "36px 20px",
                      borderRadius: "16px",
                      background: "var(--card, #ffffff)",
                      border: "2px solid var(--accent, #a04834)",
                      boxShadow: "0 14px 40px rgba(160, 72, 52, 0.12)",
                      textAlign: "center",
                      zIndex: 10,
                    }}
                  >
                    <div
                      style={{
                        width: "54px",
                        height: "54px",
                        borderRadius: "50%",
                        background: "var(--surface, #faf7f2)",
                        border: "1px solid var(--line, #e2d9cf)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                        margin: "0 auto 12px",
                      }}
                    >
                      🔒
                    </div>
                    <h3
                      style={{
                        margin: "0 0 8px",
                        fontSize: "19px",
                        color: "var(--ink)",
                        fontWeight: 700,
                      }}
                    >
                      লেখাটি পড়তে পাঠক একাউন্টে লগইন আবশ্যক
                    </h3>
                    <p
                      style={{
                        margin: "0 auto 20px",
                        fontSize: "13.5px",
                        color: "var(--muted)",
                        maxWidth: "460px",
                        lineHeight: "1.6",
                      }}
                    >
                      {currentUser && !currentUser.emailVerified
                        ? "আপনার পাঠক একাউন্টের ইমেইল এখনও যাচাই করা হয়নি৤ সম্পূর্ণ লেখা পড়তে ইমেইলে পাঠানো ৬-সংখ্যার কোড দিয়ে ভেরিফিকেশন সম্পন্ন করুন৤"
                        : "আহনা ইসলামের সাহিত্যসমগ্র ও উপন্যাস পর্বসমূহ পড়তে একটি বিনামূল্যে পাঠক একাউন্ট খুলুন অথবা আপনার একাউন্টে লগইন করুন৤"}
                    </p>

                    <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
                      {currentUser && !currentUser.emailVerified ? (
                        <button
                          type="button"
                          onClick={() => {
                            window.dispatchEvent(
                              new CustomEvent("ahona-open-auth-modal", {
                                detail: { mode: "verify", reason: "read", title: readingItem.title },
                              })
                            );
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px 24px",
                            borderRadius: "24px",
                            background: "var(--accent, #a04834)",
                            color: "#ffffff",
                            border: "none",
                            fontSize: "13.5px",
                            fontWeight: 600,
                            cursor: "pointer",
                            boxShadow: "0 4px 14px rgba(160, 72, 52, 0.3)",
                          }}
                        >
                          <span>🛡️</span>
                          <span>ইমেইল ভেরিফিকেশন কোড নিশ্চিত করুন</span>
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              window.dispatchEvent(
                                new CustomEvent("ahona-open-auth-modal", {
                                  detail: { mode: "login", reason: "read", title: readingItem.title },
                                })
                              );
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "10px 22px",
                              borderRadius: "24px",
                              background: "var(--accent, #a04834)",
                              color: "#ffffff",
                              border: "none",
                              fontSize: "13.5px",
                              fontWeight: 600,
                              cursor: "pointer",
                              boxShadow: "0 4px 14px rgba(160, 72, 52, 0.3)",
                            }}
                          >
                            <span>🔑</span>
                            <span>লগইন করুন</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              window.dispatchEvent(
                                new CustomEvent("ahona-open-auth-modal", {
                                  detail: { mode: "register", reason: "read", title: readingItem.title },
                                })
                              );
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "10px 22px",
                              borderRadius: "24px",
                              background: "transparent",
                              color: "var(--accent, #a04834)",
                              border: "1.5px solid var(--accent, #a04834)",
                              fontSize: "13.5px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            <span>✍️</span>
                            <span>নতুন একাউন্ট নিবন্ধন</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={`reader-content prevent-copy ${fontSize === "sm" ? "font-sm" : fontSize === "lg" ? "font-lg" : ""} font-bengali`}
                  >
                    {readingItem.content}
                  </div>

              {/* Completion & Rating Section */}
              {(() => {
                const currentRatingStats = getItemRatingStats(readingItem.id);
                const userRating = getUserRatingFor(readingItem.id);
                return (
                  <div
                    style={{
                      marginTop: "36px",
                      marginBottom: "20px",
                      padding: "22px 18px",
                      borderRadius: "14px",
                      background: "var(--surface, #f1ede3)",
                      border: "1px solid var(--line, #dcd7cb)",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--accent, #a04834)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        margin: "0 0 4px",
                      }}
                    >
                      🎉 সম্পূর্ণ পাঠ সমাপ্ত
                    </p>
                    <h4
                      style={{
                        fontSize: "17px",
                        fontWeight: 600,
                        color: "var(--ink)",
                        margin: "0 0 8px",
                      }}
                    >
                      লেখাটি আপনার কেমন লাগলো?
                    </h4>
                    <p
                      style={{
                        fontSize: "13.5px",
                        color: "var(--muted)",
                        maxWidth: "420px",
                        margin: "0 auto 16px",
                        lineHeight: "1.5",
                      }}
                    >
                      আপনার মূল্যবান রেটিং ও অনুভূতি প্রকাশ করুন৤ আপনার মতামত লেখিকার অনুপ্রেরণা৤
                    </p>

                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => {
                          const user = currentUser || getCurrentUser();
                          if (!user || !user.emailVerified) {
                            window.dispatchEvent(
                              new CustomEvent("ahona-open-auth-modal", {
                                detail: { mode: user ? "verify" : "login", reason: "rating", title: readingItem.title },
                              })
                            );
                            return;
                          }
                          setRatingModalItem({
                            id: readingItem.id,
                            title: readingItem.title,
                            type: readingItem.type,
                          });
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px 22px",
                          borderRadius: "24px",
                          background: "var(--gold, #caa869)",
                          color: "#1c2420",
                          border: "none",
                          fontSize: "14px",
                          fontWeight: 600,
                          cursor: "pointer",
                          boxShadow: "0 4px 14px rgba(202, 168, 105, 0.35)",
                          transition: "transform 0.15s ease",
                        }}
                      >
                        <span>⭐</span>
                        <span>
                          {userRating
                            ? `আপনার দেওয়া রেটিং: ${formatBengaliNumber(userRating)}/৫ ★ (পরিবর্তন করুন)`
                            : "রেটিং দিন (১ থেকে ৫ স্টার)"}
                        </span>
                      </button>

                      {currentRatingStats.count > 0 && (
                        <span
                          style={{
                            fontSize: "12.5px",
                            color: "var(--muted)",
                            padding: "6px 12px",
                            background: "var(--card)",
                            borderRadius: "16px",
                            border: "1px solid var(--line)",
                          }}
                        >
                          গড় রেটিং: <strong>{formatBengaliNumber(currentRatingStats.average)} ★</strong> ({formatBengaliNumber(currentRatingStats.count)} জন পাঠক)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Reading Footer Actions */}
              <div className="reader-footer-actions">
                <button
                  type="button"
                  className={`clap-btn ${likedPosts.includes(readingItem.id) ? "liked" : ""}`}
                  onClick={handleClap}
                  title={likedPosts.includes(readingItem.id) ? "ভালোবাসা প্রত্যাহার করুন" : "একটি লাইক দিন (প্রতিটি গল্পে একবার)"}
                >
                  <span>{likedPosts.includes(readingItem.id) ? "❤️" : "🤍"}</span>
                  <span>
                    {likedPosts.includes(readingItem.id) ? "ভালোবাসা দিয়েছেন" : "ভালোবাসা জানান"} ({formatBengaliNumber(readingItem.claps || 0)})
                  </span>
                </button>

                <button
                  type="button"
                  className="reader-btn"
                  onClick={() => setIsCommentsOpen(true)}
                  style={{ padding: "8px 16px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  title="মন্তব্যসমূহ দেখুন বা নতুন মন্তব্য লিখুন"
                >
                  <span>💬</span>
                  <span>মন্তব্য করুন ({formatBengaliNumber(readerCommentsCount)})</span>
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

              {/* 
                Novel Episode Navigation:
                Next Episode / Previous Episode buttons & "No more episodes" indicator
              */}
              {(() => {
                if (!readingItem.novelId) return null;
                const novel = novels.find((n) => n.id === readingItem.novelId);
                if (!novel || !novel.episodes || novel.episodes.length === 0) return null;

                const episodes = novel.episodes;
                const currentIndex = episodes.findIndex(
                  (e) => e.id === readingItem.id || e.episodeNumber === readingItem.episodeNumber
                );
                if (currentIndex === -1) return null;

                const prevEpisode = currentIndex > 0 ? episodes[currentIndex - 1] : null;
                const nextEpisode = currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;

                return (
                  <div
                    style={{
                      marginTop: "24px",
                      padding: "16px 20px",
                      borderRadius: "14px",
                      background: "var(--surface, rgba(202, 168, 105, 0.08))",
                      border: "1px solid var(--line, #e2e8f0)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                      {prevEpisode ? (
                        <button
                          type="button"
                          onClick={() => {
                            openEpisodeInReader(novel, prevEpisode);
                            if (readingScrollRef.current) {
                              readingScrollRef.current.scrollTop = 0;
                            }
                            setTimeout(() => {
                              if (readingScrollRef.current) {
                                readingScrollRef.current.scrollTop = 0;
                              }
                            }, 20);
                          }}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "20px",
                            border: "1px solid var(--line)",
                            background: "var(--card, #ffffff)",
                            color: "var(--ink)",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span>←</span>
                          <span>পূর্ববর্তী পর্ব (পর্ব {formatBengaliNumber(prevEpisode.episodeNumber)})</span>
                        </button>
                      ) : <div />}

                      {nextEpisode ? (
                        <button
                          type="button"
                          onClick={() => {
                            openEpisodeInReader(novel, nextEpisode);
                            if (readingScrollRef.current) {
                              readingScrollRef.current.scrollTop = 0;
                            }
                            setTimeout(() => {
                              if (readingScrollRef.current) {
                                readingScrollRef.current.scrollTop = 0;
                              }
                            }, 20);
                          }}
                          style={{
                            padding: "9px 20px",
                            borderRadius: "20px",
                            border: "none",
                            background: "var(--accent, #a04834)",
                            color: "#ffffff",
                            fontSize: "13.5px",
                            fontWeight: 600,
                            cursor: "pointer",
                            boxShadow: "0 3px 10px rgba(160, 72, 52, 0.25)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span>পরবর্তী পর্ব পড়ুন</span>
                          <span>(পর্ব {formatBengaliNumber(nextEpisode.episodeNumber)}: {nextEpisode.title})</span>
                          <span>→</span>
                        </button>
                      ) : (
                        <div
                          style={{
                            padding: "10px 16px",
                            borderRadius: "20px",
                            background: "var(--card, #ffffff)",
                            border: "1px dashed var(--line)",
                            color: "var(--muted)",
                            fontSize: "13.5px",
                            fontWeight: 600,
                            textAlign: "center",
                            width: "100%",
                          }}
                        >
                          ✨ আর কোনো পর্ব নেই (সর্বশেষ প্রকাশিত পর্ব) ✨
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
                </>
              )}

              {/* Reader Comments Modal */}
              <CommentsSection
                targetId={readingItem.id}
                targetTitle={readingItem.title}
                isOpen={isCommentsOpen}
                onClose={() => setIsCommentsOpen(false)}
                onOpenAuthModal={() => window.dispatchEvent(new CustomEvent("ahona-open-auth-modal"))}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 
        Rating Modal for Stories, Poems, and Novel parts
      */}
      {ratingModalItem && (
        <RatingModal
          isOpen={Boolean(ratingModalItem)}
          onClose={() => setRatingModalItem(null)}
          targetId={ratingModalItem.id}
          targetTitle={ratingModalItem.title}
          targetType={ratingModalItem.type}
          onRatingSubmitted={() => {
            showToast("আপনার রেটিং জমা দেওয়া হয়েছে! অনেক ধন্যবাদ৤ 🌟");
            reloadData();
          }}
        />
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="toast-notice" role="status" aria-live="polite">
          <span style={{ fontSize: "14px", color: "var(--accent, #caa869)" }}>✦</span>
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255, 255, 255, 0.45)",
              fontSize: "14px",
              cursor: "pointer",
              marginLeft: "6px",
              padding: "2px 4px",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Lightbox for viewing full uncropped original artwork */}
      {mounted && fullViewImageUrl && typeof document !== "undefined" && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999999,
            backgroundColor: "rgba(10, 8, 6, 0.94)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.2s ease-out",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setFullViewImageUrl(null);
          }}
        >
          <button
            type="button"
            onClick={() => setFullViewImageUrl(null)}
            style={{
              position: "absolute",
              top: "20px",
              right: "24px",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "#ffffff",
              fontSize: "20px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            ✕
          </button>

          <div
            style={{
              maxWidth: "92vw",
              maxHeight: "85vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
            }}
          >
            <img
              src={fullViewImageUrl}
              alt="Full Original Main Artwork"
              style={{
                maxWidth: "100%",
                maxHeight: "85vh",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>
          <p style={{ marginTop: "14px", color: "rgba(255,255,255,0.75)", fontSize: "13px" }}>
            মূল পূর্ণাঙ্গ ছবি (Original Full Artwork)
          </p>
        </div>,
        document.body
      )}

      {/* Literary Footer */}
      <Footer />
    </div>
  );
}
