import type { Metadata } from "next";
import "./globals.css";
import DatabaseSyncProvider from "@/components/DatabaseSyncProvider";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";

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
          <SmoothScrollProvider>{children}</SmoothScrollProvider>
        </DatabaseSyncProvider>
      </body>
    </html>
  );
}
