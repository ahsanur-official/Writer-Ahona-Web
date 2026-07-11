"use client";

import { useState } from "react";

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
  return <main className="admin-login"><section className="login-intro"><a href="/" className="brand"><span className="mark">আ</span><span>আহনা ইসলাম<small>লেখালেখি</small></span></a><div><p className="eyebrow">ADMINISTRATOR</p><h1>তোমার শব্দের<br /><em>ঘরে স্বাগতম</em></h1><p>লেখা, প্রকাশনা ও পাঠকদের সঙ্গে সংযোগ—সবকিছু এক জায়গায়।</p></div><small>© ২০২৬ আহনা ইসলাম</small></section><section className="login-form-wrap"><form onSubmit={submit} className="login-form"><p className="eyebrow">ADMIN LOGIN</p><h2>প্রবেশ করুন</h2><p className="login-copy">Demo তথ্য আগে থেকেই দেওয়া আছে—শুধু ড্যাশবোর্ডে যান চাপুন।</p><label>ইমেইল<input name="email" type="email" defaultValue="admin@ahnaislam.com" required /></label><label>পাসওয়ার্ড<input name="password" type="password" defaultValue="ahona2026" required /></label>{error && <p className="form-error">{error}</p>}<button className="admin-button" type="submit">ড্যাশবোর্ডে যান <span>→</span></button><p className="demo-note">Demo login: admin@ahnaislam.com · ahona2026</p></form></section></main>;
}
