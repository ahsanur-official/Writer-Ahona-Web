import type { Metadata } from "next";
import "./globals.css";
import DatabaseSyncProvider from "@/components/DatabaseSyncProvider";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import ContentProtection from "@/components/ContentProtection";

export const metadata: Metadata = {
  title: "অহনা ইসলাম - সাহিত্য ও উপন্যাস পোর্টাল",
  description: "অহনা ইসলামের কবিতা, গল্প, ধারাবাহিক উপন্যাস ও ভাবনার আধুনিক নান্দনিক সাহিত্য আঙিনা।",
  openGraph: {
    title: "অহনা ইসলাম - সাহিত্য ও উপন্যাস পোর্টাল",
    description: "অহনা ইসলামের কবিতা, গল্প, ধারাবাহিক উপন্যাস ও ভাবনার আধুনিক নান্দনিক সাহিত্য আঙিনা।",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.maateen.me" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Instrument+Serif:ital@0;1&family=Noto+Serif+Bengali:wght@400;500;600;700&family=Roboto:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    if (typeof window !== 'undefined') {
      var _fetch = window.fetch;
      try {
        Object.defineProperty(window, 'fetch', {
          get: function() { return _fetch; },
          set: function(val) { _fetch = val; },
          configurable: true,
          enumerable: true
        });
      } catch (err) {}

      window.addEventListener('error', function(event) {
        if (event && event.message && event.message.indexOf('Cannot set property fetch') !== -1) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      });
    }
  } catch (e) {}
})();
`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <DatabaseSyncProvider>
          <SmoothScrollProvider>
            <ContentProtection />
            {children}
          </SmoothScrollProvider>
        </DatabaseSyncProvider>
      </body>
    </html>
  );
}
