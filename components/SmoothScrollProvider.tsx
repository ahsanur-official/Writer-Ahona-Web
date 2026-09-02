"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowUp } from "lucide-react";

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Enable hardware-accelerated smooth scrolling on html & body
    if (typeof document !== "undefined") {
      document.documentElement.style.scrollBehavior = "smooth";
      document.body.style.scrollBehavior = "smooth";
    }

    // 2. Scroll Progress & Scroll-to-Top visibility tracker using requestAnimationFrame
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

    // 3. Smooth IntersectionObserver for Scroll Animations (both user & admin)
    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: "0px 0px -40px 0px",
      threshold: [0, 0.05, 0.15],
    };

    const revealedElements = new WeakSet<Element>();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          target.classList.add("scroll-revealed");
          target.classList.remove("scroll-hidden");
          revealedElements.add(target);
          observer.unobserve(target);
        }
      });
    }, observerOptions);

    const selector = [
      ".scroll-animate",
      ".novel-card",
      ".post-card",
      ".stat-card",
      ".admin-card",
      ".journal-entry",
      ".about-card",
      ".contact-card",
      ".footer-quote-box",
      ".footer-links-col",
      ".posts-table",
      ".episode-list",
      ".reading-box",
      ".hero-lead-box",
      "section > h2",
      ".section-header",
    ].join(", ");

    const registerElements = () => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el, index) => {
        if (!revealedElements.has(el)) {
          const htmlEl = el as HTMLElement;
          const rect = el.getBoundingClientRect();
          // If already in viewport on load, reveal immediately without lag
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            htmlEl.classList.add("scroll-revealed");
            revealedElements.add(el);
          } else {
            htmlEl.classList.add("scroll-hidden");
            // Add subtle cascading transition delay based on sibling index
            const siblingIndex = Array.from(el.parentElement?.children || []).indexOf(el);
            if (siblingIndex > 0 && siblingIndex <= 6) {
              htmlEl.style.transitionDelay = `${siblingIndex * 65}ms`;
            }
            observer.observe(el);
          }
        }
      });
    };

    registerElements();

    // Re-register dynamically loaded cards / route transitions with MutationObserver
    const mutationObserver = new MutationObserver(() => {
      registerElements();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // 4. Smooth Anchor Link Handler (e.g., #novels, #writings)
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
          const headerOffset = 90;
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
      observer.disconnect();
      mutationObserver.disconnect();
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
      {/* 1. Global Smooth Top Scroll Progress Indicator */}
      <div
        id="global-scroll-progress-container"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "3.5px",
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
            transition: "transform 0.08s ease-out",
            boxShadow: "0 0 10px rgba(202, 168, 105, 0.5)",
          }}
        />
      </div>

      {/* Main Page Content */}
      {children}

      {/* 2. Global Smooth Scroll To Top Button (Mobile & Desktop) */}
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
          transition: "opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-3px) scale(1.06)";
          e.currentTarget.style.boxShadow = "0 8px 25px rgba(0, 0, 0, 0.18)";
          e.currentTarget.style.borderColor = "var(--gold, #caa869)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0) scale(1)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.12)";
          e.currentTarget.style.borderColor = "var(--line, #dcd7cb)";
        }}
      >
        <ArrowUp size={20} strokeWidth={2.2} />
      </button>
    </>
  );
}
