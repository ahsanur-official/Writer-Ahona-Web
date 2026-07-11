"use client";

import { useMemo, useState } from "react";

type Work = { title: string; type: string; excerpt: string; date: string; tone: string; read: string };

const works: Work[] = [
  { title: "জোছনার নিচে চিঠি", type: "গল্প", excerpt: "যে চিঠিগুলো পাঠানো হয়নি, তারাও কি কোনোদিন ঠিকানা খুঁজে পায়?", date: "০৮ জুলাই, ২০২৬", tone: "rose", read: "৭ মিনিট" },
  { title: "অপূর্ণতার মানচিত্র", type: "কবিতা", excerpt: "তোমার চলে যাওয়ার পর শহরটা একটু বেশি নীল হয়ে আছে।", date: "০২ জুলাই, ২০২৬", tone: "sage", read: "৩ মিনিট" },
  { title: "নদীর ওপারে রোদ", type: "প্রবন্ধ", excerpt: "নিজের কাছে ফিরে আসার পথ কখনও কখনও খুব দীর্ঘ হয়।", date: "২৬ জুন, ২০২৬", tone: "gold", read: "৫ মিনিট" },
];

const categories = ["সব লেখা", "কবিতা", "গল্প", "উপন্যাস", "প্রবন্ধ"];

function Mark() { return <span className="mark" aria-hidden="true">আ</span>; }

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("সব লেখা");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const visibleWorks = useMemo(() => works.filter((work) =>
    (active === "সব লেখা" || work.type === active) &&
    `${work.title} ${work.excerpt}`.includes(query.trim())
  ), [active, query]);
  const subscribe = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("ধন্যবাদ! নতুন লেখা প্রকাশ হলে আপনাকে জানানো হবে।");
  };

  return <main>
    <header className="nav-shell">
      <a href="#home" className="brand" aria-label="অহনা ইসলাম হোম"><Mark /><span>অহনা ইসলাম<small>লেখালেখি</small></span></a>
      <button className="menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="মেনু খুলুন">☰</button>
      <nav className={menuOpen ? "open" : ""}>
        <a href="#writings">লেখাসমূহ</a><a href="#about">আমার কথা</a><a href="#journal">জার্নাল</a><a href="#contact">যোগাযোগ</a>
      </nav>
      <a className="nav-cta" href="#newsletter">সঙ্গে থাকুন <span>↗</span></a>
    </header>

    <section className="hero" id="home">
      <div className="hero-copy">
        <p className="eyebrow">লেখালেখির ঘর · ২০২৬</p>
        <h1>শব্দের ভেতর<br /><em>এক পৃথিবী</em></h1>
        <p className="intro">জীবন, ভালোবাসা আর না-বলা অনুভূতির গল্প লিখি। স্বাগত আমার ছোট্ট শব্দের জগতে।</p>
        <div className="hero-actions"><a className="button dark" href="#writings">লেখা পড়ুন <span>↓</span></a><a className="text-link" href="#about">আমার গল্প <span>→</span></a></div>
      </div>
      <div className="portrait-wrap" aria-label="অহনা ইসলামের প্রতীকী প্রতিকৃতি">
        <div className="sun"></div><div className="portrait"><div className="hair"></div><div className="face"></div><div className="book"></div></div>
        <p>লেখাই আমার<br />নিজেকে খোঁজা</p><span className="arc">○ ○ ○ ○ ○ ○ ○</span>
      </div>
      <div className="hero-side"><span className="vertical">শব্দ · স্মৃতি · স্বপ্ন</span><span>স্ক্রল করে পড়ুন ↓</span></div>
    </section>

    <section className="latest" id="writings">
      <div className="section-head"><div><p className="eyebrow">সাম্প্রতিক প্রকাশনা</p><h2>নতুন <em>লেখা</em></h2></div><a className="text-link" href="#all">সব লেখা দেখুন <span>→</span></a></div>
      <div className="filter-row" aria-label="লেখার ধরন">
        {categories.map((category) => <button key={category} onClick={() => setActive(category)} className={active === category ? "active" : ""}>{category}</button>)}
        <label className="search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="লেখা খুঁজুন" aria-label="লেখা খুঁজুন" /></label>
      </div>
      <div className="work-grid">
        {visibleWorks.map((work, index) => <article className={`work-card ${work.tone}`} key={work.title}>
          <div className="card-art"><span>{index === 0 ? "✦" : index === 1 ? "❋" : "◒"}</span><i></i></div>
          <div className="work-content"><div className="meta"><span>{work.type}</span><span>{work.date}</span></div><h3>{work.title}</h3><p>{work.excerpt}</p><a href={`#${work.title}`}>পড়তে থাকুন <span>→</span><small>{work.read}</small></a></div>
        </article>)}
        {visibleWorks.length === 0 && <p className="empty">এই খোঁজে কোনো লেখা পাওয়া যায়নি।</p>}
      </div>
    </section>

    <section className="quote" id="journal"><div className="quote-mark">“</div><blockquote>কিছু অনুভূতি বলা যায় না,<br />তাই আমি <em>লিখি।</em></blockquote><p>— অহনা ইসলাম</p></section>

    <section className="about" id="about"><div className="about-art"><span>আ</span><div className="leaf">❦</div></div><div><p className="eyebrow">আমার কথা</p><h2>স্মৃতির সুতোয়<br /><em>বোনা গল্প</em></h2><p>আমি অহনা। শব্দের কাছে আমার বারবার ফিরে আসা—কখনও কবিতায়, কখনও গল্পে। মানুষের ভেতরের নীরবতা আর ছোট ছোট সুখের মুহূর্ত আমাকে লিখতে শেখায়।</p><a className="button outline" href="#contact">আরও জানুন <span>→</span></a></div></section>

    <section className="newsletter" id="newsletter"><div><p className="eyebrow">চিঠির মতো করে</p><h2>নতুন লেখা<br />সবার আগে <em>পান</em></h2></div><form onSubmit={subscribe}><label htmlFor="email">ইমেইল ঠিকানা</label><div><input id="email" type="email" required placeholder="আপনার ইমেইল লিখুন" /><button type="submit">যুক্ত হোন <span>→</span></button></div>{notice && <p className="notice" role="status">{notice}</p>}</form></section>

    <footer id="contact"><div className="footer-brand"><a className="brand" href="#home"><Mark /><span>অহনা ইসলাম<small>লেখালেখি</small></span></a><p>ভালোবাসা ও যত্নে লেখা,<br />আপনার জন্য।</p></div><div><p className="eyebrow">খুঁজে নিন</p><a href="#writings">লেখাসমূহ</a><a href="#about">আমার কথা</a><a href="#journal">জার্নাল</a></div><div><p className="eyebrow">যোগাযোগ</p><a href="mailto:hello@ahnaislam.com">hello@ahnaislam.com</a><a href="#instagram">Instagram</a><a href="#facebook">Facebook</a></div><div className="footer-bottom">© ২০২৬ অহনা ইসলাম <span>ঢাকা, বাংলাদেশ</span></div></footer>
  </main>;
}
