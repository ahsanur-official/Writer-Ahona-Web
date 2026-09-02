import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "অহনা ইসলাম | শব্দের ভেতর এক পৃথিবী",
  description: "অহনা ইসলামের কবিতা, গল্প, উপন্যাস, পর্ব ও ভাবনার আধুনিক সাহিত্য আঙিনা।",
  openGraph: {
    title: "অহনা ইসলাম | শব্দের ভেতর এক পৃথিবী",
    description: "অহনা ইসলামের কবিতা, গল্প, উপন্যাস, পর্ব ও ভাবনার আধুনিক সাহিত্য আঙিনা।",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bn">
      <body>{children}</body>
    </html>
  );
}
