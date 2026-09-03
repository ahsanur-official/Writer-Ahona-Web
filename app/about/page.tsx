/* eslint-disable @next/next/no-img-element */
"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AUTHOR_INFO, useAuthorProfile } from "@/lib/store";
import Link from "next/link";

export default function AboutPage() {
  const author = useAuthorProfile();
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <main style={{ flex: 1, padding: "50px 5vw 80px", maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
        <div style={{ marginBottom: "20px" }}>
          <Link href="/" style={{ fontSize: "13px", color: "var(--muted)", textDecoration: "underline" }}>
            ← মূল পাতায় ফিরে যান
          </Link>
        </div>

        <p className="eyebrow">ABOUT THE WRITER · পরিচিতি</p>
        <h1 style={{ fontSize: "clamp(34px, 5vw, 56px)", margin: "0 0 30px", fontWeight: "600", lineHeight: "1.15" }}>
          লেখিকার <em>কথা ও জীবন</em>
        </h1>

        {/* Profile Card */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "36px",
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: "12px",
            padding: "32px",
            boxShadow: "var(--shadow)",
            marginBottom: "48px",
            alignItems: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <img
              src={(!author.avatarUrl || author.avatarUrl.includes("unsplash.com")) ? "/ahona.png" : author.avatarUrl}
              alt={author.name || AUTHOR_INFO.name}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/ahona.png";
              }}
              style={{
                width: "220px",
                height: "220px",
                borderRadius: "50%",
                objectFit: "cover",
                objectPosition: "center 20%",
                border: "4px solid var(--gold)",
                boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                margin: "0 auto 16px",
              }}
            />
            <h2 style={{ fontSize: "26px", margin: "0 0 6px" }}>{author.name || AUTHOR_INFO.name}</h2>
            <div style={{ fontSize: "14px", color: "var(--muted)", fontFamily: "DM Mono, monospace" }}>
              {author.englishName || AUTHOR_INFO.englishName} · {author.location || AUTHOR_INFO.location}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: "20px", margin: "0 0 14px", color: "var(--accent)" }}>
              &ldquo;শব্দের ভেতর এক পরম আশ্রয়&rdquo;
            </h3>
            <div style={{ fontSize: "16px", lineHeight: "1.9", color: "var(--ink)", margin: "0 0 16px", whiteSpace: "pre-line" }}>
              {author.bio || AUTHOR_INFO.bio}
            </div>
            <p style={{ fontSize: "15px", lineHeight: "1.8", color: "var(--muted)" }}>
              শৈশব থেকেই সাহিত্যের সাথে আমার সখ্যতা। বর্ষার বিকেলে জানালার ধারে বসে খাতার পাতায় কলম চালানো থেকে শুরু করে আজকের এই ডিজিটাল আঙিনায় গল্প বুনে চলা—সবকিছুর পেছনে রয়েছে পাঠকদের অফুরন্ত ভালোবাসা।
            </p>
          </div>
        </div>

        {/* Literary Journey Sections */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "28px", marginBottom: "48px" }}>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "8px",
              padding: "24px",
            }}
          >
            <h3 style={{ fontSize: "20px", margin: "0 0 12px" }}>📖 লেখার ধরন ও দর্শন</h3>
            <p style={{ fontSize: "14px", lineHeight: "1.8", color: "var(--muted)" }}>
              আমার উপন্যাসের মূল উপজীব্য মানবমনের জটিল মনস্তত্ত্ব, সম্পর্কের ভাঙাগড়া এবং প্রতিদিনের সাধারণ মানুষের নীরব হাহাকার। গল্পের সমাপ্তিতে পরম বাস্তবতার মুখোমুখি হওয়াটাই আমার কাছে সাহিত্যের সবচেয়ে বড় স্বার্থকতা।
            </p>
          </div>

          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "8px",
              padding: "24px",
            }}
          >
            <h3 style={{ fontSize: "20px", margin: "0 0 12px" }}>🌿 অনুপ্রেরণা</h3>
            <p style={{ fontSize: "14px", lineHeight: "1.8", color: "var(--muted)" }}>
              গ্রামের নীরব নদী, পুরোনো চিঠি, ট্রেনের জানালা আর মানুষের না-বলা চোখের ভাষা। শব্দহীন মুহূর্তগুলোই আমার কলমকে সবচেয়ে বেশি আলোড়িত করে।
            </p>
          </div>

          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "8px",
              padding: "24px",
            }}
          >
            <h3 style={{ fontSize: "20px", margin: "0 0 12px" }}>💌 পাঠকদের উদ্দেশ্যে</h3>
            <p style={{ fontSize: "14px", lineHeight: "1.8", color: "var(--muted)" }}>
              প্রতিটি পর্ব পড়ার পর আপনারা যে মন্তব্য ও চিঠি পাঠান, তা আমার নতুন লেখার খোরাক জোগায়। আপনাদের সাথে শব্দের মাধ্যমে এই সংযোগ আমার জীবনের সবচেয়ে বড় প্রাপ্তি।
            </p>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <Link
            href="/#writings"
            className="button dark"
            style={{ marginRight: "14px" }}
          >
            লেখাগুলো পড়ুন →
          </Link>
          <Link href="/contact" className="button outline">
            লেখিকাকে চিঠি পাঠান
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
