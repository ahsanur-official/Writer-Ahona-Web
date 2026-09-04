"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { AUTHOR_INFO, addSubscriber, useAuthorProfile } from "@/lib/store";

export default function Footer() {
  const author = useAuthorProfile();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    addSubscriber(email);
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 5000);
  };

  return (
    <footer className="literary-footer">
      <div className="footer-inner">
        {/* Left: Poetic Quote Card */}
        <div className="footer-quote-box scroll-reveal">
          <p className="footer-quote-text">
            &ldquo;রাতের গভীরতায় যখন পৃথিবী ঘুমে মগ্ন হয়, তখন কলম আর কাঁচের জানালার আলো এক অন্য পৃথিবীর সন্ধান দেয়। শব্দের এই যাত্রা আপনাদের জন্যই।&rdquo;
          </p>
          <div className="footer-quote-author">
            — {author.name || AUTHOR_INFO.name} · সাহিত্য ও উপন্যাস
          </div>
        </div>

        {/* Center: Quick Literary Links */}
        <div className="footer-links-col scroll-reveal">
          <h4>সূচিপত্র</h4>
          <ul>
            <li>
              <Link href="/" prefetch={true}>মূল পাতা</Link>
            </li>
            <li>
              <Link href="/#novels">উপন্যাস ও ধারাবাহিক</Link>
            </li>
            <li>
              <Link href="/#writings">ছোটগল্প ও কবিতা</Link>
            </li>
            <li>
              <Link href="/about" prefetch={true}>লেখিকার কথা ও জীবন</Link>
            </li>
            <li>
              <Link href="/journal" prefetch={true}>সাহিত্যিক দিনলিপি</Link>
            </li>
            <li>
              <Link href="/contact" prefetch={true}>চিঠিপত্র ও পাঠক প্রতিক্রিয়া</Link>
            </li>
          </ul>
        </div>

        {/* Right: Newsletter / Reader Letters */}
        <div className="footer-links-col scroll-reveal">
          <h4>পাঠক পরিবার</h4>
          <p style={{ fontSize: "13px", lineHeight: "1.7", color: "var(--muted)", margin: "0 0 14px" }}>
            নতুন গল্প বা উপন্যাসের পর্ব প্রকাশিত হওয়ার সাথে সাথে আপনার ইমেইলে পড়তে যুক্ত হোন।
          </p>
          {subscribed ? (
            <div
              style={{
                background: "rgba(45, 90, 63, 0.12)",
                border: "1px solid rgba(45, 90, 63, 0.28)",
                borderRadius: "8px",
                padding: "10px 14px",
                color: "#2d5a3f",
                fontSize: "13px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                animation: "toastSlideUp 0.3s ease-out",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "#2d5a3f",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                ✓
              </span>
              <span>আপনাকে আন্তরিক ধন্যবাদ! পাঠক পরিবারে স্বাগতম। 🍃</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} style={{ display: "flex", gap: "6px" }}>
              <input
                type="email"
                required
                placeholder="আপনার ইমেইল ঠিকানা..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--line)",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  fontSize: "13px",
                  color: "var(--ink)",
                  flex: 1,
                  outline: "none",
                }}
              />
              <button
                type="submit"
                style={{
                  background: "var(--ink)",
                  color: "var(--paper)",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: "4px",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                যুক্ত হোন
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Bottom Bar: Copyright Notice */}
      <div className="footer-bottom-bar" style={{ justifyContent: "center", textAlign: "center" }}>
        <div>
          © {new Date().getFullYear()} {author.name || AUTHOR_INFO.name} ({author.englishName || AUTHOR_INFO.englishName}) · জয়পুরহাট, বাংলাদেশ। সর্বস্বত্ব সংরক্ষিত।
        </div>
      </div>
    </footer>
  );
}
