"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewPost() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  useEffect(() => { if (localStorage.getItem("ahona-admin") !== "true") router.replace("/admin/login"); }, [router]);
  const setCover = (file?: File) => { if (file) setImage(URL.createObjectURL(file)); };
  return <main className="editor-page"><a href="/admin/posts" className="admin-back">← সব লেখায় ফিরে যান</a><header><div><p className="eyebrow">NEW PUBLICATION</p><h1>নতুন <em>লেখা</em></h1></div><button className="admin-button" onClick={() => setSaved(true)}>প্রকাশ করুন →</button></header>{saved && <p className="saved">লেখাটি প্রকাশের জন্য সংরক্ষণ করা হয়েছে।</p>}<form className="editor-form" onSubmit={(e) => { e.preventDefault(); setSaved(true); }}><label>লেখার ধরন<select defaultValue="গল্প"><option>গল্প</option><option>কবিতা</option><option>প্রবন্ধ</option></select></label><label>শিরোনাম<input required placeholder="আপনার লেখার শিরোনাম" /></label><label>Cover ছবি<input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0])} /></label>{image && <img className="cover-preview" src={image} alt="নির্বাচিত cover preview" />}<label>ছোট ভূমিকা<textarea rows={3} placeholder="পাঠকের জন্য কয়েকটি কথা লিখুন..." /></label><label>মূল লেখা<textarea className="writing-area" required placeholder="এখানে লেখা শুরু করুন..." /></label><div><button className="draft" type="submit">খসড়া সংরক্ষণ</button></div></form></main>;
}
