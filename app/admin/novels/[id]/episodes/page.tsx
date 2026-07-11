"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const episodeNames = ["বৃষ্টিভেজা সকাল", "অচেনা চিঠি", "নদীর ডাক", "শেষ ট্রেন"];
export default function Episodes() {
  const params = useParams<{ id: string }>(); const router = useRouter(); const [ready, setReady] = useState(false);
  useEffect(() => { if (localStorage.getItem("ahona-admin") !== "true") router.replace("/admin/login"); else setReady(true); }, [router]);
  if (!ready) return <main className="admin-loading">লোড হচ্ছে...</main>;
  return <main className="episodes-page"><header className="post-top"><a href="/admin/novels" className="admin-back">← সব উপন্যাস</a><Link className="admin-button" href={`/admin/novels/${params.id}/episodes/new`}>+ নতুন Episode</Link></header><p className="eyebrow">NOVEL / EPISODES</p><h1>নদীর ওপারে <em>রোদ</em></h1><div className="novel-episode-head"><div className="mini-cover">ন</div><p>একটি cover image পুরো উপন্যাসের জন্য ব্যবহৃত হচ্ছে। নিচে শুধু episode-এর title, number ও লেখা যোগ করুন।</p></div><div className="episode-list">{episodeNames.map((title, index) => <article key={title}><span>পর্ব {index + 1}</span><strong>{title}</strong><small>প্রকাশিত · ০{index + 2} জুলাই, ২০২৬</small><button>সম্পাদনা</button></article>)}</div></main>;
}
