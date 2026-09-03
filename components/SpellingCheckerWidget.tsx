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

  const handleInsertSample = () => {
    const sample = `শ্রদ্ধাঞ্জলী ও পুষ্পাঞ্জলী জানিয়ে অনুষ্ঠানটি শুরু হলো। ইতিপূর্বে তিনি অনেক পুরষ্কার পেয়েছিলেন, তবে তার শারিরীক দূরবস্থা ও দারিদ্রতা নিয়ে সবাই চিন্তিত। তিনি একটি সেমিনার accomodate করতে চেয়েও unfortunatly teh writting সম্পন্ন করতে পারেননি। সচেনতন বুদ্ধিজীবি ও আইনজীবিরা সূর্য্য ও ধর্ম্ম নিয়ে ইতিপূর্বে যে মন্তব্য করেছিলেন তা সমিচিন নয়।`;
    onTextChange(sample);
    showToast("বানান পরীক্ষার জন্য নমুনা লেখা লোড করা হয়েছে!");
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

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleInsertSample}
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
            নমুনা ভুল লেখা পরীক্ষা করুন
          </button>

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
          style={{
            padding: "10px 14px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#166534",
            borderRadius: "6px",
            fontSize: "13px",
            marginBottom: "14px",
          }}
        >
          ✓ {toastMessage}
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
        <div style={{ display: "flex", gap: "4px" }}>
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
            }}
          >
            সব ({formatBengaliNumber(spellResult.totalMistakes)})
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
            }}
          >
            বাংলা ({formatBengaliNumber(spellResult.bnMistakesCount)})
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
            }}
          >
            English ({formatBengaliNumber(spellResult.enMistakesCount)})
          </button>
        </div>
      </div>

      {/* Mistakes Card Stream */}
      {filteredMistakes.length === 0 ? (
        <div
          style={{
            padding: "32px 20px",
            textAlign: "center",
            background: "var(--adm-bg, #f8f5ee)",
            borderRadius: "6px",
            border: "1px dashed var(--adm-line, #dcd7cb)",
          }}
        >
          <span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}>✨</span>
          <strong style={{ fontSize: "15px", color: "var(--adm-ink, #1c2420)", display: "block" }}>
            {text.trim()
              ? "অভিনন্দন! আপনার লেখায় কোনো বানান ত্রুটি শনাক্ত হয়নি।"
              : "এখানে আপনার লেখা পেস্ট করুন বা টাইপ করুন, স্বয়ংক্রিয়ভাবে বানান পরীক্ষা করা হবে।"}
          </strong>
          <span style={{ fontSize: "12px", color: "var(--adm-muted, #646b60)" }}>
            বাংলা একাডেমি প্রমিত বানান অভিধান ও ব্যাকরণ বিধি কার্যকর রয়েছে।
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

              {m.suggestions.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleFixSingle(m, m.suggestions[0])}
                  style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: "var(--adm-accent, #a04834)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  সংশোধন করুন
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
