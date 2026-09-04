"use client";

import { useState, useMemo } from "react";
import {
  checkSpelling,
  fixSingleMistake,
  fixAllMistakes,
  SpellingMistake,
} from "@/lib/spelling";
import { formatBengaliNumber } from "@/lib/store";

interface SpellingCheckerWidgetProps {
  text: string;
  onTextChange: (newText: string) => void;
  onTransferToPost?: (newText: string) => void;
  showTransferButton?: boolean;
}

export default function SpellingCheckerWidget({
  text,
  onTextChange,
  onTransferToPost,
  showTransferButton = false,
}: SpellingCheckerWidgetProps) {
  const [filterLang, setFilterLang] = useState<"all" | "bn" | "en">("all");
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const spellResult = useMemo(() => {
    return checkSpelling(text);
  }, [text]);

  const filteredMistakes = useMemo(() => {
    if (filterLang === "all") return spellResult.mistakes;
    return spellResult.mistakes.filter((m) => m.language === filterLang);
  }, [spellResult, filterLang]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleFixSingle = (mistake: SpellingMistake, suggestion: string) => {
    const updated = fixSingleMistake(text, mistake, suggestion);
    onTextChange(updated);
    showToast(`'${mistake.word}' সংশোধন করে '${suggestion}' করা হয়েছে।`);
  };

  const handleFixAll = () => {
    if (!spellResult.mistakes.length) return;
    const updated = fixAllMistakes(text, spellResult.mistakes);
    onTextChange(updated);
    showToast(`সকল (${formatBengaliNumber(spellResult.totalMistakes)}টি) বানান সফলভাবে সংশোধন করা হয়েছে!`);
  };

  const handleCopy = () => {
    if (!text.trim()) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClear = () => {
    if (!text.trim()) return;
    onTextChange("");
    showToast("লেখা সফলভাবে মুছে ফেলা হয়েছে।");
  };

  // Helper: get snippet around word for context
  const getContextSnippet = (mistake: SpellingMistake) => {
    const start = Math.max(0, mistake.startIndex - 25);
    const end = Math.min(text.length, mistake.endIndex + 25);
    const before = text.slice(start, mistake.startIndex);
    const target = text.slice(mistake.startIndex, mistake.endIndex);
    const after = text.slice(mistake.endIndex, end);
    return (
      <span>
        {start > 0 ? "..." : ""}
        {before}
        <mark
          style={{
            background: "#fee2e2",
            color: "#b91c1c",
            fontWeight: 700,
            padding: "2px 4px",
            borderRadius: "4px",
          }}
        >
          {target}
        </mark>
        {after}
        {end < text.length ? "..." : ""}
      </span>
    );
  };

  return (
    <div
      style={{
        background: "var(--adm-card, #ffffff)",
        border: "1px solid var(--adm-line, #dcd7cb)",
        borderRadius: "var(--adm-radius, 8px)",
        padding: "20px",
        marginTop: "16px",
      }}
    >
      {/* Header Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
          borderBottom: "1px solid var(--adm-line, #dcd7cb)",
          paddingBottom: "14px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px" }}>🔍</span>
            <h3 style={{ margin: 0, fontSize: "17px", color: "var(--adm-ink, #1c2420)" }}>
              বাংলা ও ইংরেজি বানান পরীক্ষক (Spelling & Grammar Checker)
            </h3>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--adm-muted, #646b60)" }}>
            বাংলা একাডেমি প্রমিত বানানবিধি ও ইংরেজি ব্যাকরণ অনুযায়ী খসড়ার বানান পরীক্ষা ও স্বয়ংক্রিয় সংশোধন।
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {text.trim() && (
            <button
              type="button"
              onClick={handleClear}
              title="খসড়া টেক্সট পরিষ্কার করুন"
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                background: "var(--adm-bg, #f8f5ee)",
                border: "1px solid var(--adm-line, #dcd7cb)",
                borderRadius: "6px",
                cursor: "pointer",
                color: "var(--adm-danger, #b91c1c)",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>🗑</span>
              <span>লেখা মুছুন</span>
            </button>
          )}

          {spellResult.totalMistakes > 0 && (
            <button
              type="button"
              onClick={handleFixAll}
              style={{
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: 600,
                background: "var(--adm-accent, #a04834)",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(160, 72, 52, 0.25)",
              }}
            >
              ⚡ সব বানান ঠিক করুন ({formatBengaliNumber(spellResult.totalMistakes)}টি)
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            disabled={!text.trim()}
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              background: "var(--adm-bg, #f8f5ee)",
              border: "1px solid var(--adm-line, #dcd7cb)",
              borderRadius: "6px",
              cursor: "pointer",
              color: "var(--adm-ink, #1c2420)",
            }}
          >
            {copied ? "✓ কপি হয়েছে" : "টেক্সট কপি"}
          </button>

          {showTransferButton && onTransferToPost && (
            <button
              type="button"
              onClick={() => onTransferToPost(text)}
              disabled={!text.trim()}
              style={{
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: 600,
                background: "#15803d",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              নতুন পোস্টে পাঠান →
            </button>
          )}
        </div>
      </div>

      {toastMessage && (
        <div
          role="status"
          className="admin-alert-banner success"
          style={{
            marginBottom: "16px",
            fontSize: "13px",
            padding: "10px 16px",
          }}
        >
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Overview Badges & Filters */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "16px",
          padding: "10px 14px",
          background: "var(--adm-bg, #f8f5ee)",
          borderRadius: "6px",
          border: "1px solid var(--adm-line, #dcd7cb)",
        }}
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--adm-ink, #1c2420)" }}>
            পরীক্ষার ফলাফল:
          </span>
          <span
            style={{
              padding: "3px 10px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: 600,
              background: spellResult.totalMistakes > 0 ? "#fee2e2" : "#dcfce7",
              color: spellResult.totalMistakes > 0 ? "#b91c1c" : "#15803d",
            }}
          >
            {spellResult.totalMistakes === 0
              ? "✓ কোনো বানান ত্রুটি পাওয়া যায়নি"
              : `⚠️ ${formatBengaliNumber(spellResult.totalMistakes)}টি বানানে সংশোধন প্রয়োজন`}
          </span>

          {spellResult.bnMistakesCount > 0 && (
            <span style={{ fontSize: "12px", color: "var(--adm-muted, #646b60)" }}>
              বাংলা: <strong>{formatBengaliNumber(spellResult.bnMistakesCount)}</strong>টি
            </span>
          )}

          {spellResult.enMistakesCount > 0 && (
            <span style={{ fontSize: "12px", color: "var(--adm-muted, #646b60)" }}>
              English: <strong>{formatBengaliNumber(spellResult.enMistakesCount)}</strong>
            </span>
          )}
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setFilterLang("all")}
            style={{
              padding: "4px 10px",
              fontSize: "11px",
              borderRadius: "14px",
              border: "1px solid var(--adm-line, #dcd7cb)",
              background: filterLang === "all" ? "var(--adm-accent, #a04834)" : "var(--adm-card, #fff)",
              color: filterLang === "all" ? "#fff" : "var(--adm-ink, #1c2420)",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            সব ভুল ({formatBengaliNumber(spellResult.totalMistakes)}টি)
          </button>
          <button
            type="button"
            onClick={() => setFilterLang("bn")}
            style={{
              padding: "4px 10px",
              fontSize: "11px",
              borderRadius: "14px",
              border: "1px solid var(--adm-line, #dcd7cb)",
              background: filterLang === "bn" ? "var(--adm-accent, #a04834)" : "var(--adm-card, #fff)",
              color: filterLang === "bn" ? "#fff" : "var(--adm-ink, #1c2420)",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            বাংলা ভুল ({formatBengaliNumber(spellResult.bnMistakesCount)}টি)
          </button>
          <button
            type="button"
            onClick={() => setFilterLang("en")}
            style={{
              padding: "4px 10px",
              fontSize: "11px",
              borderRadius: "14px",
              border: "1px solid var(--adm-line, #dcd7cb)",
              background: filterLang === "en" ? "var(--adm-accent, #a04834)" : "var(--adm-card, #fff)",
              color: filterLang === "en" ? "#fff" : "var(--adm-ink, #1c2420)",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            English ভুল ({formatBengaliNumber(spellResult.enMistakesCount)}টি)
          </button>
        </div>
      </div>

      {/* Mistakes Card Stream */}
      {filteredMistakes.length === 0 ? (
        <div
          style={{
            padding: "32px 20px",
            textAlign: "center",
            background: text.trim() ? "rgba(45, 90, 63, 0.05)" : "var(--adm-bg, #f8f5ee)",
            borderRadius: "8px",
            border: text.trim()
              ? "1px solid rgba(45, 90, 63, 0.2)"
              : "1px dashed var(--adm-line, #dcd7cb)",
          }}
        >
          <span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}>
            {text.trim() ? "✓" : "✍️"}
          </span>
          <strong
            style={{
              fontSize: "15px",
              color: text.trim() ? "#1e4530" : "var(--adm-ink, #1c2420)",
              display: "block",
            }}
          >
            {text.trim()
              ? "কোনো বানান ত্রুটি পাওয়া যায়নি"
              : "পরীক্ষার জন্য কোনো লেখা পাওয়া যায়নি"}
          </strong>
          <span
            style={{
              fontSize: "12.5px",
              color: text.trim() ? "#2d5a3f" : "var(--adm-muted, #646b60)",
              display: "block",
              marginTop: "4px",
            }}
          >
            {text.trim()
              ? "বাংলা একাডেমি প্রমিত অভিধান ও ব্যাকরণ নিয়মানুযায়ী এই লেখায় কোনো ভুল শনাক্ত হয়নি।"
              : "উপরে আপনার সাহিত্য খসড়া লিখুন বা পেস্ট করুন। স্বয়ংক্রিয়ভাবে বানান ও ব্যাকরণ পরীক্ষা করা হবে।"}
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "380px", overflowY: "auto", paddingRight: "4px" }}>
          {filteredMistakes.map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                padding: "12px 16px",
                background: "var(--adm-bg, #f8f5ee)",
                border: "1px solid #fecaca",
                borderRadius: "6px",
                borderLeft: "4px solid #ef4444",
              }}
            >
              <div style={{ flex: 1, minWidth: "220px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span
                    style={{
                      background: "#fee2e2",
                      color: "#b91c1c",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "13px",
                      fontWeight: 700,
                      textDecoration: "line-through",
                    }}
                  >
                    {m.word}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--adm-muted, #646b60)" }}>→</span>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {m.suggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleFixSingle(m, sug)}
                        title={`ক্লিক করে '${sug}' দিয়ে সংশোধন করুন`}
                        style={{
                          padding: "3px 10px",
                          fontSize: "13px",
                          fontWeight: 600,
                          background: "#dcfce7",
                          color: "#15803d",
                          border: "1px solid #86efac",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        ✓ {sug}
                      </button>
                    ))}
                  </div>
                </div>

                <p style={{ margin: "4px 0 2px", fontSize: "12px", color: "var(--adm-ink, #1c2420)", lineHeight: "1.5" }}>
                  <strong>নিয়ম:</strong> {m.explanation}
                </p>

                <div style={{ fontSize: "11px", color: "var(--adm-muted, #646b60)", marginTop: "3px" }}>
                  <strong>বাক্যাংশ:</strong> {getContextSnippet(m)}
                </div>
              </div>

              {m.suggestions && m.suggestions.length > 0 ? (
                <button
                  type="button"
                  onClick={() => handleFixSingle(m, m.suggestions[0])}
                  style={{
                    padding: "6px 14px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: "var(--adm-accent, #a04834)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>✓</span>
                  <span>সংশোধন করুন ({m.suggestions[0]})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleFixSingle(m, m.cleanWord)}
                  style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: "var(--adm-line, #dcd7cb)",
                    color: "var(--adm-ink, #1c2420)",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  বাদ দিন
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bottom Sticky/Prominent Action Bar for Mistakes */}
      {spellResult.totalMistakes > 0 && (
        <div
          style={{
            marginTop: "16px",
            padding: "14px 18px",
            background: "rgba(220, 38, 38, 0.05)",
            border: "1px solid rgba(220, 38, 38, 0.25)",
            borderRadius: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>⚠️</span>
            <div>
              <strong style={{ fontSize: "13.5px", color: "#991b1b", display: "block" }}>
                মোট {formatBengaliNumber(spellResult.totalMistakes)}টি শব্দে বানান ভুল শনাক্ত হয়েছে
              </strong>
              <span style={{ fontSize: "12px", color: "#b91c1c" }}>
                (বাংলা ভুল: {formatBengaliNumber(spellResult.bnMistakesCount)}টি, ইংরেজি ভুল: {formatBengaliNumber(spellResult.enMistakesCount)}টি)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFixAll}
            style={{
              padding: "9px 18px",
              fontSize: "13px",
              fontWeight: 700,
              background: "var(--adm-accent, #a04834)",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(160, 72, 52, 0.25)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>⚡</span>
            <span>নিচের সব ভুল বানান ঠিক করুন ({formatBengaliNumber(spellResult.totalMistakes)}টি)</span>
          </button>
        </div>
      )}
    </div>
  );
}
