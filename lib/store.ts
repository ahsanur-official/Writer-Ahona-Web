"use client";

import { useState, useEffect } from "react";
import {
  syncPostToFirestore,
  deletePostFromFirestore,
  syncNovelToFirestore,
  deleteNovelFromFirestore,
  syncAuthorProfileToFirestore,
  syncCommentToFirestore,
  deleteCommentFromFirestore,
  syncSubscriberToFirestore,
  deleteSubscriberFromFirestore,
  seedInitialDataIfEmpty,
  subscribeToFirestoreCollection,
  subscribeToAuthorProfile,
  COLLECTIONS,
} from "./firebase";

export type PostType = "গল্প" | "কবিতা" | "উপন্যাস" | "প্রবন্ধ" | "দিনলিপি";
export type Theme = "paper" | "midnight" | "amber" | "lavender";

export const MAX_WORDS_LIMIT = 6000;

export interface AuthorProfile {
  name: string;
  englishName: string;
  tagline: string;
  subTagline: string;
  avatarUrl: string;
  bio: string;
  location: string;
  email: string;
}

export const INITIAL_AUTHOR_PROFILE: AuthorProfile = {
  name: "অহনা ইসলাম",
  englishName: "Ahona Islam",
  tagline: "সাহিত্য ও উপন্যাস",
  subTagline: "শব্দের ভেতর এক পৃথিবী",
  avatarUrl: "/ahona.png",
  bio: `“অহনা ইসলাম” নামটি যদিও কাল্পনিক, তবুও এটা এখন এক বাস্তবিক পরিচিতি।
বাবা-মায়ের দেওয়া নাম আলাদা হলেও পাঠকের হৃদয়ে তিনি জায়গা করে নিয়েছেন “অহনা ইসলাম” নামেই। যা তার শখ ও লেখালেখির পরিচয়ের প্রতীক।
এই ছোট্ট লেখিকা “২০০৮ সালের ১২ ই মার্চ” পৃথিবীতে আসেন বাবা-মায়ের কোল আলো করে। বর্তমানে তিনি ইন্টার দ্বিতীয় বর্ষের ছাত্রী। অল্প বয়সেই কলমের জাদুতে গল্প, কবিতা আর উপন্যাসের জগতে নিজের আলাদা স্থান তৈরি করেছেন তিনি। তার লেখায় থাকে অনুভূতির উষ্ণতা, কল্পনার রঙ আর জীবনের স্পর্শ, যা পাঠককে বারবার টেনে আনে তার সৃষ্টির ভুবনে।`,
  location: "ঢাকা, বাংলাদেশ",
  email: "ahona.writer@gmail.com",
};

export const AUTHOR_INFO = INITIAL_AUTHOR_PROFILE;

