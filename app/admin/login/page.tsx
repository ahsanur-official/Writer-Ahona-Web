"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (email === "admin@ahnaislam.com" && password === "ahona2026") {
      localStorage.setItem("ahona-admin", "true");
      window.location.assign("/admin/dashboard");
      return;
    }
    setError("ইমেইল অথবা পাসওয়ার্ড সঠিক নয়। দয়া করে সঠিক তথ্য দিন।");
  };

  return (
    <main className="admin-login">
      <section className="login-intro">
        <Link href="/" className="brand">
          <span className="mark">আ</span>
          <div>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", display: "block" }}>
              অহনা ইসলাম
            </span>
            <small style={{ fontSize: "11px", color: "var(--adm-sidebar-muted)" }}>
              সাহিত্য ও উপন্যাস CMS
            </small>
          </div>
        </Link>

        <div style={{ margin: "40px 0" }}>
          <p className="eyebrow">ADMINISTRATOR CMS</p>
          <h1>
            তোমার শব্দের
            <br />
            <em>ঘরে স্বাগতম</em>
          </h1>
          <p>
            নতুন গল্প, কবিতা, ধারাবাহিক উপন্যাস ও পর্ব প্রকাশনা এবং পাঠকদের মন্তব্য নিয়ন্ত্রণ—সবকিছু এক নিপুণ জায়গায়।
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <small style={{ color: "var(--adm-sidebar-muted)", fontSize: "12px" }}>
            © ২০২৬ অহনা ইসলাম · জয়পুরহাট, বাংলাদেশ
          </small>
          <Link href="/" style={{ color: "var(--adm-sidebar-muted)", fontSize: "12px", textDecoration: "none" }}>
            ← মূল সাইটে ফিরুন
          </Link>
        </div>
      </section>

      <section className="login-form-wrap">
        <form onSubmit={submit} className="login-form">
          <p className="eyebrow">AUTHOR LOGIN</p>
          <h2>প্রবেশ করুন</h2>
          <p className="login-copy">
            Demo তথ্য নিচে দেওয়া আছে—বাটনে চাপলে স্বয়ংক্রিয়ভাবে পূরণ হয়ে যাবে।
          </p>

          <label>
            ইমেইল
            <input
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="আপনার এডমিন ইমেইল লিখুন"
            />
          </label>

          <label>
            পাসওয়ার্ড
            <input
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </label>

          {error && (
            <div className="form-error" role="alert">
              <span style={{ fontSize: "16px", flexShrink: 0 }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button className="admin-button" type="submit">
            ড্যাশবোর্ডে প্রবেশ করুন <span>→</span>
          </button>

          <div style={{ marginTop: "18px", textAlign: "center" }}>
            <Link
              href="/"
              style={{
                color: "var(--adm-muted)",
                fontSize: "13px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>←</span>
              <span>মূল ওয়েবসাইটে ফিরে যান</span>
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
