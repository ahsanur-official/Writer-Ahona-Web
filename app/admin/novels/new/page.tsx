"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewNovel() {
  const router = useRouter(); const [cover, setCover] = useState<string | null>(null); const [saved, setSaved] = useState(false);
  useEffect(() => { if (localStorage.getItem("ahona-admin") !== "true") router.replace("/admin/login"); }, [router]);
  return <main className="editor-page"><a href="/admin/novels" className="admin-back">← উপন্যাসে ফিরে যান</a><header><div><p className="eyebrow">NEW NOVEL</p><h1>নতুন <em>উপন্যাস</em></h1></div><button className="admin-button" onClick={() => setSaved(true)}>উপন্যাস তৈরি করুন →</button></header>{saved && <p className="saved">উপন্যাসটি তৈরি হয়েছে। এবার Episodes পরিচালনা করুন থেকে প্রথম পর্ব যোগ করুন।</p>}<form className="editor-form" onSubmit={(e) => { e.preventDefault(); setSaved(true); }}><label>উপন্যাসের নাম<input required placeholder="যেমন: নদীর ওপারে রোদ" /></label><label>একটি cover ছবি<input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) setCover(URL.createObjectURL(file)); }} /></label>{cover ? <img className="novel-cover-preview" src={cover} alt="উপন্যাসের cover preview" /> : <div className="cover-empty">একটি সুন্দর portrait cover এখানে দেখা যাবে</div>}<label>উপন্যাসের সংক্ষিপ্ত পরিচিতি<textarea rows={4} placeholder="পাঠককে গল্পটি সম্পর্কে কিছু বলুন..." /></label><label>ধরন / Genre<input placeholder="যেমন: রোমান্টিক, রহস্য, সামাজিক" /></label><label>স্ট্যাটাস<select defaultValue="চলমান"><option>চলমান</option><option>সম্পূর্ণ</option></select></label><button className="draft" type="submit">উপন্যাস তৈরি করুন</button></form></main>;
}
