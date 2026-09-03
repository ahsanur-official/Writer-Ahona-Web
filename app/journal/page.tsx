"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPosts, Post } from "@/lib/store";
import Link from "next/link";

export default function JournalPage() {
  const [journals, setJournals] = useState<Post[]>([]);

  useEffect(() => {
    const all = getPosts();
    setJournals(all.filter((p) => p.type === "দিনলিপি" || p.type === "প্রবন্ধ"));
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <main style={{ flex: 1, padding: "50px 5vw 80px", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
        <div style={{ marginBottom: "20px" }}>
          <Link href="/" prefetch={true} style={{ fontSize: "13px", color: "var(--muted)", textDecoration: "underline" }}>
            ← মূল পাতায় ফিরে যান
          </Link>
        </div>

        <p className="eyebrow">LITERARY DIARY & THOUGHTS · দিনলিপি</p>
        <h1 style={{ fontSize: "clamp(34px, 5vw, 54px)", margin: "0 0 20px", fontWeight: "600", lineHeight: "1.15" }}>
          সাহিত্যিক <em>দিনলিপি ও ভাবনা</em>
        </h1>
        <p style={{ fontSize: "16px", color: "var(--muted)", lineHeight: "1.8", margin: "0 0 40px", maxWidth: "680px" }}>
          প্রতিদিনের খাপছাড়া চিন্তা, অসমাপ্ত কবিতার লাইন আর অনুভূতির টুকরো কথা—যা কোনো গল্প নয়, কেবল নিজের মুখোমুখি হওয়া।
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {journals.map((item) => (
            <article
              key={item.id}
              className="scroll-reveal"
              style={{
                background: "var(--card)",
                border: "1px solid var(--line)",
                borderRadius: "8px",
                padding: "28px",
                boxShadow: "var(--shadow)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "var(--muted)",
                  fontFamily: "DM Mono, monospace",
                  fontSize: "12px",
                  marginBottom: "12px",
                }}
              >
                <span>{item.date}</span>
                <span>{item.readTime} পাঠ</span>
              </div>
              <h2 style={{ fontSize: "24px", margin: "0 0 14px", fontWeight: "700" }}>{item.title}</h2>
              <div
                style={{
                  fontSize: "16px",
                  lineHeight: "1.9",
                  color: "var(--ink)",
                  whiteSpace: "pre-line",
                }}
              >
                {item.body}
              </div>
            </article>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
