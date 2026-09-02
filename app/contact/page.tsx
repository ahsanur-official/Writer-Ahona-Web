"use client";

import { useState, FormEvent } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AUTHOR_INFO, addComment } from "@/lib/store";
import Link from "next/link";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    // Save as reader letter/comment
    addComment({
      targetId: "author-letter",
      targetTitle: subject.trim() || "পাঠকের চিঠি",
      authorName: name.trim(),
      content: message.trim(),
    });

    setSent(true);
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <main style={{ flex: 1, padding: "50px 5vw 80px", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
        <div style={{ marginBottom: "20px" }}>
          <Link href="/" style={{ fontSize: "13px", color: "var(--muted)", textDecoration: "underline" }}>
            ← মূল পাতায় ফিরে যান
          </Link>
        </div>

        <p className="eyebrow">LETTERS TO THE WRITER · যোগাযোগ</p>
        <h1 style={{ fontSize: "clamp(34px, 5vw, 54px)", margin: "0 0 20px", fontWeight: "600", lineHeight: "1.15" }}>
          চিঠিপত্র ও <em>বার্তা</em>
        </h1>
        <p style={{ fontSize: "16px", color: "var(--muted)", lineHeight: "1.8", margin: "0 0 36px" }}>
          লেখা নিয়ে আপনার ভালোলাগা, অনুভূতি বা কোনো জিজ্ঞাসা থাকলে সরাসরি লেখিকাকে চিঠি লিখতে পারেন। প্রতিটি চিঠিই সযত্নে পাঠ করা হয়।
        </p>

        {sent && (
          <div
            style={{
              padding: "18px 24px",
              background: "rgba(141, 182, 125, 0.2)",
              border: "1px solid #75a38a",
              borderRadius: "8px",
              marginBottom: "30px",
              color: "var(--ink)",
            }}
          >
            ✓ আপনার চিঠিটি লেখিকার কাছে পৌঁছেছে। সুন্দর বার্তার জন্য আন্তরিক ধন্যবাদ!
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: "10px",
            padding: "32px",
            boxShadow: "var(--shadow)",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>
              আপনার নাম *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: তানভীর চৌধুরী"
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "6px",
                border: "1px solid var(--line)",
                background: "var(--surface)",
                color: "var(--ink)",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>
              আপনার ইমেইল (উত্তর পেতে)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "6px",
                border: "1px solid var(--line)",
                background: "var(--surface)",
                color: "var(--ink)",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>
              চিঠির বিষয় / শিরোনাম
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="কোন গল্প বা উপন্যাস সংক্রান্ত চিঠি..."
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "6px",
                border: "1px solid var(--line)",
                background: "var(--surface)",
                color: "var(--ink)",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>
              আপনার চিঠি / বার্তা *
            </label>
            <textarea
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="এখানে আপনার অনুভূতি বা কথা লিখুন..."
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "6px",
                border: "1px solid var(--line)",
                background: "var(--surface)",
                color: "var(--ink)",
                fontSize: "14px",
                lineHeight: "1.7",
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>

          <button
            type="submit"
            className="button dark"
            style={{ alignSelf: "flex-start", marginTop: "10px" }}
          >
            চিঠি পাঠান ✉️
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
}
