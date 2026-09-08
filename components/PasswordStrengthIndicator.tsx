"use client";

import React from "react";
import { checkPasswordStrength, PasswordStrengthResult } from "@/lib/userAuth";
import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
  showDetails?: boolean;
}

export default function PasswordStrengthIndicator({
  password,
  showDetails = true,
}: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const result: PasswordStrengthResult = checkPasswordStrength(password);
  const { score, isStrong, checks } = result;

  const getColor = () => {
    if (score <= 2) return "#ef4444"; // red
    if (score <= 4) return "#f59e0b"; // amber
    return "#16a34a"; // green
  };

  const getLabel = () => {
    if (score <= 2) return "দুর্বল পাসওয়ার্ড (গ্রহণযোগ্য নয়)";
    if (score <= 4) return "মাঝারি পাসওয়ার্ড (সব শর্ত পূরণ করুন)";
    return "শক্তিশালী ও নিরাপদ পাসওয়ার্ড ✓";
  };

  const color = getColor();

  return (
    <div
      style={{
        marginTop: "8px",
        padding: "10px 12px",
        borderRadius: "10px",
        background: "rgba(0, 0, 0, 0.03)",
        border: "1px solid var(--line, #e2e8f0)",
        fontFamily: "var(--font-siliguri), sans-serif",
      }}
    >
      {/* Progress Bar & Label */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{ fontSize: "11.5px", fontWeight: 600, color }}>
          {getLabel()}
        </span>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)" }}>
          {score}/৫
        </span>
      </div>

      <div
        style={{
          width: "100%",
          height: "5px",
          background: "var(--line, #e2e8f0)",
          borderRadius: "4px",
          overflow: "hidden",
          marginBottom: showDetails ? "8px" : "0",
        }}
      >
        <div
          style={{
            width: `${(score / 5) * 100}%`,
            height: "100%",
            background: color,
            transition: "all 0.25s ease",
            borderRadius: "4px",
          }}
        />
      </div>

      {showDetails && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4px 8px",
            fontSize: "11px",
            color: "var(--muted)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: checks.length ? "#16a34a" : "var(--muted)" }}>
            {checks.length ? <Check size={12} /> : <span style={{ width: "12px", textAlign: "center" }}>•</span>}
            <span>কমপক্ষে ৮ অক্ষর</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: checks.uppercase ? "#16a34a" : "var(--muted)" }}>
            {checks.uppercase ? <Check size={12} /> : <span style={{ width: "12px", textAlign: "center" }}>•</span>}
            <span>বড় হাতের অক্ষর (A-Z)</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: checks.lowercase ? "#16a34a" : "var(--muted)" }}>
            {checks.lowercase ? <Check size={12} /> : <span style={{ width: "12px", textAlign: "center" }}>•</span>}
            <span>ছোট হাতের অক্ষর (a-z)</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: checks.number ? "#16a34a" : "var(--muted)" }}>
            {checks.number ? <Check size={12} /> : <span style={{ width: "12px", textAlign: "center" }}>•</span>}
            <span>সংখ্যা (০-৯)</span>
          </div>

          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: checks.special ? "#16a34a" : "var(--muted)",
            }}
          >
            {checks.special ? <Check size={12} /> : <span style={{ width: "12px", textAlign: "center" }}>•</span>}
            <span>বিশেষ চিহ্ন (@, #, $, %, !, @ ইত্যাদি)</span>
          </div>
        </div>
      )}
    </div>
  );
}
