"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUp } from "lucide-react";

const APP_ROUTES = [
  "/",
  "/about",
  "/journal",
  "/contact",
  "/admin",
  "/admin/dashboard",
  "/admin/novels",
  "/admin/posts",
];

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navProgress, setNavProgress] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const navBarRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 1. Eager Route Prefetching & Fast Switching Engine
  useEffect(() => {
    // Eagerly prefetch core routes in background after initial load
    const timer = setTimeout(() => {
      APP_ROUTES.forEach((route) => {
        try {
          router.prefetch(route);
        } catch {
          // ignore prefetch errors
        }
      });
    }, 150);

    // Dynamic hover & touch prefetcher on internal links
    const handlePointerOver = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("/#") &&
        !href.startsWith("//") &&
        !href.includes(":")
      ) {
        try {
          router.prefetch(href);
        } catch {
          // ignore
        }
      }
    };

    // Instant click feedback: start top loader immediately on link press
    const handleAnchorClickFeedback = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      // Check if it's an internal route that switches pages
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("/#") &&
        !href.startsWith("#") &&
        href !== pathname
      ) {
        setIsNavigating(true);
        setNavProgress(65);
      }
    };

    document.addEventListener("pointerover", handlePointerOver, { passive: true });
    document.addEventListener("touchstart", handlePointerOver, { passive: true });
    document.addEventListener("click", handleAnchorClickFeedback, { capture: true });

    return () => {
      clearTimeout(timer);
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("touchstart", handlePointerOver);
      document.removeEventListener("click", handleAnchorClickFeedback, { capture: true });
    };
  }, [router, pathname]);

  // Fast finish when pathname updates
  useEffect(() => {
    // Instant window scroll reset on route change
    window.scrollTo(0, 0);

    // Complete top loading bar smoothly
    setNavProgress(100);
    const t = setTimeout(() => {
      setIsNavigating(false);
      setNavProgress(0);
    }, 180);

    return () => clearTimeout(t);
  }, [pathname]);

  // 2. High-Performance Scroll Reveal Engine
  const setupScrollObserver = useCallback(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.06,
        rootMargin: "0px 0px -30px 0px",
      }
    );

    observerRef.current = observer;

    const selectors = [
      ".scroll-reveal",
      ".scroll-reveal-scale",
      ".scroll-reveal-left",
      ".scroll-reveal-right",
      ".work-card",
      ".serial-card",
      ".section-head",
      ".hero-slider-container",
      ".footer-quote-box",
      ".footer-links-col",
      ".about-profile-card",
      "main article",
    ];

    const elements = document.querySelectorAll<HTMLElement>(selectors.join(", "));
    const windowHeight = window.innerHeight;

    // Track card siblings for stagger cascading
    let currentParent: HTMLElement | null = null;
    let siblingIndex = 0;

    elements.forEach((el) => {
      // Default to .scroll-reveal if no reveal class is explicitly set
      if (
        !el.classList.contains("scroll-reveal") &&
        !el.classList.contains("scroll-reveal-scale") &&
        !el.classList.contains("scroll-reveal-left") &&
        !el.classList.contains("scroll-reveal-right")
      ) {
        el.classList.add("scroll-reveal");
      }

      // Add stagger class if element is in a multi-card grid
      const parent = el.parentElement;
      if (parent && (parent.classList.contains("work-grid") || parent.classList.contains("novel-showcase-grid"))) {
        if (parent === currentParent) {
          siblingIndex++;
        } else {
          currentParent = parent;
          siblingIndex = 0;
        }
        const staggerClass = `stagger-${Math.min(siblingIndex % 4 + 1, 4)}`;
        el.classList.add(staggerClass);
      }

      // If already in top viewport on mount, reveal instantly without animation delay
      const rect = el.getBoundingClientRect();
      if (rect.top < windowHeight * 0.85) {
        el.classList.add("revealed");
      } else {
        observer.observe(el);
      }
    });
  }, []);

  useEffect(() => {
    // Run after DOM render
    const frame = requestAnimationFrame(() => {
      setupScrollObserver();
    });

    // Re-observe when DOM mutations happen (e.g. tab switches, search filters) with debounce
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const observer = new MutationObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        setupScrollObserver();
      }, 150);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      cancelAnimationFrame(frame);
      if (debounceTimer) clearTimeout(debounceTimer);
      observer.disconnect();
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [setupScrollObserver, pathname]);

  // 3. Scroll Progress & Scroll-to-Top visibility tracker
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const winScroll = window.scrollY || document.documentElement.scrollTop;
          const height =
            document.documentElement.scrollHeight -
            document.documentElement.clientHeight;
          const progress = height > 0 ? (winScroll / height) * 100 : 0;

          setScrollProgress(progress);
          setShowScrollTop(winScroll > 280);

          if (progressBarRef.current) {
            progressBarRef.current.style.transform = `scaleX(${progress / 100})`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    // Smooth Anchor Link Handler (only for in-page anchors like #novels, #writings)
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (href && (href.startsWith("#") || href.startsWith("/#"))) {
        const id = href.replace(/^\/?#/, "");
        if (!id) return;
        const targetElement = document.getElementById(id);
        if (targetElement) {
          e.preventDefault();
          const headerOffset = 80;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("click", handleAnchorClick);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {/* Super Fast Route Loader Bar (Instant visual response) */}
      <div
        id="global-route-loader"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          zIndex: 1000000,
          pointerEvents: "none",
          opacity: isNavigating ? 1 : 0,
          transition: "opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div
          ref={navBarRef}
          style={{
            height: "100%",
            width: isNavigating ? `${navProgress}%` : "0%",
            background: "linear-gradient(90deg, var(--gold, #caa869), var(--accent, #a04834), #e59d4c)",
            transition: isNavigating ? "width 0.22s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
            boxShadow: "0 0 10px rgba(202, 168, 105, 0.9), 0 0 4px rgba(160, 72, 52, 0.8)",
          }}
        />
      </div>

      {/* Global Scroll Reading Progress Indicator */}
      <div
        id="global-scroll-progress-container"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          zIndex: 999999,
          pointerEvents: "none",
          background: "transparent",
        }}
      >
        <div
          ref={progressBarRef}
          id="global-scroll-progress-bar"
          style={{
            height: "100%",
            width: "100%",
            transformOrigin: "left",
            transform: `scaleX(${scrollProgress / 100})`,
            background: "linear-gradient(90deg, var(--gold, #caa869) 0%, var(--accent, #a04834) 100%)",
            transition: "transform 0.04s linear",
          }}
        />
      </div>

      {/* Main Page Content with Super-Fast Page Switching Animation */}
      <div key={pathname} className="page-switch-container">
        {children}
      </div>

      {/* Global Smooth Scroll To Top Button */}
      <button
        type="button"
        id="global-scroll-to-top"
        onClick={scrollToTop}
        aria-label="শীর্ষে ফিরে যান (Scroll to top)"
        title="উপরে ফিরে যান"
        style={{
          position: "fixed",
          bottom: "28px",
          right: "28px",
          width: "46px",
          height: "46px",
          borderRadius: "50%",
          background: "var(--card, #ffffff)",
          color: "var(--ink, #1c2420)",
          border: "1px solid var(--line, #dcd7cb)",
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.14)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 9999,
          opacity: showScrollTop ? 1 : 0,
          transform: showScrollTop ? "translateY(0) scale(1)" : "translateY(16px) scale(0.85)",
          pointerEvents: showScrollTop ? "auto" : "none",
          transition: "opacity 0.2s ease, transform 0.2s ease, border-color 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-3px) scale(1.06)";
          e.currentTarget.style.borderColor = "var(--gold, #caa869)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0) scale(1)";
          e.currentTarget.style.borderColor = "var(--line, #dcd7cb)";
        }}
      >
        <ArrowUp size={20} strokeWidth={2.2} />
      </button>
    </>
  );
}
