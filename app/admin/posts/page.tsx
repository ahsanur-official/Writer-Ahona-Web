"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getPosts, savePosts, deletePost, formatBengaliNumber, Post } from "@/lib/store";

export default function Posts() {
  const router = useRouter();
  const [items, setItems] = useState<Post[]>([]);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("সব");
  const [filterStatus, setFilterStatus] = useState("সব");

  useEffect(() => {
    if (localStorage.getItem("ahona-admin") !== "true") {
      router.replace("/admin/login");
    } else {
      setItems(getPosts());
    }
  }, [router]);

  const handleDelete = (id: string, title: string) => {
    if (confirm(`আপনি কি সত্যি '${title}' মুছে ফেলতে চান?`)) {
      deletePost(id);
      setItems(getPosts());
    }
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
        <div style={{ display: "flex", gap: "10px" }}>
          <a href="/" target="_blank" className="admin-back">
            ওয়েবসাইট দেখুন ↗
          </a>
          <a href="/admin/posts/new" className="admin-button">
            + নতুন লেখা
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
          placeholder="শিরোনাম বা বিষয়বস্তু খুঁজুন..."
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: "10px 14px", border: "1px solid #d9d3c8", background: "#fffdf8" }}
        >
          <option value="সব">সকল ধরন</option>
          <option value="গল্প">গল্প</option>
          <option value="কবিতা">কবিতা</option>
          <option value="উপন্যাস">উপন্যাস</option>
          <option value="প্রবন্ধ">প্রবন্ধ</option>
          <option value="দিনলিপি">দিনলিপি</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: "10px 14px", border: "1px solid #d9d3c8", background: "#fffdf8" }}
        >
          <option value="সব">সকল স্ট্যাটাস</option>
          <option value="প্রকাশিত">প্রকাশিত</option>
          <option value="খসড়া">খসড়া</option>
        </select>
      </div>

      {/* Table */}
      <div className="posts-table">
        <div className="table-head">
          <span>শিরোনাম</span>
          <span>ধরন</span>
          <span>স্ট্যাটাস (ক্লিক করে পরিবর্তন)</span>
          <span>তারিখ ও পাঠক</span>
          <span>ব্যবস্থাপনা</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "28px", textAlign: "center", color: "#697066" }}>
            কোনো লেখা খুঁজে পাওয়া যায়নি।
          </div>
        ) : (
          filtered.map((item) => (
            <div className="table-row" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <p style={{ margin: "3px 0 0", fontSize: "11px", color: "#747a71" }}>
                  {item.excerpt.slice(0, 50)}...
                </p>
              </div>

              <span>{item.type}</span>

              <button
                onClick={() => toggleStatus(item.id)}
                className={`status ${item.status === "প্রকাশিত" ? "live" : ""}`}
                style={{
                  border: "none",
                  cursor: "pointer",
                  width: "fit-content",
                  padding: "4px 8px",
                }}
                title="ক্লিক করে স্ট্যাটাস পরিবর্তন করুন"
              >
                {item.status} ⇄
              </button>

              <span style={{ fontSize: "11px" }}>
                {item.date}
                <br />
                <small style={{ color: "#747a71" }}>
                  {formatBengaliNumber(item.claps || 0)} claps · {item.readTime}
                </small>
              </span>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  style={{ color: "#a1493b", cursor: "pointer", border: 0, background: "none" }}
                  title="মুছে ফেলুন"
                >
                  মুছুন
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
