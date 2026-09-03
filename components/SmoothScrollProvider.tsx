"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const navBarRef = useRef<HTMLDivElement>(null);

  // Instant feedback on route change
  useEffect(() => {
    // Reset window scroll instantly on route change
    window.scrollTo(0, 0);
    setIsNavigating(true);
    const t = setTimeout(() => setIsNavigating(false), 200);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    // Scroll Progress & Scroll-to-Top visibility tracker using requestAnimationFrame
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
          setShowScrollTop(winScroll > 320);

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
      {/* Instant Route Transition Top Indicator */}
      <div
        id="global-route-loader"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "2.5px",
          zIndex: 1000000,
          pointerEvents: "none",
          opacity: isNavigating ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}
      >
        <div
          ref={navBarRef}
          style={{
            height: "100%",
            width: isNavigating ? "100%" : "0%",
            background: "linear-gradient(90deg, var(--gold, #caa869), var(--accent, #a04834))",
            transition: isNavigating ? "width 0.2s ease-out" : "none",
            boxShadow: "0 0 8px rgba(202, 168, 105, 0.8)",
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
            transition: "transform 0.05s linear",
          }}
        />
      </div>

      {/* Main Page Content */}
      {children}

      {/* Global Smooth Scroll To Top Button (Mobile & Desktop) */}
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
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 9999,
          opacity: showScrollTop ? 1 : 0,
          transform: showScrollTop ? "translateY(0) scale(1)" : "translateY(16px) scale(0.85)",
          pointerEvents: showScrollTop ? "auto" : "none",
          transition: "opacity 0.2s ease, transform 0.2s ease",
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
