/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getPosts, savePosts, deletePost, formatBengaliNumber, Post, countWordsWithoutSpace } from "@/lib/store";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function Posts() {
  const router = useRouter();
  const [items, setItems] = useState<Post[]>([]);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("সব");
  const [filterStatus, setFilterStatus] = useState("সব");
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemTitle?: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("ahona-admin") !== "true") {
      router.replace("/admin/login");
    } else {
      setItems(getPosts());
    }

    const handler = () => setItems(getPosts());
    window.addEventListener("ahona_store_updated", handler);
    return () => window.removeEventListener("ahona_store_updated", handler);
  }, [router]);

  const handleDelete = (id: string, title: string) => {
    setConfirmState({
      isOpen: true,
      title: "লেখাটি মুছে ফেলবেন?",
      message: "এই লেখাটি ওয়েবসাইট এবং ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হবে। এই কাজটি অপরিবর্তনীয়।",
      itemTitle: title,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await deletePost(id);
          setItems(getPosts());
        } finally {
          setIsDeleting(false);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const toggleStatus = (id: string) => {
    const updated = items.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          status: p.status === "প্রকাশিত" ? ("খসড়া" as const) : ("প্রকাশিত" as const),
        };
      }
      return p;
    });
    savePosts(updated);
    setItems(updated);
  };

  const filtered = useMemo(() => {
    return items.filter((post) => {
      const matchesQuery =
        !query ||
        post.title.toLowerCase().includes(query.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(query.toLowerCase());
      const matchesType = filterType === "সব" || post.type === filterType;
      const matchesStatus = filterStatus === "সব" || post.status === filterStatus;
      return matchesQuery && matchesType && matchesStatus;
    });
  }, [items, query, filterType, filterStatus]);

  return (
    <main className="posts-page">
      <header className="post-top">
        <a href="/admin/dashboard" className="admin-back">
          ← ড্যাশবোর্ড
        </a>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <a href="/admin/posts/new" className="admin-button">
            + নতুন লেখা প্রকাশ
          </a>
        </div>
      </header>

      <p className="eyebrow">CONTENT MANAGEMENT</p>
      <h1>
        সব <em>প্রকাশনা</em>
      </h1>

      {/* Tools */}
      <div className="posts-tools">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="শিরোনাম বা বিষয়বস্তু দিয়ে খুঁজুন..."
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="সব">সকল ধারা (গল্প/কবিতা/প্রবন্ধ)</option>
          <option value="গল্প">গল্প</option>
          <option value="কবিতা">কবিতা</option>
          <option value="উপন্যাস">উপন্যাস</option>
          <option value="প্রবন্ধ">প্রবন্ধ</option>
          <option value="দিনলিপি">দিনলিপি</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="সব">সকল স্ট্যাটাস</option>
          <option value="প্রকাশিত">প্রকাশিত</option>
          <option value="খসড়া">খসড়া</option>
        </select>
      </div>

      {/* Table & Cards */}
      <div className="posts-table">
        <div className="table-head">
          <span>শিরোনাম ও বিবরণ</span>
          <span>ধারা</span>
          <span>স্ট্যাটাস (ক্লিক করে পরিবর্তন)</span>
          <span>তারিখ ও পাঠকপ্রিয়তা</span>
          <span style={{ textAlign: "right" }}>ব্যবস্থাপনা</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "36px", textAlign: "center", color: "var(--adm-muted)" }}>
            কোনো লেখা খুঁজে পাওয়া যায়নি।
          </div>
        ) : (
          filtered.map((item) => (
            <div className="table-row" key={item.id}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                {item.coverUrl ? (
                  <img
                    src={item.coverUrl}
                    alt={item.title}
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "6px",
                      objectFit: "cover",
                      flexShrink: 0,
                      border: "1px solid var(--adm-line)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "6px",
                      background: "rgba(0,0,0,0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "20px",
                    }}
                  >
                    📖
                  </div>
                )}
                <div>
                  <strong style={{ fontSize: "15px", color: "var(--adm-ink)" }}>{item.title}</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--adm-muted)", lineHeight: "1.5" }}>
                    {item.excerpt.slice(0, 75)}...
                  </p>
                </div>
              </div>

              <div>
                <span className="status" style={{ background: "var(--adm-bg)", border: "1px solid var(--adm-line)" }}>
                  {item.type}
                </span>
              </div>

              <div>
                <button
                  onClick={() => toggleStatus(item.id)}
                  className={`status ${item.status === "প্রকাশিত" ? "live" : "draft"}`}
                  style={{
                    border: "none",
                    cursor: "pointer",
                    padding: "6px 12px",
                    fontWeight: 600,
                  }}
                  title="ক্লিক করে স্ট্যাটাস পরিবর্তন করুন"
                >
                  {item.status} ⇄
                </button>
              </div>

              <div style={{ fontSize: "12px", color: "var(--adm-muted)" }}>
                <span>{item.date}</span>
                <br />
                <small style={{ color: "var(--adm-accent)", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                  <span>{formatBengaliNumber(item.claps || 0)} claps</span>
                  <span>·</span>
                  <span>{item.readTime}</span>
                  <span>·</span>
                  <span style={{ color: "var(--adm-ink)", background: "rgba(197,160,89,0.15)", padding: "1px 6px", borderRadius: "4px", fontSize: "11px" }}>
                    📝 {formatBengaliNumber(countWordsWithoutSpace(item.body))} শব্দ
                  </span>
                </small>
              </div>

              <div className="table-row-actions">
                <Link
                  href={`/admin/posts/${item.id}/edit`}
                  className="admin-button edit-btn"
                  title="লেখা ও ছবি সম্পাদনা করুন"
                >
                  সম্পাদনা ও ছবি ✎
                </Link>
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  className="admin-button danger delete-btn"
                  title="মুছে ফেলুন"
                >
                  মুছুন
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Literary High-Contrast Custom Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        itemTitle={confirmState.itemTitle}
        isLoading={isDeleting}
        onConfirm={confirmState.onConfirm}
        onCancel={() => !isDeleting && setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </main>
  );
}
