"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const novels = [{ id: "nodi", title: "নদীর ওপারে রোদ", episodes: 12, status: "চলমান" }, { id: "chaya", title: "ছায়ার শহর", episodes: 28, status: "সম্পূর্ণ" }];

export default function Novels() {
  const router = useRouter(); const [ready, setReady] = useState(false);
  useEffect(() => { if (localStorage.getItem("ahona-admin") !== "true") router.replace("/admin/login"); else setReady(true); }, [router]);
  if (!ready) return <main className="admin-loading">লোড হচ্ছে...</main>;
  return <main className="novels-page"><header className="post-top"><a href="/admin/dashboard" className="admin-back">← ড্যাশবোর্ড</a><a href="/admin/novels/new" className="admin-button">+ নতুন উপন্যাস</a></header><p className="eyebrow">NOVEL MANAGEMENT</p><h1>আমার <em>উপন্যাস</em></h1><p className="novel-help">উপন্যাস তৈরি করার সময় শুধু একবার cover image দিন। প্রতিটি episode-এ আর cover লাগবে না।</p><div className="novel-grid">{novels.map((novel, index) => <article key={novel.id} className="novel-card"><div className={`novel-cover cover-${index}`}><span>{index === 0 ? "ন" : "ছ"}</span></div><div><span className="status live">{novel.status}</span><h2>{novel.title}</h2><p>{novel.episodes}টি episode প্রকাশিত</p><a href={`/admin/novels/${novel.id}/episodes`}>Episodes পরিচালনা করুন →</a></div></article>)}</div></main>;
}
