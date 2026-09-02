"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminLogin() {
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("email") === "admin@ahnaislam.com" && data.get("password") === "ahona2026") {
      localStorage.setItem("ahona-admin", "true");
      window.location.assign("/admin/dashboard");
      return;
    }
    setError("ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।");
  };
  return (
    <main className="admin-login">
      <section className="login-intro">
        <Link href="/" className="brand">
          <span className="mark">আ</span>
          <span>
            অহনা ইসলাম<small>সাহিত্য ও উপন্যাস আঙিনা</small>
          </span>
        </Link>
        <div>
          <p className="eyebrow">ADMINISTRATOR</p>
          <h1>
            তোমার শব্দের
            <br />
            <em>ঘরে স্বাগতম</em>
          </h1>
          <p>লেখা, উপন্যাস, পর্ব প্রকাশনা ও পাঠকদের সাথে সংযোগ—সবকিছু এক নিপুণ জায়গায়।</p>
        </div>
        <small>© ২০২৬ অহনা ইসলাম · ঢাকা</small>
      </section>
      <section className="login-form-wrap">
        <form onSubmit={submit} className="login-form">
          <p className="eyebrow">AUTHOR LOGIN</p>
          <h2>প্রবেশ করুন</h2>
          <p className="login-copy">
            Demo তথ্য আগে থেকেই পূরণ করা আছে—শুধু নিচে &apos;ড্যাশবোর্ডে যান&apos; বাটনে চাপুন।
          </p>
          <label>
            ইমেইল
            <input name="email" type="email" defaultValue="admin@ahnaislam.com" required />
          </label>
          <label>
            পাসওয়ার্ড
            <input name="password" type="password" defaultValue="ahona2026" required />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="admin-button" type="submit">
            ড্যাশবোর্ডে যান <span>→</span>
          </button>
          <p className="demo-note">ডেমো লগইন: admin@ahnaislam.com · ahona2026</p>
        </form>
      </section>
    </main>
  );
}