export const LITERARY_IMAGE_PRESETS = {
  avatars: [
    { label: "অহনা ইসলাম (অফিসিয়াল ahona.png)", url: "/ahona.png" },
    { label: "অহনা ইসলাম (সাহিত্যিক প্রোফাইল)", url: "/ahona.png" },
    { label: "বইয়ের মাঝে চিন্তামগ্ন", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80" },
    { label: "জানালায় রোদের আলো", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80" },
    { label: "সাদাকালো আভিজাত্য", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80" },
  ],
  postCovers: [
    { label: "জোছনার রাত ও চিঠি", url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80" },
    { label: "অপূর্ণতার নীল মানচিত্র", url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80" },
    { label: "নদীর ওপারে স্বর্ণালী রোদ", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80" },
    { label: "বৃষ্টিভেজা কাঁচ ও চা", url: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1200&q=80" },
    { label: "নীরব ডায়েরি ও ঝর্ণাকলম", url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80" },
    { label: "গোধূলির আকাশ ও দিগন্ত", url: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1200&q=80" },
    { label: "পুরাতন বইয়ের সুবাস", url: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80" },
    { label: "নদীতে ভাসমান কাগজের নাও", url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80" },
  ],
  novelCovers: [
    { label: "নদী ও শান্ত কাশবন", url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80" },
    { label: "শহুরে কুয়াশা ও ছায়া", url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80" },
    { label: "ট্রেন ও গোধূলির স্টেশন", url: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1200&q=80" },
    { label: "পুরোনো কাঠের টেবিল ও মোমবাতি", url: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80" },
  ],
};

export function countWordsWithoutSpace(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function countCharacters(text: string, withoutSpaces: boolean = false): number {
  if (!text) return 0;
  return withoutSpaces ? text.replace(/\s+/g, "").length : text.length;
}

export function countSentences(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.split(/[।!?\n]+/).filter((s) => s.trim().length > 0).length;
}

export function countParagraphs(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.split(/\n+/).filter((p) => p.trim().length > 0).length;
}

export function countUniqueWords(text: string): number {
  if (!text || !text.trim()) return 0;
  const words = text.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return new Set(words).size;
}

export interface Post {
  id: string;
  title: string;
  type: PostType;
  excerpt: string;
  body: string;
  date: string;
  tone: "rose" | "sage" | "gold" | "lavender";
  readTime: string;
  coverUrl?: string;
  status: "প্রকাশিত" | "খসড়া";
  claps: number;
  views: number;
  featured?: boolean;
}

export interface NovelEpisode {
  id: string;
  novelId: string;
  episodeNumber: number;
  title: string;
  teaser: string;
  content: string;
  date: string;
  readTime: string;
  status: "প্রকাশিত" | "খসড়া";
}

export interface Novel {
  id: string;
  title: string;
  synopsis: string;
  genre: string;
  status: "চলমান" | "সম্পূর্ণ";
  coverLetter: string;
  coverTone: "rose" | "sage" | "gold" | "lavender";
  coverUrl?: string;
  episodesCount: number;
  episodes: NovelEpisode[];
}

export interface ReaderComment {
  id: string;
  targetId: string; // post id or episode id
  targetTitle: string;
  authorName: string;
  content: string;
  date: string;
  claps: number;
}

export interface Subscriber {
  id: string;
  email: string;
  date: string;
}

const INITIAL_POSTS: Post[] = [
  {
    id: "post-1",
    title: "জোছনার নিচে চিঠি",
    type: "গল্প",
    excerpt: "যে চিঠিগুলো পাঠানো হয়নি, তারাও কি কোনোদিন ঠিকানা খুঁজে পায়?",
    body: `রাত গভীর হলে জানালার ধারে একটি পুরোনো খাম রেখে দিই। তার ভেতরে জমে থাকে না-বলা কথা, অসমাপ্ত বিদায় আর ফিরে আসার ছোট্ট আশা।

শহরের কোলাহল যখন আস্তে আস্তে নিভে আসে, তখন দূর থেকে কোনো এক ট্রেনের হুইসেল ভেসে আসে। ভাবি, এই ট্রেনের যাত্রী কারা? কেউ কি ফিরছে কোনো হারানো আশ্রয়ে, নাকি কেবল পালিয়ে বেড়াচ্ছে নিজের ছায়া থেকে?

কাগজের ওপর কলমের স্পর্শে তৈরি হয় নিঃশব্দ সেতু। আমি লিখি—কোনো উত্তর পাওয়ার লোভে নয়, কেবল নিজেকে প্রবোধ দিতে যে অনুভূতিগুলো সত্যি ছিল। কাল সকালের রোদে হয়তো সব রঙ বিবর্ণ হয়ে যাবে, কিন্তু এই জোছনা আর অক্ষরের সাক্ষী হয়ে থাকবে রাত।`,
    date: "০৮ জুলাই, ২০২৬",
    tone: "rose",
    readTime: "৭ মিনিট",
    status: "প্রকাশিত",
    claps: 142,
    views: 1840,
    featured: true,
    coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "post-2",
    title: "অপূর্ণতার মানচিত্র",
    type: "কবিতা",
    excerpt: "তোমার চলে যাওয়ার পর শহরটা একটু বেশি নীল হয়ে আছে।",
    body: `তোমার চলে যাওয়ার পর শহরটা একটু বেশি নীল হয়ে আছে।
প্রতিটি ট্রাফিক সিগনালে থেমে থাকে আমার না-বলা ক্ষমা,
বাতাসের ঘ্রাণে এখনও ছড়িয়ে আছে পুরোনো সুর।

কিছু শূন্যতা পথের মতো—
তার শেষ দেখা যায় না,
তবু তার ভেতর দিয়েই একদিন আলোয় পৌঁছাতে হয়।
আমরা যারা ভাঙা কাঁচ কুড়িয়ে মালা গাঁথি,
তাদের বুকে রাত জাগা তারারা শব্দহীন গান গায়।`,
    date: "০২ জুলাই, ২০২৬",
    tone: "sage",
    readTime: "৩ মিনিট",
    status: "প্রকাশিত",
    claps: 98,
    views: 1220,
    featured: true,
    coverUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "post-3",
    title: "নদীর ওপারে রোদ",
    type: "প্রবন্ধ",
    excerpt: "নিজের কাছে ফিরে আসার পথ কখনও কখনও খুব দীর্ঘ হয়।",
    body: `নদী আমাদের শেখায়, থেমে না থেকেও শান্ত থাকা যায়। প্রতিটি বাঁক নতুন করে নিজের পরিচয় দেয়।

আমরা সারাজীবন স্থিরতার পেছনে ছুটি, অথচ পৃথিবীর সমস্ত সৌন্দর্য রচিত হয়েছে পরিবর্তনের ছন্দে। পাতার ঝরে পড়া থেকে ঋতুর প্রস্থান—সবকিছুতেই একটি নিপুণ সমর্পণ লুকিয়ে আছে।

নিজের মুখোমুখি দাঁড়ানো সবচেয়ে কঠিন কাজ। শব্দের আশ্রয় আমাকে সেই সাহস জোগায়। যখন মনের ভেতরে ঝড় ওঠে, তখন একটি শান্ত বাক্যের চেয়ে বড় আশ্রয় আর কিছু হতে পারে না।`,
    date: "২৬ জুন, ২০২৬",
    tone: "gold",
    readTime: "৫ মিনিট",
    status: "প্রকাশিত",
    claps: 76,
    views: 950,
    featured: true,
    coverUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "post-4",
    title: "বৃষ্টিভেজা কাঁচের ওপারে",
    type: "গল্প",
    excerpt: "বৃষ্টির ফোঁটা যখন কাঁচ স্পর্শ করে, স্মৃতিরা তখন ধুলো ঝেড়ে উঠে দাঁড়ায়।",
    body: `বারান্দার কোণে রাখা মাটির চায়ের কাপ থেকে ধোঁয়া উঠছে। বাইরে মেঘের ডাক আর বৃষ্টির মৃদু ছন্দ।

অনেক বছর আগের এক বর্ষার বিকেলে আমরা কথা দিয়েছিলাম, যে শহরেই যাই না কেন, প্রথম বর্ষার দিনে এক কাপ চা হাতে জানালার পাশে দাঁড়াব। আজ সেই কথা মনে পড়ে গেল। দূরত্ব হয়তো মানুষকে বদলে দেয়, কিন্তু স্মৃতিগুলো সবসময় সেই পুরোনো বিকেলেই স্থির থাকে।`,
    date: "১৮ জুন, ২০২৬",
    tone: "lavender",
    readTime: "৪ মিনিট",
    status: "প্রকাশিত",
    claps: 115,
    views: 1430,
    featured: true,
    coverUrl: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "post-5",
    title: "নীরবতার ব্যাকরণ",
    type: "দিনলিপি",
    excerpt: "সব কথা অক্ষরে প্রকাশ করা যায় না, কিছু অনুভূতি নিঃশ্বাসে বয়ে নিতে হয়।",
    body: `আজকের দিনটা অদ্ভুত রকম শান্ত। কোনো তারা নেই, কোনো তাড়া নেই। টেবিলে রাখা খোলা ডায়েরির সাদা পৃষ্ঠাগুলো যেন আমায় ডাকছে।

কখনও কখনও না লেখার মধ্যেও একটা গভীর কবিতা লুকিয়ে থাকে। নীরবতা সবসময় শূন্যতা নয়; এটি মাঝে মাঝে পরম তৃপ্তির আরেক নাম।`,
    date: "১০ জুন, ২০২৬",
    tone: "sage",
    readTime: "২ মিনিট",
    status: "প্রকাশিত",
    claps: 64,
    views: 810,
    featured: true,
    coverUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
  },
];

const INITIAL_NOVELS: Novel[] = [
  {
    id: "nodi",
    title: "নদীর ওপারে রোদ",
    synopsis:
      "একটি হারিয়ে যাওয়া গ্রামের স্মৃতি আর দুই অসমাপ্ত সম্পর্কের টানাপোড়েন নিয়ে রচিত উপন্যাস। যেখানে নদী শুধু জলপ্রবাহ নয়, জীবনের প্রতিটি ভাঙা-গড়ার নীরব সাক্ষী।",
    genre: "সামাজিক উপন্যাস · মনস্তাত্ত্বিক",
    status: "চলমান",
    coverLetter: "ন",
    coverTone: "sage",
    episodesCount: 4,
    episodes: [
      {
        id: "ep-1",
        novelId: "nodi",
        episodeNumber: 1,
        title: "বৃষ্টিভেজা সকাল",
        teaser: "প্রথম দর্শনের সেই ভিজে যাওয়া প্ল্যাটফর্ম আর ফেলে আসা একগুচ্ছ বেলি ফুল।",
        content: `ভোরের ট্রেনের জানালায় কুয়াশা মাখা কাঁচের ওপারে ধোঁয়াশা দিগন্ত। শায়নের কাঁধে ঝোলানো পুরোনো চামড়ার ব্যাগটায় কিছু বই আর অসমাপ্ত কিছু স্কেচ।

স্টেশনে যখন ট্রেনটা এসে থামল, তখন হালকা বৃষ্টি নামছিল। প্ল্যাটফর্মে কোনো মানুষ নেই, কেবল প্ল্যাটফর্ম মাস্টারের এক চিলতে হলুদ আলো। সেই আলোর নিচে দাঁড়িয়ে ছিল অনিন্দিতা—হাতে নীলচে ছাতা, চোখে অদ্ভুত এক দ্বিধা।

"তুমি সত্যি এলে?" অনিন্দিতার কণ্ঠে অবাক বিস্ময়।
শায়ন এক মুহূর্ত চুপ করে তাকিয়ে রইল। যে প্রশ্নের উত্তর খুঁজতে সে সাতশো মাইল পাড়ি দিয়েছে, সেই উত্তর কি এই এক বাক্যে দেওয়া সম্ভব?`,
        date: "০১ জুলাই, ২০২৬",
        readTime: "৮ মিনিট",
        status: "প্রকাশিত",
      },
      {
        id: "ep-2",
        novelId: "nodi",
        episodeNumber: 2,
        title: "অচেনা চিঠি",
        teaser: "পোস্টবক্সের নিচে পড়ে থাকা নীল খামের রহস্যময় হাতের লেখা।",
        content: `চিঠিটা পোস্ট অফিসের লাল বাক্সের তলায় ভিজে প্রায় বিবর্ণ হয়ে গিয়েছিল। উপরে কোনো প্রেরকের নাম নেই, কেবল প্রাপকের ঠিকানায় লেখা: 'নদীর ওপারের ঠিকানায়'।

অনিন্দিতা কাঠের ডেস্কে বসে চিঠিটা খুলল। সুপরিচিত সেই গোল গোল হাতের লেখা, যার সাথে তার কৈশোরের সমস্ত বিকেল জড়িয়ে ছিল। প্রতিটি লাইনে ফুটে উঠছে এক অদ্ভুত আর্তি। অতীতকে কি কখনও সত্যি মুছে ফেলা যায়? নাকি তা ছাইচাপা আগুনের মতো বুকের গভীরে সুপ্ত থাকে?`,
        date: "০৫ জুলাই, ২০২৬",
        readTime: "১০ মিনিট",
        status: "প্রকাশিত",
      },
      {
        id: "ep-3",
        novelId: "nodi",
        episodeNumber: 3,
        title: "নদীর ডাক",
        teaser: "বাঁশের সাঁকো পেরিয়ে যখন গোধূলির ছায়া নেমে আসে ঘাটের ধারে।",
        content: `ভাটার টানে নদীটা আজ বড় শান্ত। পাড়ের কাশবনগুলো বাতাসে এক অদ্ভুত ছন্দ তুলছে। শায়ন ঘাটের সিঁড়িতে বসে জলের দিকে তাকিয়ে ছিল।

গ্রামের মানুষগুলো হয়তো নদীর এই নীরব ভাষা বোঝে না। কিন্তু শায়নের কাছে এই শান্ত জল যেন সব ক্ষোভ আর অভিমান ধুয়ে নিয়ে যায়। অনিন্দিতা এসে পাশে বসল। দুজনের মাঝে এক বিঘত দূরত্ব, কিন্তু সেই দূরত্ব যেন পুরো এক শতাব্দীর।`,
        date: "১২ জুলাই, ২০২৬",
        readTime: "৭ মিনিট",
        status: "প্রকাশিত",
      },
      {
        id: "ep-4",
        novelId: "nodi",
        episodeNumber: 4,
        title: "শেষ ট্রেন",
        teaser: "বিকেলের লালচে আলোয় হুইসেলের শব্দ যখন বিদায়ের ঘণ্টা বাজায়।",
        content: `সিগন্যাল সবুজ হয়েছে। দূর থেকে ইঞ্জিনের গুরুগম্ভীর ধ্বনি স্পষ্ট থেকে স্পষ্টতর হচ্ছে।

অনিন্দিতা শায়নের চোখের দিকে তাকিয়ে বলল, "কিছু প্রশ্নের উত্তর না পাওয়াই হয়তো ভালো। কিছু গল্প অসমাপ্ত থাকলেই তাদের সৌন্দর্য বেঁচে থাকে।"
ট্রেনের দরজায় হাত রেখে শায়ন শেষবারের মতো তাকাল। নদী, কাশবন আর সেই নীল ছাতা—সবকিছু ধীরে ধীরে পেছনে মিলিয়ে যেতে লাগল।`,
        date: "২০ জুলাই, ২০২৬",
        readTime: "৯ মিনিট",
        status: "প্রকাশিত",
      },
    ],
  },
  {
    id: "chaya",
    title: "ছায়ার শহর",
    synopsis:
      "ঢাকা শহরের ব্যস্ত রাতের বুকে এক তরুণী চিত্রশিল্পীর আত্মানুসন্ধান। ক্যানভাসে রঙের আড়ালে লুকানো মানুষের গোপন দুঃখ ও বেঁচে থাকার লড়াই।",
    genre: "শহুরে রহস্য · আধুনিক জীবন",
    status: "সম্পূর্ণ",
    coverLetter: "ছ",
    coverTone: "rose",
    episodesCount: 2,
    episodes: [
      {
        id: "ch-1",
        novelId: "chaya",
        episodeNumber: 1,
        title: "ক্যানভাসে অন্ধকার",
        teaser: "একটি অসমাপ্ত চিত্রকর্ম যা কোনো এক নিশাচরের গোপন ডায়েরি বলে মনে হয়।",
        content: `স্টুডিওর বাতিটা টিমটিম করে জ্বলছে। দেয়ালজুড়ে ঝুলছে কালো আর ধূসর রঙের একরাশ ক্যানভাস। চারুলতা তুলি হাতে দাঁড়িয়ে আছে।

শহরের রাতের এক অদ্ভুত শব্দ আছে। দিনের আলোয় যা ঢাকা পড়ে হর্নের শব্দে, মাঝরাতে তা জীবন্ত হয়ে ওঠে। দূর থেকে ভেসে আসা অ্যাম্বুলেন্সের সাইরেন, ফুটপাতের কুকুরগুলোর একটানা ঘেউ ঘেউ, আর চায়ের টংয়ের কাপের টুংটাং শব্দ। চারুলতা অনুভব করে, এই শহরটা যেন একটা জীবন্ত শরীর।`,
        date: "১০ মে, ২০২৬",
        readTime: "৬ মিনিট",
        status: "প্রকাশিত",
      },
      {
        id: "ch-2",
        novelId: "chaya",
        episodeNumber: 2,
        title: "আলোর প্রত্যাবর্তন",
        teaser: "ভোরের প্রথম আলো যখন সমস্ত কালো দাগ মুছে দেয়।",
        content: `কালো রঙের স্তর ভেদ করে অবশেষে ক্যানভাসে ফুটে উঠল এক টুকরো সূর্যমুখী হলুদ। চারুলতা ক্লান্ত ভঙ্গিতে তুলিটা নামিয়ে রাখল।

অন্ধকার যতই দীর্ঘ হোক না কেন, ভোরের প্রথম কিরণ তাকে অস্বীকার করতে বাধ্য করে। মানুষও হয়তো তেমনি। দুঃখের শেষ সীমায় দাঁড়িয়ে সে আবার নতুন করে স্বপ্ন দেখার সাহস পায়।`,
        date: "২৪ মে, ২০২৬",
        readTime: "৮ মিনিট",
        status: "প্রকাশিত",
      },
    ],
  },
];

const INITIAL_COMMENTS: ReaderComment[] = [
  {
    id: "com-1",
    targetId: "post-1",
    targetTitle: "জোছনার নিচে চিঠি",
    authorName: "তানভীর হাসান",
    content: "অসাধারণ অনুভূতির প্রকাশ! এই চিঠি পড়ার পর নিজের জীবনের কিছু না-বলা কথার কথা মনে পড়ে গেল। লেখিকার কলম দীর্ঘজীবী হোক।",
    date: "০৯ জুলাই, ২০২৬",
    claps: 18,
  },
  {
    id: "com-2",
    targetId: "post-2",
    targetTitle: "অপূর্ণতার মানচিত্র",
    authorName: "মেহজাবিন আলম",
    content: "প্রতিটি লাইন বুকের ভেতরে গভীর দাগ কেটে যায়। বিশেষ করে 'ভাঙা কাঁচ কুড়িয়ে মালা গাঁথি' লাইনটি অনবদ্য।",
    date: "০৪ জুলাই, ২০২৬",
    claps: 12,
  },
  {
    id: "com-3",
    targetId: "nodi",
    targetTitle: "নদীর ওপারে রোদ",
    authorName: "সাদিয়া রহমান",
    content: "অনিন্দিতা আর শায়নের চরিত্রের টানাপোড়েন এত বাস্তবসম্মত যে চোখের সামনে দৃশ্যপট ভেসে ওঠে। পরবর্তী পর্বের অপেক্ষায় রইলাম!",
    date: "১৫ জুলাই, ২০২৬",
    claps: 24,
  },
];

const INITIAL_SUBSCRIBERS: Subscriber[] = [
  { id: "sub-1", email: "reader.sakib@gmail.com", date: "০১ জুলাই, ২০২৬" },
  { id: "sub-2", email: "nusrat.literature@yahoo.com", date: "০৫ জুলাই, ২০২৬" },
  { id: "sub-3", email: "abir.books@gmail.com", date: "১০ জুলাই, ২০২৬" },
];

const STORAGE_KEYS = {
  POSTS: "ahona_posts_data_v2",
  NOVELS: "ahona_novels_data_v2",
  COMMENTS: "ahona_comments_data_v2",
  SUBSCRIBERS: "ahona_subscribers_data_v2",
  BOOKMARKS: "ahona_bookmarks_v2",
  LIKED_POSTS: "ahona_liked_posts_v2",
  THEME: "ahona-theme",
  FONT_SIZE: "ahona-reader-font-size",
  AUTHOR_PROFILE: "ahona_author_profile_v2",
};

// Safe access for SSR
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Storage error:", err);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("ahona_store_updated", { detail: { key } }));
  } catch (err) {
    console.error("Storage save error:", err);
  }
}

export function getAuthorProfile(): AuthorProfile {
  const current = getFromStorage<AuthorProfile>(STORAGE_KEYS.AUTHOR_PROFILE, INITIAL_AUTHOR_PROFILE);
  // Ensure avatarUrl is /ahona.png and old unsplash placeholders are migrated
  if (
    !current.bio ||
    current.bio.startsWith("আমি অহনা। শব্দের কাছে") ||
    !current.avatarUrl ||
    current.avatarUrl.includes("unsplash.com")
  ) {
    const updated: AuthorProfile = {
      ...current,
      avatarUrl: "/ahona.png",
      bio: (!current.bio || current.bio.startsWith("আমি অহনা। শব্দের কাছে")) ? INITIAL_AUTHOR_PROFILE.bio : current.bio,
    };
    saveToStorage(STORAGE_KEYS.AUTHOR_PROFILE, updated);
    syncAuthorProfileToFirestore(updated);
    return updated;
  }
  return current;
}

export function saveAuthorProfile(profile: AuthorProfile): void {
  const sanitized: AuthorProfile = {
    ...profile,
    avatarUrl: (!profile.avatarUrl || profile.avatarUrl.includes("unsplash.com")) ? "/ahona.png" : profile.avatarUrl,
  };
  saveToStorage(STORAGE_KEYS.AUTHOR_PROFILE, sanitized);
  syncAuthorProfileToFirestore(sanitized);
}

export function useAuthorProfile(): AuthorProfile {
  const [profile, setProfile] = useState<AuthorProfile>(INITIAL_AUTHOR_PROFILE);

  useEffect(() => {
    setProfile(getAuthorProfile());
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail || customEvent.detail.key === STORAGE_KEYS.AUTHOR_PROFILE) {
        setProfile(getAuthorProfile());
      }
    };
    window.addEventListener("ahona_store_updated", handler);
    return () => window.removeEventListener("ahona_store_updated", handler);
  }, []);

  return profile;
}

export function getPosts(): Post[] {
  return getFromStorage<Post[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);
}

export function savePosts(posts: Post[]) {
  saveToStorage(STORAGE_KEYS.POSTS, posts);
}

export function addPost(post: Omit<Post, "id" | "date" | "claps" | "views">): Post {
  const posts = getPosts();
  const newPost: Post = {
    ...post,
    id: `post-${Date.now()}`,
    date: formatBengaliDate(new Date()),
    claps: 0,
    views: 1,
  };
  const updated = [newPost, ...posts];
  savePosts(updated);
  syncPostToFirestore(newPost);
  return newPost;
}

export function updatePost(postOrId: Post | string, partial?: Partial<Post>): void {
  const posts = getPosts();
  let updatedPostItem: Post | null = null;
  const updated = posts.map((p) => {
    if (typeof postOrId === "string") {
      if (p.id === postOrId) {
        updatedPostItem = { ...p, ...(partial || {}) };
        return updatedPostItem;
      }
      return p;
    } else {
      if (p.id === postOrId.id) {
        updatedPostItem = postOrId;
        return postOrId;
      }
      return p;
    }
  });
  savePosts(updated);
  if (updatedPostItem) {
    syncPostToFirestore(updatedPostItem);
  }
}

export function deletePost(id: string) {
  const posts = getPosts();
  savePosts(posts.filter((p) => p.id !== id));
  deletePostFromFirestore(id);
}

export function getLikedPosts(): string[] {
  return getFromStorage<string[]>(STORAGE_KEYS.LIKED_POSTS, []);
}

export function hasLikedPost(id: string): boolean {
  const liked = getLikedPosts();
  return liked.includes(id);
}

// Single-like enforcement per browser and IP address
export async function toggleLikePost(id: string): Promise<{
  success: boolean;
  liked: boolean;
  claps: number;
  message: string;
}> {
  const posts = getPosts();
  const currentPost = posts.find((p) => p.id === id);
  const currentClaps = currentPost?.claps || 0;
  const likedPosts = getLikedPosts();
  const alreadyLikedInBrowser = likedPosts.includes(id);

  // If already liked in browser, user is unliking
  const targetAction = alreadyLikedInBrowser ? "unlike" : "like";

  try {
    const res = await fetch("/api/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: id, action: targetAction }),
    });

    if (res.ok) {
      const data = await res.json();
      if (!data.success && data.alreadyLiked) {
        // IP already liked
        if (!alreadyLikedInBrowser) {
          saveToStorage(STORAGE_KEYS.LIKED_POSTS, [...likedPosts, id]);
        }
        return {
          success: false,
          liked: true,
          claps: currentClaps,
          message: "আপনি ইতিমধ্যে এই আইপি (IP) অথবা ব্রাউজার থেকে এই গল্পে লাইক দিয়েছেন!",
        };
      }

      // Update claps
      let newClaps = currentClaps;
      let newLiked = false;

      if (data.liked) {
        newClaps = currentClaps + 1;
        newLiked = true;
        if (!alreadyLikedInBrowser) {
          saveToStorage(STORAGE_KEYS.LIKED_POSTS, [...likedPosts, id]);
        }
      } else {
        newClaps = Math.max(0, currentClaps - 1);
        newLiked = false;
        saveToStorage(
          STORAGE_KEYS.LIKED_POSTS,
          likedPosts.filter((item) => item !== id)
        );
      }

      const updatedPosts = posts.map((p) =>
        p.id === id ? { ...p, claps: newClaps } : p
      );
      savePosts(updatedPosts);

      return {
        success: true,
        liked: newLiked,
        claps: newClaps,
        message: data.message || (newLiked ? "ভালোবাসা যুক্ত হয়েছে! ❤️" : "ভালোবাসা প্রত্যাহার করা হয়েছে।"),
      };
    }
  } catch (e) {
    console.warn("API like failed, falling back to browser-only enforcement", e);
  }

  // Fallback for browser-only enforcement if offline or API unreachable
  if (alreadyLikedInBrowser) {
    const newClaps = Math.max(0, currentClaps - 1);
    saveToStorage(
      STORAGE_KEYS.LIKED_POSTS,
      likedPosts.filter((item) => item !== id)
    );
    const updatedPosts = posts.map((p) =>
      p.id === id ? { ...p, claps: newClaps } : p
    );
    savePosts(updatedPosts);
    return {
      success: true,
      liked: false,
      claps: newClaps,
      message: "ভালোবাসা প্রত্যাহার করা হয়েছে।",
    };
  } else {
    const newClaps = currentClaps + 1;
    saveToStorage(STORAGE_KEYS.LIKED_POSTS, [...likedPosts, id]);
    const updatedPosts = posts.map((p) =>
      p.id === id ? { ...p, claps: newClaps } : p
    );
    savePosts(updatedPosts);
    return {
      success: true,
      liked: true,
      claps: newClaps,
      message: "আপনার ভালোবাসা যুক্ত হয়েছে! ❤️ (একটি গল্পে একবারই লাইক দেওয়া যায়)",
    };
  }
}

export function clapPost(id: string): number {
  const posts = getPosts();
  let newClaps = 0;
  const updated = posts.map((p) => {
    if (p.id === id) {
      newClaps = (p.claps || 0) + 1;
      return { ...p, claps: newClaps };
    }
    return p;
  });
  savePosts(updated);
  return newClaps;
}

export function getNovels(): Novel[] {
  return getFromStorage<Novel[]>(STORAGE_KEYS.NOVELS, INITIAL_NOVELS);
}

export function saveNovels(novels: Novel[]) {
  saveToStorage(STORAGE_KEYS.NOVELS, novels);
}

export function addNovel(novel: Omit<Novel, "id" | "episodesCount" | "episodes">): Novel {
  const novels = getNovels();
  const newNovel: Novel = {
    ...novel,
    id: `novel-${Date.now()}`,
    episodesCount: 0,
    episodes: [],
  };
  const updated = [newNovel, ...novels];
  saveNovels(updated);
  syncNovelToFirestore(newNovel);
  return newNovel;
}

export function updateNovel(novelOrId: Novel | string, partial?: Partial<Novel>): void {
  const novels = getNovels();
  let updatedNovelItem: Novel | null = null;
  const updated = novels.map((n) => {
    if (typeof novelOrId === "string") {
      if (n.id === novelOrId) {
        updatedNovelItem = { ...n, ...(partial || {}) };
        return updatedNovelItem;
      }
      return n;
    } else {
      if (n.id === novelOrId.id) {
        updatedNovelItem = novelOrId;
        return novelOrId;
      }
      return n;
    }
  });
  saveNovels(updated);
  if (updatedNovelItem) {
    syncNovelToFirestore(updatedNovelItem);
  }
}

export function addEpisodeToNovel(novelId: string, episode: Omit<NovelEpisode, "id" | "novelId" | "date">): NovelEpisode {
  const novels = getNovels();
  const newEpisode: NovelEpisode = {
    ...episode,
    id: `ep-${Date.now()}`,
    novelId,
    date: formatBengaliDate(new Date()),
  };
  let targetNovel: Novel | null = null;
  const updated = novels.map((n) => {
    if (n.id === novelId) {
      const episodes = [...(n.episodes || []), newEpisode];
      targetNovel = {
        ...n,
        episodes,
        episodesCount: episodes.length,
      };
      return targetNovel;
    }
    return n;
  });
  saveNovels(updated);
  if (targetNovel) syncNovelToFirestore(targetNovel);
  return newEpisode;
}

export function deleteNovel(id: string) {
  const novels = getNovels();
  saveNovels(novels.filter((n) => n.id !== id));
  deleteNovelFromFirestore(id);
}

export function deleteEpisodeFromNovel(novelId: string, episodeId: string) {
  const novels = getNovels();
  let targetNovel: Novel | null = null;
  const updated = novels.map((n) => {
    if (n.id === novelId) {
      const episodes = (n.episodes || []).filter((ep) => ep.id !== episodeId);
      targetNovel = {
        ...n,
        episodes,
        episodesCount: episodes.length,
      };
      return targetNovel;
    }
    return n;
  });
  saveNovels(updated);
  if (targetNovel) syncNovelToFirestore(targetNovel);
}

export function getComments(): ReaderComment[] {
  return getFromStorage<ReaderComment[]>(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
}

export function addComment(comment: Omit<ReaderComment, "id" | "date" | "claps">): ReaderComment {
  const comments = getComments();
  const newComment: ReaderComment = {
    ...comment,
    id: `com-${Date.now()}`,
    date: formatBengaliDate(new Date()),
    claps: 0,
  };
  saveToStorage(STORAGE_KEYS.COMMENTS, [newComment, ...comments]);
  syncCommentToFirestore(newComment);
  return newComment;
}

export function deleteComment(id: string) {
  const comments = getComments();
  saveToStorage(STORAGE_KEYS.COMMENTS, comments.filter((c) => c.id !== id));
  deleteCommentFromFirestore(id);
}

export function getSubscribers(): Subscriber[] {
  return getFromStorage<Subscriber[]>(STORAGE_KEYS.SUBSCRIBERS, INITIAL_SUBSCRIBERS);
}

export function addSubscriber(email: string): boolean {
  const subs = getSubscribers();
  if (subs.some((s) => s.email.toLowerCase() === email.toLowerCase())) return false;
  const newSub: Subscriber = {
    id: `sub-${Date.now()}`,
    email,
    date: formatBengaliDate(new Date()),
  };
  saveToStorage(STORAGE_KEYS.SUBSCRIBERS, [newSub, ...subs]);
  syncSubscriberToFirestore(newSub);
  return true;
}

export function deleteSubscriber(id: string): void {
  const subs = getSubscribers();
  saveToStorage(STORAGE_KEYS.SUBSCRIBERS, subs.filter((s) => s.id !== id));
  deleteSubscriberFromFirestore(id);
}

export function getBookmarks(): string[] {
  return getFromStorage<string[]>(STORAGE_KEYS.BOOKMARKS, []);
}

export function toggleBookmark(id: string): boolean {
  const bookmarks = getBookmarks();
  const exists = bookmarks.includes(id);
  const updated = exists ? bookmarks.filter((b) => b !== id) : [...bookmarks, id];
  saveToStorage(STORAGE_KEYS.BOOKMARKS, updated);
  return !exists;
}

export function formatBengaliNumber(num: number | string): string {
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/\d/g, (d) => bengaliDigits[Number(d)]);
}

export function formatBengaliDate(date: Date): string {
  const months = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
  ];
  const day = formatBengaliNumber(date.getDate().toString().padStart(2, "0"));
  const month = months[date.getMonth()];
  const year = formatBengaliNumber(date.getFullYear());
  return `${day} ${month}, ${year}`;
}

let firebaseSyncStarted = false;
export function initFirebaseSync() {
  if (typeof window === "undefined" || firebaseSyncStarted) return;
  firebaseSyncStarted = true;

  seedInitialDataIfEmpty(
    INITIAL_POSTS,
    INITIAL_NOVELS,
    INITIAL_AUTHOR_PROFILE,
    INITIAL_COMMENTS,
    INITIAL_SUBSCRIBERS
  ).then(() => {
    subscribeToFirestoreCollection<Post>(COLLECTIONS.POSTS, (posts) => {
      if (posts && posts.length > 0) {
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
        window.dispatchEvent(new CustomEvent("ahona_store_updated", { detail: { key: STORAGE_KEYS.POSTS } }));
      }
    });

    subscribeToFirestoreCollection<Novel>(COLLECTIONS.NOVELS, (novels) => {
      if (novels && novels.length > 0) {
        localStorage.setItem(STORAGE_KEYS.NOVELS, JSON.stringify(novels));
        window.dispatchEvent(new CustomEvent("ahona_store_updated", { detail: { key: STORAGE_KEYS.NOVELS } }));
      }
    });

    subscribeToFirestoreCollection<ReaderComment>(COLLECTIONS.COMMENTS, (comments) => {
      if (comments && comments.length > 0) {
        localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
        window.dispatchEvent(new CustomEvent("ahona_store_updated", { detail: { key: STORAGE_KEYS.COMMENTS } }));
      }
    });

    subscribeToFirestoreCollection<Subscriber>(COLLECTIONS.SUBSCRIBERS, (subs) => {
      if (subs && subs.length > 0) {
        localStorage.setItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(subs));
        window.dispatchEvent(new CustomEvent("ahona_store_updated", { detail: { key: STORAGE_KEYS.SUBSCRIBERS } }));
      }
    });

    subscribeToAuthorProfile((profile) => {
      if (profile && profile.name) {
        const sanitized: AuthorProfile = {
          ...profile,
          avatarUrl: (!profile.avatarUrl || profile.avatarUrl.includes("unsplash.com")) ? "/ahona.png" : profile.avatarUrl,
        };
        localStorage.setItem(STORAGE_KEYS.AUTHOR_PROFILE, JSON.stringify(sanitized));
        window.dispatchEvent(new CustomEvent("ahona_store_updated", { detail: { key: STORAGE_KEYS.AUTHOR_PROFILE } }));
      }
    });
  }).catch((err) => console.warn("Firebase sync init error:", err));
}
