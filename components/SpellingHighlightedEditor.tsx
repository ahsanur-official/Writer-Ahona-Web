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
}

export default function SpellingHighlightedEditor({
  value,
  onChange,
  placeholder = "এখানে লিখুন...",
  rows = 8,
  minHeight = "180px",
  className = "",
  id,
  disabled = false,
}: SpellingHighlightedEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [activeMistake, setActiveMistake] = useState<SpellingMistake | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);

  // Compute spelling mistakes in real-time
  const spellResult = useMemo(() => {
    return checkSpelling(value);
  }, [value]);

  // Keep backdrop scroll perfectly synchronized with textarea
  const handleScroll = useCallback(() => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Check cursor position or selection to identify which mistake the user is touching
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
      // Rough position estimation inside textarea
      if (containerRef.current && textareaRef.current) {
        const textBefore = value.slice(0, found.startIndex);
        const lines = textBefore.split("\n");
        const lineIndex = lines.length - 1;
        const approxTop = Math.min(
          lineIndex * 27 + 40 - textareaRef.current.scrollTop,
          textareaRef.current.clientHeight - 40
        );
        setTooltipPos({ top: Math.max(10, approxTop), left: 24 });
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
          <span key={`text-${lastIndex}`} style={{ color: "transparent" }}>
            {value.slice(lastIndex, mistake.startIndex)}
          </span>
        );
      }

      // Misspelled word with RED WAVY UNDERLINE and red sign
      segments.push(
        <span
          key={`mistake-${mistake.id || idx}`}
          style={{
            color: "transparent",
            textDecoration: "underline wavy #dc2626 2.5px",
            WebkitTextDecoration: "underline wavy #dc2626 2.5px",
            textUnderlineOffset: "4px",
            borderBottom: "2px wavy #dc2626",
            cursor: "pointer",
            position: "relative",
          }}
          title={`ভুল বানান: ${mistake.word} (সঠিক: ${mistake.suggestions.join(", ")})`}
        >
          {mistake.word}
        </span>
      );

      lastIndex = mistake.endIndex;
    });

    // Trailing normal text
    if (lastIndex < value.length) {
      segments.push(
        <span key={`text-${lastIndex}`} style={{ color: "transparent" }}>
          {value.slice(lastIndex)}
        </span>
      );
    }

    // Trailing space/newline padding so scroll height matches textarea exactly
    if (value.endsWith("\n")) {
      segments.push(<br key="trailing-br" />);
    }

    return segments;
  }, [value, spellResult.mistakes]);

  useEffect(() => {
    handleScroll();
  }, [value, handleScroll]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        borderRadius: "var(--adm-radius, 8px)",
        border: spellResult.totalMistakes > 0 ? "1.5px solid #f87171" : "1px solid var(--adm-line, #e2e8f0)",
        background: "var(--adm-card, #ffffff)",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)",
        transition: "border-color 0.2s ease",
      }}
      className={className}
    >
      {/* Invisible backdrop with red wavy underline for misspelled words */}
      <div
        ref={backdropRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          padding: "16px 18px",
          fontSize: "15px",
          lineHeight: "1.8",
          fontFamily: "inherit",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflow: "hidden",
          boxSizing: "border-box",
          color: "transparent",
          zIndex: 1,
          userSelect: "none",
        }}
      >
        {backdropContent}
      </div>

      {/* Primary Textarea for completely natural typing & native caret */}
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        onClick={updateActiveMistakeAtCursor}
        onKeyUp={updateActiveMistakeAtCursor}
        onSelect={updateActiveMistakeAtCursor}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        spellCheck={false}
        style={{
          position: "relative",
          width: "100%",
          minHeight,
          padding: "16px 18px",
          fontSize: "15px",
          lineHeight: "1.8",
          fontFamily: "inherit",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          background: "transparent",
          color: "var(--adm-ink, #0f172a)",
          border: "none",
          outline: "none",
          resize: "vertical",
          boxSizing: "border-box",
          zIndex: 2,
          display: "block",
        }}
      />

      {/* Floating suggestion tooltip when cursor touches a red-underlined misspelled word */}
      {activeMistake && tooltipPos && (
        <div
          style={{
            position: "absolute",
            top: `${tooltipPos.top}px`,
            left: `${tooltipPos.left}px`,
            zIndex: 10,
            background: "#ffffff",
            border: "1.5px solid #fca5a5",
            borderRadius: "8px",
            boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            animation: "fadeIn 0.15s ease",
          }}
        >
          <span style={{ fontSize: "12px", color: "#dc2626", fontWeight: 700 }}>
            ভুল: <del>{activeMistake.word}</del>
          </span>
          <span style={{ fontSize: "12px", color: "#64748b" }}>➔</span>
          <div style={{ display: "flex", gap: "6px" }}>
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
                }}
                title="সঠিক বানান প্রয়োগ করুন"
              >
                ✓ {sug}
              </button>
            ))}
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
              marginLeft: "4px",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Subtle indicator bar below the editor */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "6px 14px",
          borderTop: "1px solid var(--adm-line, #f1f5f9)",
          background: "var(--adm-bg, #f8fafc)",
          borderBottomLeftRadius: "var(--adm-radius, 8px)",
          borderBottomRightRadius: "var(--adm-radius, 8px)",
          fontSize: "11px",
        }}
      >
        {spellResult.totalMistakes > 0 ? (
          <span style={{ color: "#dc2626", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span style={{ textDecoration: "underline wavy #dc2626 2px" }}>লাল আন্ডারলাইন</span>
            <span>চিহ্নিত ভুল শব্দে কার্সার রাখলেই সঠিক বানান বেছে নেওয়া যাবে।</span>
          </span>
        ) : (
          <span style={{ color: "#15803d", fontWeight: 600 }}>
            ✓ বানান সম্পূর্ণ নির্ভুল
          </span>
        )}

        {/* Quick inline click to fix all if multiple mistakes */}
        {spellResult.totalMistakes > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#dc2626", fontWeight: 700 }}>
              {spellResult.totalMistakes}টি ভুল
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
