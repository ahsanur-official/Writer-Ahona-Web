"use client";

import { useState, useEffect } from "react";
import {
  syncPostToFirestore,
  deletePostFromFirestore,
  syncNovelToFirestore,
  deleteNovelFromFirestore,
  deleteEpisodeFromFirestore,
  syncAuthorProfileToFirestore,
  syncCommentToFirestore,
  deleteCommentFromFirestore,
  syncSubscriberToFirestore,
  deleteSubscriberFromFirestore,
  syncRatingToFirestore,
  deleteRatingFromFirestore,
  seedInitialDataIfEmpty,
  subscribeToFirestoreCollection,
  subscribeToAuthorProfile,
  addLocalTombstone,
  getLocalTombstones,
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
  bio: `“অহনা ইসলাম” নামটি যদিও কাল্পনিক, তবুও এটা এখন এক বাস্তবিক পরিচিতি৤
বাবা-মায়ের দেওয়া নাম আলাদা হলেও পাঠকের হৃদয়ে তিনি জায়গা করে নিয়েছেন “অহনা ইসলাম” নামেই৤ যা তার শখ ও লেখালেখির পরিচয়ের প্রতীক৤
এই ছোট্ট লেখিকা “২০০৮ সালের ১২ ই মার্চ” পৃথিবীতে আসেন বাবা-মায়ের কোল আলো করে৤ বর্তমানে তিনি ইন্টার দ্বিতীয় বর্ষের ছাত্রী৤ অল্প বয়সেই কলমের জাদুতে গল্প, কবিতা আর উপন্যাসের জগতে নিজের আলাদা স্থান তৈরি করেছেন তিনি৤ তার লেখায় থাকে অনুভূতির উষ্ণতা, কল্পনার রঙ আর জীবনের স্পর্শ, যা পাঠককে বারবার টেনে আনে তার সৃষ্টির ভুবনে৤`,
  location: "জয়পুরহাট, বাংলাদেশ",
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
  return text.split(/[৤!?\n]+/).filter((s) => s.trim().length > 0).length;
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

export interface ItemRating {
  id: string;
  targetId: string; // post id or episode id
  targetTitle: string;
  targetType: string; // "গল্প" | "কবিতা" | "উপন্যাস" | "প্রবন্ধ" | "দিনলিপি"
  rating: number; // 1 to 5 stars
  review?: string;
  readerName?: string;
  date: string;
  createdAt: string;
}

const INITIAL_POSTS: Post[] = [
  {
    id: "post-1",
    title: "জোছনার নিচে চিঠি",
    type: "গল্প",
    excerpt: "যে চিঠিগুলো পাঠানো হয়নি, তারাও কি কোনোদিন ঠিকানা খুঁজে পায়?",
    body: `রাত গভীর হলে জানালার ধারে একটি পুরোনো খাম রেখে দিই৤ তার ভেতরে জমে থাকে না-বলা কথা, অসমাপ্ত বিদায় আর ফিরে আসার ছোট্ট আশা৤

শহরের কোলাহল যখন আস্তে আস্তে নিভে আসে, তখন দূর থেকে কোনো এক ট্রেনের হুইসেল ভেসে আসে৤ ভাবি, এই ট্রেনের যাত্রী কারা? কেউ কি ফিরছে কোনো হারানো আশ্রয়ে, নাকি কেবল পালিয়ে বেড়াচ্ছে নিজের ছায়া থেকে?

কাগজের ওপর কলমের স্পর্শে তৈরি হয় নিঃশব্দ সেতু৤ আমি লিখি—কোনো উত্তর পাওয়ার লোভে নয়, কেবল নিজেকে প্রবোধ দিতে যে অনুভূতিগুলো সত্যি ছিল৤ কাল সকালের রোদে হয়তো সব রঙ বিবর্ণ হয়ে যাবে, কিন্তু এই জোছনা আর অক্ষরের সাক্ষী হয়ে থাকবে রাত৤`,
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
    excerpt: "তোমার চলে যাওয়ার পর শহরটা একটু বেশি নীল হয়ে আছে৤",
    body: `তোমার চলে যাওয়ার পর শহরটা একটু বেশি নীল হয়ে আছে৤
প্রতিটি ট্রাফিক সিগনালে থেমে থাকে আমার না-বলা ক্ষমা,
বাতাসের ঘ্রাণে এখনও ছড়িয়ে আছে পুরোনো সুর৤

কিছু শূন্যতা পথের মতো—
তার শেষ দেখা যায় না,
তবু তার ভেতর দিয়েই একদিন আলোয় পৌঁছাতে হয়৤
আমরা যারা ভাঙা কাঁচ কুড়িয়ে মালা গাঁথি,
তাদের বুকে রাত জাগা তারারা শব্দহীন গান গায়৤`,
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
    excerpt: "নিজের কাছে ফিরে আসার পথ কখনও কখনও খুব দীর্ঘ হয়৤",
    body: `নদী আমাদের শেখায়, থেমে না থেকেও শান্ত থাকা যায়৤ প্রতিটি বাঁক নতুন করে নিজের পরিচয় দেয়৤

আমরা সারাজীবন স্থিরতার পেছনে ছুটি, অথচ পৃথিবীর সমস্ত সৌন্দর্য রচিত হয়েছে পরিবর্তনের ছন্দে৤ পাতার ঝরে পড়া থেকে ঋতুর প্রস্থান—সবকিছুতেই একটি নিপুণ সমর্পণ লুকিয়ে আছে৤

নিজের মুখোমুখি দাঁড়ানো সবচেয়ে কঠিন কাজ৤ শব্দের আশ্রয় আমাকে সেই সাহস জোগায়৤ যখন মনের ভেতরে ঝড় ওঠে, তখন একটি শান্ত বাক্যের চেয়ে বড় আশ্রয় আর কিছু হতে পারে না৤`,
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
    excerpt: "বৃষ্টির ফোঁটা যখন কাঁচ স্পর্শ করে, স্মৃতিরা তখন ধুলো ঝেড়ে উঠে দাঁড়ায়৤",
    body: `বারান্দার কোণে রাখা মাটির চায়ের কাপ থেকে ধোঁয়া উঠছে৤ বাইরে মেঘের ডাক আর বৃষ্টির মৃদু ছন্দ৤

অনেক বছর আগের এক বর্ষার বিকেলে আমরা কথা দিয়েছিলাম, যে শহরেই যাই না কেন, প্রথম বর্ষার দিনে এক কাপ চা হাতে জানালার পাশে দাঁড়াব৤ আজ সেই কথা মনে পড়ে গেল৤ দূরত্ব হয়তো মানুষকে বদলে দেয়, কিন্তু স্মৃতিগুলো সবসময় সেই পুরোনো বিকেলেই স্থির থাকে৤`,
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
    excerpt: "সব কথা অক্ষরে প্রকাশ করা যায় না, কিছু অনুভূতি নিঃশ্বাসে বয়ে নিতে হয়৤",
    body: `আজকের দিনটা অদ্ভুত রকম শান্ত৤ কোনো তারা নেই, কোনো তাড়া নেই৤ টেবিলে রাখা খোলা ডায়েরির সাদা পৃষ্ঠাগুলো যেন আমায় ডাকছে৤

কখনও কখনও না লেখার মধ্যেও একটা গভীর কবিতা লুকিয়ে থাকে৤ নীরবতা সবসময় শূন্যতা নয়; এটি মাঝে মাঝে পরম তৃপ্তির আরেক নাম৤`,
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
      "একটি হারিয়ে যাওয়া গ্রামের স্মৃতি আর দুই অসমাপ্ত সম্পর্কের টানাপোড়েন নিয়ে রচিত উপন্যাস৤ যেখানে নদী শুধু জলপ্রবাহ নয়, জীবনের প্রতিটি ভাঙা-গড়ার নীরব সাক্ষী৤",
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
        teaser: "প্রথম দর্শনের সেই ভিজে যাওয়া প্ল্যাটফর্ম আর ফেলে আসা একগুচ্ছ বেলি ফুল৤",
        content: `ভোরের ট্রেনের জানালায় কুয়াশা মাখা কাঁচের ওপারে ধোঁয়াশা দিগন্ত৤ শায়নের কাঁধে ঝোলানো পুরোনো চামড়ার ব্যাগটায় কিছু বই আর অসমাপ্ত কিছু স্কেচ৤

স্টেশনে যখন ট্রেনটা এসে থামল, তখন হালকা বৃষ্টি নামছিল৤ প্ল্যাটফর্মে কোনো মানুষ নেই, কেবল প্ল্যাটফর্ম মাস্টারের এক চিলতে হলুদ আলো৤ সেই আলোর নিচে দাঁড়িয়ে ছিল অনিন্দিতা—হাতে নীলচে ছাতা, চোখে অদ্ভুত এক দ্বিধা৤

"তুমি সত্যি এলে?" অনিন্দিতার কণ্ঠে অবাক বিস্ময়৤
শায়ন এক মুহূর্ত চুপ করে তাকিয়ে রইল৤ যে প্রশ্নের উত্তর খুঁজতে সে সাতশো মাইল পাড়ি দিয়েছে, সেই উত্তর কি এই এক বাক্যে দেওয়া সম্ভব?`,
        date: "০১ জুলাই, ২০২৬",
        readTime: "৮ মিনিট",
        status: "প্রকাশিত",
      },
      {
        id: "ep-2",
        novelId: "nodi",
        episodeNumber: 2,
        title: "অচেনা চিঠি",
        teaser: "পোস্টবক্সের নিচে পড়ে থাকা নীল খামের রহস্যময় হাতের লেখা৤",
        content: `চিঠিটা পোস্ট অফিসের লাল বাক্সের তলায় ভিজে প্রায় বিবর্ণ হয়ে গিয়েছিল৤ উপরে কোনো প্রেরকের নাম নেই, কেবল প্রাপকের ঠিকানায় লেখা: 'নদীর ওপারের ঠিকানায়'৤

অনিন্দিতা কাঠের ডেস্কে বসে চিঠিটা খুলল৤ সুপরিচিত সেই গোল গোল হাতের লেখা, যার সাথে তার কৈশোরের সমস্ত বিকেল জড়িয়ে ছিল৤ প্রতিটি লাইনে ফুটে উঠছে এক অদ্ভুত আর্তি৤ অতীতকে কি কখনও সত্যি মুছে ফেলা যায়? নাকি তা ছাইচাপা আগুনের মতো বুকের গভীরে সুপ্ত থাকে?`,
        date: "০৫ জুলাই, ২০২৬",
        readTime: "১০ মিনিট",
        status: "প্রকাশিত",
      },
      {
        id: "ep-3",
        novelId: "nodi",
        episodeNumber: 3,
        title: "নদীর ডাক",
        teaser: "বাঁশের সাঁকো পেরিয়ে যখন গোধূলির ছায়া নেমে আসে ঘাটের ধারে৤",
        content: `ভাটার টানে নদীটা আজ বড় শান্ত৤ পাড়ের কাশবনগুলো বাতাসে এক অদ্ভুত ছন্দ তুলছে৤ শায়ন ঘাটের সিঁড়িতে বসে জলের দিকে তাকিয়ে ছিল৤

গ্রামের মানুষগুলো হয়তো নদীর এই নীরব ভাষা বোঝে না৤ কিন্তু শায়নের কাছে এই শান্ত জল যেন সব ক্ষোভ আর অভিমান ধুয়ে নিয়ে যায়৤ অনিন্দিতা এসে পাশে বসল৤ দুজনের মাঝে এক বিঘত দূরত্ব, কিন্তু সেই দূরত্ব যেন পুরো এক শতাব্দীর৤`,
        date: "১২ জুলাই, ২০২৬",
        readTime: "৭ মিনিট",
        status: "প্রকাশিত",
      },
      {
        id: "ep-4",
        novelId: "nodi",
        episodeNumber: 4,
        title: "শেষ ট্রেন",
        teaser: "বিকেলের লালচে আলোয় হুইসেলের শব্দ যখন বিদায়ের ঘণ্টা বাজায়৤",
        content: `সিগন্যাল সবুজ হয়েছে৤ দূর থেকে ইঞ্জিনের গুরুগম্ভীর ধ্বনি স্পষ্ট থেকে স্পষ্টতর হচ্ছে৤

অনিন্দিতা শায়নের চোখের দিকে তাকিয়ে বলল, "কিছু প্রশ্নের উত্তর না পাওয়াই হয়তো ভালো৤ কিছু গল্প অসমাপ্ত থাকলেই তাদের সৌন্দর্য বেঁচে থাকে৤"
ট্রেনের দরজায় হাত রেখে শায়ন শেষবারের মতো তাকাল৤ নদী, কাশবন আর সেই নীল ছাতা—সবকিছু ধীরে ধীরে পেছনে মিলিয়ে যেতে লাগল৤`,
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
      "ঢাকা শহরের ব্যস্ত রাতের বুকে এক তরুণী চিত্রশিল্পীর আত্মানুসন্ধান৤ ক্যানভাসে রঙের আড়ালে লুকানো মানুষের গোপন দুঃখ ও বেঁচে থাকার লড়াই৤",
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
        teaser: "একটি অসমাপ্ত চিত্রকর্ম যা কোনো এক নিশাচরের গোপন ডায়েরি বলে মনে হয়৤",
        content: `স্টুডিওর বাতিটা টিমটিম করে জ্বলছে৤ দেয়ালজুড়ে ঝুলছে কালো আর ধূসর রঙের একরাশ ক্যানভাস৤ চারুলতা তুলি হাতে দাঁড়িয়ে আছে৤

শহরের রাতের এক অদ্ভুত শব্দ আছে৤ দিনের আলোয় যা ঢাকা পড়ে হর্নের শব্দে, মাঝরাতে তা জীবন্ত হয়ে ওঠে৤ দূর থেকে ভেসে আসা অ্যাম্বুলেন্সের সাইরেন, ফুটপাতের কুকুরগুলোর একটানা ঘেউ ঘেউ, আর চায়ের টংয়ের কাপের টুংটাং শব্দ৤ চারুলতা অনুভব করে, এই শহরটা যেন একটা জীবন্ত শরীর৤`,
        date: "১০ মে, ২০২৬",
        readTime: "৬ মিনিট",
        status: "প্রকাশিত",
      },
      {
        id: "ch-2",
        novelId: "chaya",
        episodeNumber: 2,
        title: "আলোর প্রত্যাবর্তন",
        teaser: "ভোরের প্রথম আলো যখন সমস্ত কালো দাগ মুছে দেয়৤",
        content: `কালো রঙের স্তর ভেদ করে অবশেষে ক্যানভাসে ফুটে উঠল এক টুকরো সূর্যমুখী হলুদ৤ চারুলতা ক্লান্ত ভঙ্গিতে তুলিটা নামিয়ে রাখল৤

অন্ধকার যতই দীর্ঘ হোক না কেন, ভোরের প্রথম কিরণ তাকে অস্বীকার করতে বাধ্য করে৤ মানুষও হয়তো তেমনি৤ দুঃখের শেষ সীমায় দাঁড়িয়ে সে আবার নতুন করে স্বপ্ন দেখার সাহস পায়৤`,
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
    authorName: "অহনা ইসলাম",
    content: "অসাধারণ অনুভূতির প্রকাশ! এই চিঠি পড়ার পর নিজের জীবনের কিছু না-বলা কথার কথা মনে পড়ে গেল৤ লেখিকার কলম দীর্ঘজীবী হোক৤",
    date: "০৯ জুলাই, ২০২৬",
    claps: 18,
  },
  {
    id: "com-2",
    targetId: "post-2",
    targetTitle: "অপূর্ণতার মানচিত্র",
    authorName: "মেহজাবিন আলম",
    content: "প্রতিটি লাইন বুকের ভেতরে গভীর দাগ কেটে যায়৤ বিশেষ করে 'ভাঙা কাঁচ কুড়িয়ে মালা গাঁথি' লাইনটি অনবদ্য৤",
    date: "০৪ জুলাই, ২০২৬",
    claps: 12,
  },
  {
    id: "com-3",
    targetId: "nodi",
    targetTitle: "নদীর ওপারে রোদ",
    authorName: "সাদিয়া রহমান",
    content: "অনিন্দিতা আর শায়নের চরিত্রের টানাপোড়েন এত বাস্তবসম্মত যে চোখের সামনে দৃশ্যপট ভেসে ওঠে৤ পরবর্তী পর্বের অপেক্ষায় রইলাম!",
    date: "১৫ জুলাই, ২০২৬",
    claps: 24,
  },
];

const INITIAL_SUBSCRIBERS: Subscriber[] = [];

export const INITIAL_RATINGS: ItemRating[] = [
  {
    id: "rating-1",
    targetId: "post-1",
    targetTitle: "জোছনার নিচে চিঠি",
    targetType: "গল্প",
    rating: 5,
    review: "অসাধারণ অনুভূতি! জোছনার রূপ আর চিঠির আকুল অপেক্ষা মন ছুঁয়ে গেছে৤",
    readerName: "অহনা ইসলাম",
    date: "০৮ জুলাই, ২০২৬",
    createdAt: "2026-07-08T20:00:00.000Z",
  },
  {
    id: "rating-2",
    targetId: "post-2",
    targetTitle: "অপূর্ণতার মানচিত্র",
    targetType: "কবিতা",
    rating: 5,
    review: "কবিতার প্রতিটি পঙ্‌ক্তিতে গভীর বেদনা ও স্নিগ্ধতা লুকিয়ে রয়েছে৤",
    readerName: "নুসরাত জাহান",
    date: "০৩ জুলাই, ২০২৬",
    createdAt: "2026-07-03T18:30:00.000Z",
  },
  {
    id: "rating-3",
    targetId: "ep-1",
    targetTitle: "পর্ব ০১: ফেলে আসা স্টেশন",
    targetType: "উপন্যাস",
    rating: 5,
    review: "উপন্যাসটির শুরুতেই চরিত্রগুলোর মায়ায় আটকে গেলাম৤ পরবর্তী পর্বের অপেক্ষায় রইলাম!",
    readerName: "মাহমুদ হাসান",
    date: "১০ জুলাই, ২০২৬",
    createdAt: "2026-07-10T21:15:00.000Z",
  },
];

const STORAGE_KEYS = {
  POSTS: "ahona_posts_data_v2",
  NOVELS: "ahona_novels_data_v2",
  COMMENTS: "ahona_comments_data_v2",
  SUBSCRIBERS: "ahona_subscribers_data_v2",
  RATINGS: "ahona_ratings_data_v2",
  USER_RATINGS: "ahona_user_ratings_v2",
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
  // Ensure location and avatarUrl are updated from old defaults
  if (
    !current.bio ||
    current.bio.startsWith("আমি অহনা৤ শব্দের কাছে") ||
    !current.avatarUrl ||
    current.avatarUrl.includes("unsplash.com") ||
    current.location === "ঢাকা, বাংলাদেশ"
  ) {
    const updated: AuthorProfile = {
      ...current,
      location: (!current.location || current.location === "ঢাকা, বাংলাদেশ") ? "জয়পুরহাট, বাংলাদেশ" : current.location,
      avatarUrl: "/ahona.png",
      bio: (!current.bio || current.bio.startsWith("আমি অহনা৤ শব্দের কাছে")) ? INITIAL_AUTHOR_PROFILE.bio : current.bio,
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
  const posts = getFromStorage<Post[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);
  const tombstones = getLocalTombstones();
  if (!tombstones || tombstones.size === 0) return posts;
  return posts.filter((p) => !tombstones.has(p.id));
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

export async function deletePost(id: string): Promise<void> {
  addLocalTombstone(id);
  const posts = getPosts();
  const filtered = posts.filter((p) => p.id !== id);
  savePosts(filtered);
  // Guarantee authoritative deletion in Firestore and server
  await deletePostFromFirestore(id);
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
  const novels = getNovels();
  let currentEpisode: { id: string; claps?: number } | undefined;
  let parentNovel: Novel | undefined;

  if (!currentPost) {
    for (const n of novels) {
      const ep = n.episodes?.find((e) => e.id === id);
      if (ep) {
        currentEpisode = ep;
        parentNovel = n;
        break;
      }
    }
  }

  const currentClaps = currentPost
    ? (currentPost.claps || 0)
    : currentEpisode
    ? (currentEpisode.claps || 0)
    : 0;
  const likedPosts = getLikedPosts();
  const alreadyLikedInBrowser = likedPosts.includes(id);

  // If already liked in browser, user is unliking
  const targetAction = alreadyLikedInBrowser ? "unlike" : "like";

  try {
    const res = await fetch("/api/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: id,
        action: targetAction,
        clientLiked: alreadyLikedInBrowser,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        const finalClaps =
          typeof data.claps === "number"
            ? data.claps
            : data.liked
            ? currentClaps + 1
            : Math.max(0, currentClaps - 1);
        const finalLiked = Boolean(data.liked);

        if (finalLiked) {
          if (!alreadyLikedInBrowser) {
            saveToStorage(STORAGE_KEYS.LIKED_POSTS, [...likedPosts, id]);
          }
        } else {
          saveToStorage(
            STORAGE_KEYS.LIKED_POSTS,
            likedPosts.filter((item) => item !== id)
          );
        }

        if (currentPost) {
          const updatedPosts = posts.map((p) =>
            p.id === id ? { ...p, claps: finalClaps } : p
          );
          savePosts(updatedPosts);
          const updatedPost = updatedPosts.find((p) => p.id === id);
          if (updatedPost) syncPostToFirestore(updatedPost);
        } else if (parentNovel && currentEpisode) {
          const updatedNovels = novels.map((n) => {
            if (n.id === parentNovel!.id) {
              const updatedEpisodes = (n.episodes || []).map((ep) =>
                ep.id === id ? { ...ep, claps: finalClaps } : ep
              );
              return { ...n, episodes: updatedEpisodes };
            }
            return n;
          });
          saveNovels(updatedNovels);
          const updatedNovel = updatedNovels.find((n) => n.id === parentNovel!.id);
          if (updatedNovel) syncNovelToFirestore(updatedNovel);
        }

        window.dispatchEvent(
          new CustomEvent("ahona_store_updated", {
            detail: { key: "likes_updated", targetId: id, claps: finalClaps },
          })
        );

        return {
          success: true,
          liked: finalLiked,
          claps: finalClaps,
          message:
            data.message ||
            (finalLiked ? "ভালোবাসা যুক্ত হয়েছে! ❤️" : "ভালোবাসা প্রত্যাহার করা হয়েছে৤"),
        };
      }
    }
  } catch (e) {
    console.warn("API like failed, falling back to local toggle", e);
  }

  // Fallback for browser-only enforcement if offline or API unreachable
  const fallbackLiked = !alreadyLikedInBrowser;
  const fallbackClaps = fallbackLiked
    ? currentClaps + 1
    : Math.max(0, currentClaps - 1);

  if (fallbackLiked) {
    saveToStorage(STORAGE_KEYS.LIKED_POSTS, [...likedPosts, id]);
  } else {
    saveToStorage(
      STORAGE_KEYS.LIKED_POSTS,
      likedPosts.filter((item) => item !== id)
    );
  }

  if (currentPost) {
    const updatedPosts = posts.map((p) =>
      p.id === id ? { ...p, claps: fallbackClaps } : p
    );
    savePosts(updatedPosts);
    const updatedPost = updatedPosts.find((p) => p.id === id);
    if (updatedPost) syncPostToFirestore(updatedPost);
  } else if (parentNovel && currentEpisode) {
    const updatedNovels = novels.map((n) => {
      if (n.id === parentNovel!.id) {
        const updatedEpisodes = (n.episodes || []).map((ep) =>
          ep.id === id ? { ...ep, claps: fallbackClaps } : ep
        );
        return { ...n, episodes: updatedEpisodes };
      }
      return n;
    });
    saveNovels(updatedNovels);
    const updatedNovel = updatedNovels.find((n) => n.id === parentNovel!.id);
    if (updatedNovel) syncNovelToFirestore(updatedNovel);
  }

  window.dispatchEvent(
    new CustomEvent("ahona_store_updated", {
      detail: { key: "likes_updated", targetId: id, claps: fallbackClaps },
    })
  );

  return {
    success: true,
    liked: fallbackLiked,
    claps: fallbackClaps,
    message: fallbackLiked
      ? "আপনার ভালোবাসা যুক্ত হয়েছে! ❤️"
      : "ভালোবাসা প্রত্যাহার করা হয়েছে৤",
  };
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
  const novels = getFromStorage<Novel[]>(STORAGE_KEYS.NOVELS, INITIAL_NOVELS);
  const tombstones = getLocalTombstones();
  if (!tombstones || tombstones.size === 0) return novels;
  return novels
    .filter((n) => !tombstones.has(n.id))
    .map((n) => {
      const remainingEpisodes = (n.episodes || []).filter((ep) => !tombstones.has(ep.id));
      return {
        ...n,
        episodes: remainingEpisodes,
        episodesCount: remainingEpisodes.length,
      };
    });
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

export async function deleteNovel(id: string): Promise<void> {
  addLocalTombstone(id);
  const novels = getNovels();
  saveNovels(novels.filter((n) => n.id !== id));
  await deleteNovelFromFirestore(id);
}

export async function deleteEpisodeFromNovel(novelId: string, episodeId: string): Promise<void> {
  addLocalTombstone(episodeId);
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
  await deleteEpisodeFromFirestore(novelId, episodeId);
  if (targetNovel) {
    await syncNovelToFirestore(targetNovel);
  }
}

export function getComments(): ReaderComment[] {
  const comments = getFromStorage<ReaderComment[]>(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
  const tombstones = getLocalTombstones();
  if (!tombstones || tombstones.size === 0) return comments;
  return comments.filter((c) => !tombstones.has(c.id));
}

export function addComment(comment: Omit<ReaderComment, "id" | "date" | "claps">): ReaderComment {
  const newComment: ReaderComment = {
    ...comment,
    id: `com-${Date.now()}`,
    date: formatBengaliDate(new Date()),
    claps: 0,
  };
  if (typeof window !== "undefined" && localStorage.getItem("ahona-admin") === "true") {
    const comments = getComments();
    saveToStorage(STORAGE_KEYS.COMMENTS, [newComment, ...comments]);
  }
  syncCommentToFirestore(newComment);
  return newComment;
}

export async function deleteComment(id: string): Promise<void> {
  addLocalTombstone(id);
  const comments = getComments();
  saveToStorage(STORAGE_KEYS.COMMENTS, comments.filter((c) => c.id !== id));
  await deleteCommentFromFirestore(id);
}

export function getSubscribers(): Subscriber[] {
  const subs = getFromStorage<Subscriber[]>(STORAGE_KEYS.SUBSCRIBERS, INITIAL_SUBSCRIBERS);
  const tombstones = getLocalTombstones();
  if (!tombstones || tombstones.size === 0) return subs;
  return subs.filter((s) => !tombstones.has(s.id));
}

export function addSubscriber(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const newSub: Subscriber = {
    id: `sub-${Date.now()}`,
    email: email.trim(),
    date: formatBengaliDate(new Date()),
  };
  // Safely sync to Firestore without exposing other subscribers in client storage
  syncSubscriberToFirestore(newSub);
  return true;
}

export async function deleteSubscriber(id: string): Promise<void> {
  addLocalTombstone(id);
  const subs = getSubscribers();
  saveToStorage(STORAGE_KEYS.SUBSCRIBERS, subs.filter((s) => s.id !== id));
  await deleteSubscriberFromFirestore(id);
}

// ----------------- RATINGS & REVIEWS -----------------
export function getRatings(): ItemRating[] {
  const ratings = getFromStorage<ItemRating[]>(STORAGE_KEYS.RATINGS, INITIAL_RATINGS);
  const tombstones = getLocalTombstones();
  if (!tombstones || tombstones.size === 0) return ratings;
  return ratings.filter((r) => !tombstones.has(r.id));
}

export function getItemRatings(targetId: string): ItemRating[] {
  const ratings = getRatings();
  return ratings.filter((r) => r.targetId === targetId);
}

export function getUserRatingsMap(): Record<string, number> {
  return getFromStorage<Record<string, number>>(STORAGE_KEYS.USER_RATINGS, {});
}

export function getUserRatingFor(targetId: string): number | null {
  const map = getUserRatingsMap();
  return map[targetId] || null;
}

export function getItemRatingStats(targetId: string): {
  average: number;
  count: number;
  userRating: number | null;
} {
  const itemRatings = getItemRatings(targetId);
  const userRating = getUserRatingFor(targetId);
  if (itemRatings.length === 0) {
    return {
      average: userRating || 0,
      count: userRating ? 1 : 0,
      userRating,
    };
  }
  const sum = itemRatings.reduce((acc, curr) => acc + (curr.rating || 0), 0);
  const average = Math.round((sum / itemRatings.length) * 10) / 10;
  return {
    average,
    count: itemRatings.length,
    userRating,
  };
}

export function saveRating(input: {
  targetId: string;
  targetTitle: string;
  targetType: string;
  rating: number;
  review?: string;
  readerName?: string;
}): ItemRating {
  const ratings = getRatings();
  const readerNameClean = input.readerName?.trim() || "মুগ্ধ পাঠক";
  const existingIndex = ratings.findIndex(
    (r) => r.targetId === input.targetId && r.readerName === readerNameClean
  );

  const newRating: ItemRating = {
    id: existingIndex >= 0 ? ratings[existingIndex].id : `rating-${Date.now()}`,
    targetId: input.targetId,
    targetTitle: input.targetTitle,
    targetType: input.targetType,
    rating: Math.max(1, Math.min(5, input.rating)),
    review: input.review?.trim() || undefined,
    readerName: readerNameClean,
    date: formatBengaliDate(new Date()),
    createdAt: new Date().toISOString(),
  };

  let updatedRatings: ItemRating[];
  if (existingIndex >= 0) {
    updatedRatings = [...ratings];
    updatedRatings[existingIndex] = newRating;
  } else {
    updatedRatings = [newRating, ...ratings];
  }

  saveToStorage(STORAGE_KEYS.RATINGS, updatedRatings);
  syncRatingToFirestore(newRating);

  // Save to user ratings map so reader knows they rated this item
  const userMap = getUserRatingsMap();
  userMap[input.targetId] = newRating.rating;
  saveToStorage(STORAGE_KEYS.USER_RATINGS, userMap);

  window.dispatchEvent(
    new CustomEvent("ahona_store_updated", {
      detail: { key: STORAGE_KEYS.RATINGS, rating: newRating },
    })
  );

  return newRating;
}

export async function deleteRating(id: string): Promise<void> {
  addLocalTombstone(id);
  const ratings = getRatings();
  const filtered = ratings.filter((r) => r.id !== id);
  saveToStorage(STORAGE_KEYS.RATINGS, filtered);
  await deleteRatingFromFirestore(id);
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

  // Clean up any sensitive data inadvertently saved in public visitor localStorage
  try {
    const isAdmin = localStorage.getItem("ahona-admin") === "true";
    if (!isAdmin) {
      localStorage.removeItem(STORAGE_KEYS.SUBSCRIBERS);
      localStorage.removeItem(STORAGE_KEYS.COMMENTS);
    }
  } catch {}

  // Authoritative server tombstones & content reconciliation on boot
  try {
    fetch("/api/admin/content", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!data || !data.success) return;
        const tombstoneList: string[] = Array.isArray(data.tombstones) ? data.tombstones : [];
        tombstoneList.forEach((tId: string) => addLocalTombstone(tId));
        const activeTombstones = getLocalTombstones();

        // 1. Reconcile Posts
        const currentPosts = getFromStorage<Post[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);
        const serverPostIds = Array.isArray(data.postIds) ? new Set(data.postIds) : null;
        const isSeeded = !!data.seedStatus?.seeded;

        const purgedPosts = currentPosts.filter((p) => {
          if (activeTombstones.has(p.id)) return false;
          // If server is seeded and has postIds, don't resurrect non-existent posts
          if (isSeeded && serverPostIds && !serverPostIds.has(p.id)) {
            addLocalTombstone(p.id);
            return false;
          }
          return true;
        });
        if (purgedPosts.length !== currentPosts.length) {
          savePosts(purgedPosts);
        }

        // 2. Reconcile Novels and Novel Episodes
        const currentNovels = getFromStorage<Novel[]>(STORAGE_KEYS.NOVELS, INITIAL_NOVELS);
        const serverNovelIds = Array.isArray(data.novelIds) ? new Set(data.novelIds) : null;

        const purgedNovels = currentNovels
          .filter((n) => {
            if (activeTombstones.has(n.id)) return false;
            if (isSeeded && serverNovelIds && !serverNovelIds.has(n.id)) {
              addLocalTombstone(n.id);
              return false;
            }
            return true;
          })
          .map((n) => {
            const episodes = (n.episodes || []).filter((ep) => !activeTombstones.has(ep.id));
            return {
              ...n,
              episodes,
              episodesCount: episodes.length,
            };
          });
        saveNovels(purgedNovels);

        // 3. Reconcile Comments & Ratings
        const currentComments = getFromStorage<ReaderComment[]>(STORAGE_KEYS.COMMENTS, []);
        const purgedComments = currentComments.filter((c) => !activeTombstones.has(c.id));
        if (purgedComments.length !== currentComments.length) {
          saveToStorage(STORAGE_KEYS.COMMENTS, purgedComments);
        }

        const currentRatings = getFromStorage<ItemRating[]>(STORAGE_KEYS.RATINGS, []);
        const purgedRatings = currentRatings.filter((r) => !activeTombstones.has(r.id));
        if (purgedRatings.length !== currentRatings.length) {
          saveToStorage(STORAGE_KEYS.RATINGS, purgedRatings);
        }

        window.dispatchEvent(new CustomEvent("ahona_store_updated", { detail: { key: "tombstones_reconciled" } }));
      })
      .catch(() => {});
  } catch {}

  seedInitialDataIfEmpty(
    INITIAL_POSTS,
    INITIAL_NOVELS,
    INITIAL_AUTHOR_PROFILE,
    INITIAL_COMMENTS,
    INITIAL_SUBSCRIBERS,
    INITIAL_RATINGS
  ).then(() => {
    // Only sync public literary content for public readers
    subscribeToFirestoreCollection<Post>(COLLECTIONS.POSTS, (posts) => {
      const validPosts = Array.isArray(posts) ? posts : [];
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(validPosts));
      window.dispatchEvent(new CustomEvent("ahona_store_updated", { detail: { key: STORAGE_KEYS.POSTS } }));
    });

    subscribeToFirestoreCollection<Novel>(COLLECTIONS.NOVELS, (novels) => {
      const validNovels = Array.isArray(novels) ? novels : [];
      localStorage.setItem(STORAGE_KEYS.NOVELS, JSON.stringify(validNovels));
      window.dispatchEvent(new CustomEvent("ahona_store_updated", { detail: { key: STORAGE_KEYS.NOVELS } }));
    });

    subscribeToFirestoreCollection<ItemRating>(COLLECTIONS.RATINGS, (ratings) => {
      const validRatings = Array.isArray(ratings) ? ratings : [];
      localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(validRatings));
      window.dispatchEvent(new CustomEvent("ahona_store_updated", { detail: { key: STORAGE_KEYS.RATINGS } }));
    });

    subscribeToAuthorProfile((profile) => {
      if (profile && profile.name) {
        const sanitized: AuthorProfile = {
          ...profile,
          location: (!profile.location || profile.location === "ঢাকা, বাংলাদেশ") ? "জয়পুরহাট, বাংলাদেশ" : profile.location,
          avatarUrl: (!profile.avatarUrl || profile.avatarUrl.includes("unsplash.com")) ? "/ahona.png" : profile.avatarUrl,
        };
        localStorage.setItem(STORAGE_KEYS.AUTHOR_PROFILE, JSON.stringify(sanitized));
        window.dispatchEvent(new CustomEvent("ahona_store_updated", { detail: { key: STORAGE_KEYS.AUTHOR_PROFILE } }));
      }
    });
  }).catch((err) => console.warn("Firebase sync init error:", err));
}

// Dedicated sync for the Admin Dashboard only
export function initAdminDataSync(
  callbacksOrSubscribers?:
    | {
        onSubscribers?: (subs: Subscriber[]) => void;
        onComments?: (comments: ReaderComment[]) => void;
        onRatings?: (ratings: ItemRating[]) => void;
        onPosts?: (posts: Post[]) => void;
        onNovels?: (novels: Novel[]) => void;
      }
    | ((subs: Subscriber[]) => void),
  legacyOnComments?: (comments: ReaderComment[]) => void
) {
  if (typeof window === "undefined") return () => {};

  let onSubscribers: ((subs: Subscriber[]) => void) | undefined;
  let onComments: ((comments: ReaderComment[]) => void) | undefined;
  let onRatings: ((ratings: ItemRating[]) => void) | undefined;
  let onPosts: ((posts: Post[]) => void) | undefined;
  let onNovels: ((novels: Novel[]) => void) | undefined;

  if (typeof callbacksOrSubscribers === "function") {
    onSubscribers = callbacksOrSubscribers;
    onComments = legacyOnComments;
  } else if (callbacksOrSubscribers && typeof callbacksOrSubscribers === "object") {
    onSubscribers = callbacksOrSubscribers.onSubscribers;
    onComments = callbacksOrSubscribers.onComments;
    onRatings = callbacksOrSubscribers.onRatings;
    onPosts = callbacksOrSubscribers.onPosts;
    onNovels = callbacksOrSubscribers.onNovels;
  }

  const unsubSubs = subscribeToFirestoreCollection<Subscriber>(COLLECTIONS.SUBSCRIBERS, (subs) => {
    if (subs) {
      localStorage.setItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(subs));
      if (onSubscribers) onSubscribers(subs);
      window.dispatchEvent(new CustomEvent("ahona_store_updated", { detail: { key: STORAGE_KEYS.SUBSCRIBERS } }));
    }
  });

  const unsubComments = subscribeToFirestoreCollection<ReaderComment>(COLLECTIONS.COMMENTS, (comments) => {
    if (comments) {
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
      if (onComments) onComments(comments);
      window.dispatchEvent(new CustomEvent("ahona_store_updated", { detail: { key: STORAGE_KEYS.COMMENTS } }));
    }
  });

  const unsubRatings = subscribeToFirestoreCollection<ItemRating>(COLLECTIONS.RATINGS, (rats) => {
    if (rats) {
      localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(rats));
      if (onRatings) onRatings(rats);
      window.dispatchEvent(new CustomEvent("ahona_store_updated", { detail: { key: STORAGE_KEYS.RATINGS } }));
    }
  });

  const unsubPosts = subscribeToFirestoreCollection<Post>(COLLECTIONS.POSTS, (psts) => {
    if (psts) {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(psts));
      if (onPosts) onPosts(psts);
      window.dispatchEvent(new CustomEvent("ahona_store_updated", { detail: { key: STORAGE_KEYS.POSTS } }));
    }
  });

  const unsubNovels = subscribeToFirestoreCollection<Novel>(COLLECTIONS.NOVELS, (novs) => {
    if (novs) {
      localStorage.setItem(STORAGE_KEYS.NOVELS, JSON.stringify(novs));
      if (onNovels) onNovels(novs);
      window.dispatchEvent(new CustomEvent("ahona_store_updated", { detail: { key: STORAGE_KEYS.NOVELS } }));
    }
  });

  return () => {
    unsubSubs();
    unsubComments();
    unsubRatings();
    unsubPosts();
    unsubNovels();
  };
}
