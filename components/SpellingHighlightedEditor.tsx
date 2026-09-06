"use client";

import React, { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { checkSpelling, fixSingleMistake, SpellingMistake } from "@/lib/spelling";

interface SpellingHighlightedEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  minHeight?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
}

const SHARED_TYPOGRAPHY_STYLES: React.CSSProperties = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Hind Siliguri', 'Noto Serif Bengali', sans-serif",
  fontSize: "16px",
  lineHeight: "1.85",
  letterSpacing: "0px",
  wordSpacing: "0px",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  overflowWrap: "break-word",
  boxSizing: "border-box",
  padding: "16px 16px",
  margin: 0,
  border: "none",
  outline: "none",
  textAlign: "left",
  tabSize: 4,
};

export default function SpellingHighlightedEditor({
  value,
  onChange,
  placeholder = "এখানে লিখুন...",
  rows = 10,
  minHeight = "240px",
  className = "",
  id,
  disabled = false,
  required = false,
}: SpellingHighlightedEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [activeMistake, setActiveMistake] = useState<SpellingMistake | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const [acceptedWords, setAcceptedWords] = useState<Set<string>>(new Set());

  // Compute spelling mistakes in real-time
  const spellResult = useMemo(() => {
    return checkSpelling(value, acceptedWords);
  }, [value, acceptedWords]);

  const handleAcceptWord = (wordToAccept: string) => {
    setAcceptedWords((prev) => {
      const next = new Set(prev);
      next.add(wordToAccept);
      next.add(wordToAccept.toLowerCase());
      return next;
    });
    setActiveMistake(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Keep backdrop scroll perfectly synchronized with textarea
  const handleScroll = useCallback(() => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Check cursor position to identify which mistake the user is touching
  const updateActiveMistakeAtCursor = useCallback(() => {
    if (!textareaRef.current || !spellResult.mistakes.length) {
      setActiveMistake(null);
      return;
    }
    const cursor = textareaRef.current.selectionStart;
    const found = spellResult.mistakes.find(
      (m) => cursor >= m.startIndex && cursor <= m.endIndex
    );
    if (found) {
      setActiveMistake(found);
      if (containerRef.current && textareaRef.current) {
        const textBefore = value.slice(0, found.startIndex);
        const lines = textBefore.split("\n");
        const lineIndex = lines.length - 1;
        const approxTop = Math.min(
          lineIndex * 28 + 36 - textareaRef.current.scrollTop,
          textareaRef.current.clientHeight - 45
        );
        setTooltipPos({ top: Math.max(8, approxTop), left: 24 });
      }
    } else {
      setActiveMistake(null);
    }
  }, [spellResult.mistakes, value]);

  const handleFix = (mistake: SpellingMistake, chosen: string) => {
    const updated = fixSingleMistake(value, mistake, chosen);
    onChange(updated);
    setActiveMistake(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Build backdrop segments with red wavy underline for misspelled words
  const backdropContent = useMemo(() => {
    if (!value) return null;
    const segments: React.ReactNode[] = [];
    let lastIndex = 0;

    spellResult.mistakes.forEach((mistake, idx) => {
      // Normal text before this mistake
      if (mistake.startIndex > lastIndex) {
        segments.push(
          <span key={`text-${lastIndex}`} style={{ color: "transparent", WebkitTextFillColor: "transparent" }}>
            {value.slice(lastIndex, mistake.startIndex)}
          </span>
        );
      }

      // Misspelled word with GUARANTEED RED WAVY UNDERLINE
      // Uses both SVG wavy background-image (supported in 100% of browsers) and native CSS text-decoration wavy
      segments.push(
        <span
          key={`mistake-${mistake.id || idx}`}
          style={{
            color: "transparent",
            WebkitTextFillColor: "transparent",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 6 3'%3E%3Cpath d='M0 2.4 Q 1.5 0.6, 3 2.4 T 6 2.4' fill='none' stroke='%23dc2626' stroke-width='1.3' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat-x",
            backgroundPosition: "bottom left",
            backgroundSize: "6px 4px",
            paddingBottom: "3px",
            textDecoration: "underline wavy #dc2626 2px",
            textDecorationColor: "#dc2626",
            textDecorationStyle: "wavy",
            textUnderlineOffset: "4px",
            backgroundColor: "rgba(220, 38, 38, 0.08)",
            borderRadius: "2px",
            display: "inline",
          }}
          title={`ভুল বানান: ${mistake.word} (সঠিক রূপ: ${mistake.suggestions.join(", ")})`}
        >
          {mistake.word}
        </span>
      );

      lastIndex = mistake.endIndex;
    });

    // Trailing normal text
    if (lastIndex < value.length) {
      segments.push(
        <span key={`text-${lastIndex}`} style={{ color: "transparent", WebkitTextFillColor: "transparent" }}>
          {value.slice(lastIndex)}
        </span>
      );
    }

    // Trailing newline padding so scroll height matches textarea exactly
    if (value.endsWith("\n")) {
      segments.push(<br key="trailing-br" />);
    }

    return segments;
  }, [value, spellResult.mistakes]);

  // Keep backdrop dimensions and scroll perfectly synchronized with textarea
  const syncDimensions = useCallback(() => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
      backdropRef.current.style.width = `${textareaRef.current.clientWidth}px`;
      backdropRef.current.style.height = `${textareaRef.current.clientHeight}px`;
    }
  }, []);

  useEffect(() => {
    syncDimensions();
  }, [value, syncDimensions]);

  useEffect(() => {
    if (!textareaRef.current) return;
    const observer = new ResizeObserver(() => {
      syncDimensions();
    });
    observer.observe(textareaRef.current);
    return () => observer.disconnect();
  }, [syncDimensions]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        borderRadius: "var(--adm-radius, 8px)",
        border: spellResult.totalMistakes > 0 ? "1px solid #ef4444" : "1px solid var(--adm-line, #e2e8f0)",
        background: "#ffffff",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)",
        transition: "border-color 0.2s ease",
      }}
      className={`spelling-editor-wrap ${className}`}
    >
      {/* Invisible backdrop with red wavy underline directly beneath misspelled words */}
      <div
        ref={backdropRef}
        aria-hidden="true"
        style={{
          ...SHARED_TYPOGRAPHY_STYLES,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          overflowY: "hidden",
          overflowX: "hidden",
          color: "transparent",
          WebkitTextFillColor: "transparent",
          zIndex: 1,
          userSelect: "none",
        }}
      >
        {backdropContent}
      </div>

      {/* Primary Textarea for completely natural Bengali & English typing */}
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={() => {
          handleScroll();
          syncDimensions();
        }}
        onClick={updateActiveMistakeAtCursor}
        onKeyUp={updateActiveMistakeAtCursor}
        onSelect={updateActiveMistakeAtCursor}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        required={required}
        spellCheck={false}
        style={{
          ...SHARED_TYPOGRAPHY_STYLES,
          position: "relative",
          width: "100%",
          minHeight,
          background: "transparent",
          color: "var(--adm-ink, #0f172a)",
          resize: "vertical",
          zIndex: 2,
          display: "block",
        }}
      />

      {/* Quick floating correction helper if cursor touches a red-underlined mistake */}
      {activeMistake && tooltipPos && (
        <div
          style={{
            position: "absolute",
            top: `${tooltipPos.top}px`,
            left: `${tooltipPos.left}px`,
            zIndex: 15,
            background: "#ffffff",
            border: "1.5px solid #fca5a5",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
            padding: "8px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            maxWidth: "380px",
            animation: "fadeIn 0.12s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", color: "#dc2626", fontWeight: 700 }}>
                বানান ত্রুটি: <del>{activeMistake.word}</del>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveMistake(null)}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: "13px",
                padding: "2px 4px",
                lineHeight: 1,
              }}
              title="বন্ধ করুন"
            >
              ✕
            </button>
          </div>

          {activeMistake.explanation && (
            <div style={{ fontSize: "11px", color: "#64748b", lineHeight: 1.4 }}>
              {activeMistake.explanation}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
            {activeMistake.suggestions.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => handleFix(activeMistake, sug)}
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #86efac",
                  color: "#15803d",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
                title="সঠিক বানান প্রয়োগ করুন"
              >
                ✓ {sug}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleAcceptWord(activeMistake.word)}
              style={{
                background: "#f8fafc",
                border: "1px solid #cbd5e1",
                color: "#475569",
                padding: "3px 8px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              title="এই শব্দটিকে সঠিক হিসেবে গ্রহণ করুন"
            >
              শব্দটি সঠিক ধরুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
