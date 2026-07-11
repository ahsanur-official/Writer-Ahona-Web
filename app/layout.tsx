import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "অহনা ইসলাম | শব্দের ভেতর এক পৃথিবী",
  description: "অহনা ইসলামের কবিতা, গল্প, প্রবন্ধ ও ভাবনার ঠিকানা।",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="bn"><body>{children}</body></html>;
}
