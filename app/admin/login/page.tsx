"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fillDemo = () => {
    setEmail("admin@ahonaislam.com");
    setPassword("ahona2026");
    setError("");
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Save session flag and server token
        localStorage.setItem("ahona-admin", "true");
        if (data.token) {
          localStorage.setItem("ahona_admin_token", data.token);
        }

        const from = new URLSearchParams(window.location.search).get("from") || "/admin/dashboard";
        window.location.assign(from);
      } else {
        setError(data.error || "ইমেইল অথবা পাসওয়ার্ড সঠিক নয়। দয়া করে সঠিক তথ্য দিন।");
      }
    } catch {
      setError("সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। দয়া করে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
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
            অ্যাডমিন ড্যাশবোর্ডে প্রবেশ করতে আপনার ইমেইল ও পাসওয়ার্ড প্রদান করুন।
          </p>

          {/* Demo Credentials Quick Fill Card */}
          <div
            style={{
              background: "rgba(139, 44, 44, 0.05)",
              border: "1px solid rgba(139, 44, 44, 0.2)",
              borderRadius: "8px",
              padding: "12px 14px",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
                flexWrap: "wrap",
                gap: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--adm-accent)",
                  letterSpacing: "0.3px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>🔑</span> ডেমো অ্যাডমিন তথ্য:
              </span>
              <button
                type="button"
                onClick={fillDemo}
                style={{
                  background: "var(--adm-accent)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "5px 10px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ১-ক্লিকে পূরণ করুন ⚡
              </button>
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--adm-muted)",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div>
                <strong>ইমেইল:</strong>{" "}
                <code
                  style={{
                    color: "var(--adm-text)",
                    background: "#ffffff",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    border: "1px solid var(--adm-line)",
                  }}
                >
                  admin@ahonaislam.com
                </code>{" "}
                <span style={{ fontSize: "11px", opacity: 0.7 }}>(বা admin)</span>
              </div>
              <div>
                <strong>পাসওয়ার্ড:</strong>{" "}
                <code
                  style={{
                    color: "var(--adm-text)",
                    background: "#ffffff",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    border: "1px solid var(--adm-line)",
                  }}
                >
                  ahona2026
                </code>
              </div>
            </div>
          </div>

          <label>
            ইমেইল বা ইউজারনেম
            <input
              name="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@ahonaislam.com"
            />
          </label>

          <label>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>পাসওয়ার্ড</span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--adm-accent)",
                  fontSize: "11px",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
              </button>
            </div>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
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

          <button className="admin-button" type="submit" disabled={loading}>
            {loading ? "যাচাই করা হচ্ছে..." : "ড্যাশবোর্ডে প্রবেশ করুন"} <span>→</span>
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
