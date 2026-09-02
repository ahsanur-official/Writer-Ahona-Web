import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-container" style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "40px 20px" }}>
      <p style={{ fontFamily: "monospace", fontSize: "14px", letterSpacing: "2px", opacity: 0.7, marginBottom: "16px" }}>৪০৪ · পৃষ্ঠা পাওয়া যায়নি</p>
      <h1 style={{ fontSize: "48px", fontWeight: "normal", margin: "0 0 16px 0" }}>শব্দগুলো হয়তো হারিয়ে গেছে</h1>
      <p style={{ fontSize: "16px", maxWidth: "420px", lineHeight: "1.7", marginBottom: "32px", opacity: 0.85 }}>
        আপনি যে পৃষ্ঠাটি খুঁজছেন তা সরানো হয়েছে অথবা এর ঠিকানা পরিবর্তিত হয়েছে।
      </p>
      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 24px",
          border: "1px solid currentColor",
          textDecoration: "none",
          fontSize: "14px",
          borderRadius: "4px"
        }}
      >
        ← মূল পাতায় ফিরে যান
      </Link>
    </main>
  );
}
