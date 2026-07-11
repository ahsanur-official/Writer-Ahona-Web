import type { Metadata } from "next";
// @ts-expect-error: CSS module is handled by Next.js
import "./globals.css";

export const metadata: Metadata = {
  title: "অহনা ইসলাম | শব্দের ভেতর এক পৃথিবী",
  description: "অহনা ইসলামের কবিতা, গল্প, উপন্যাস ও ভাবনার ঠিকানা।",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="bn"><body>{children}</body></html>;
}
