"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Star, Check, X, Sparkles, MessageSquare, Award } from "lucide-react";
import {
  saveRating,
  getUserRatingFor,
  getItemRatingStats,
  formatBengaliNumber,
  ItemRating,
} from "@/lib/store";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetTitle: string;
  targetType: string;
  onRatingSubmitted?: (rating: ItemRating) => void;
}

const RATING_LABELS: Record<number, { text: string; sub: string }> = {
  1: { text: "ভালো লাগেনি", sub: "লেখাটি মনের মতো হয়নি" },
  2: { text: "চলনসই", sub: "মোটামুটি লেগেছে" },
  3: { text: "ভালো লেগেছে", sub: "পড়তে ভালোই লেগেছে" },
  4: { text: "খুব চমৎকার", sub: "দারুণ অনুভূতি ও ভাষা" },
  5: { text: "অসাধারণ ও হৃদয়স্পর্শী", sub: "গভীরভাবে মন ছুঁয়ে গেছে" },
};

export default function RatingModal({
  isOpen,
  onClose,
  targetId,
  targetTitle,
  targetType,
  onRatingSubmitted,
}: RatingModalProps) {
  const [mounted, setMounted] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [readerName, setReaderName] = useState<string>("");
  const [review, setReview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState<boolean>(false);
  const [existingUserRating, setExistingUserRating] = useState<number | null>(null);
  const [stats, setStats] = useState<{ average: number; count: number }>({ average: 0, count: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // When opened or target changes, load existing state
  useEffect(() => {
    if (!isOpen || !targetId) return;

    const prior = getUserRatingFor(targetId);
    setExistingUserRating(prior);
    if (prior) {
      setRating(prior);
    } else {
      setRating(5); // Default to 5 stars
    }

    const itemStats = getItemRatingStats(targetId);
    setStats({ average: itemStats.average, count: itemStats.count });

    // Load remembered reader name from localStorage
    try {
      const savedName = localStorage.getItem("ahona_reader_name");
      if (savedName) setReaderName(savedName);
    } catch {
      // ignore
    }

    setSubmittedSuccessfully(false);
    setIsSubmitting(false);
  }, [isOpen, targetId]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const effectiveRating = hoverRating ?? rating;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (effectiveRating < 1 || isSubmitting) return;

    setIsSubmitting(true);

    const nameToSave = readerName.trim() || "মুগ্ধ পাঠক";
    try {
      localStorage.setItem("ahona_reader_name", nameToSave);
    } catch {
      // ignore
    }

    const saved = saveRating({
      targetId,
      targetTitle,
      targetType,
      rating: effectiveRating,
      review: review.trim() || undefined,
      readerName: nameToSave,
    });

    setSubmittedSuccessfully(true);
    setIsSubmitting(false);

    if (onRatingSubmitted) {
      onRatingSubmitted(saved);
    }

    // Auto-close after brief celebration
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return createPortal(
    <div
      className="rating-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 16, 24, 0.78)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
        padding: "16px",
      }}
    >
      <div
        className="rating-modal-card"
        style={{
          background: "var(--card, #fffdf8)",
          color: "var(--ink, #1c2420)",
          border: "1px solid var(--line, #dcd7cb)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35)",
          overflow: "hidden",
          position: "relative",
          animation: "ratingModalPopIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        {/* Decorative Top Accent Bar */}
        <div
          style={{
            height: "4px",
            background: "linear-gradient(90deg, var(--gold, #caa869), var(--accent, #a04834), var(--gold, #caa869))",
            width: "100%",
          }}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="বন্ধ করুন"
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            border: "1px solid var(--line, #dcd7cb)",
            background: "var(--surface, #f1ede3)",
            color: "var(--muted, #646b60)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <X size={18} />
        </button>

        {submittedSuccessfully ? (
          /* Thank You Celebration View */
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(202, 168, 105, 0.16)",
                color: "var(--gold, #caa869)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <Check size={36} strokeWidth={2.5} />
            </div>

            <h3
              style={{
                fontSize: "22px",
                fontWeight: "600",
                margin: "0 0 8px",
                color: "var(--ink)",
              }}
            >
              অনেক ধন্যবাদ!
            </h3>

            <p
              style={{
                fontSize: "15px",
                color: "var(--muted)",
                lineHeight: "1.6",
                margin: "0 0 16px",
              }}
            >
              আপনার মূল্যবান রেটিং <strong>({formatBengaliNumber(effectiveRating)}/৫ স্টার)</strong> ও সুন্দর অনুভূতি সফলভাবে সংরক্ষিত হয়েছে।
            </p>

            <div
              style={{
                display: "inline-flex",
                gap: "4px",
                padding: "8px 16px",
                background: "var(--surface)",
                borderRadius: "20px",
                border: "1px solid var(--line)",
              }}
            >
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={18}
                  fill={s <= effectiveRating ? "var(--gold, #caa869)" : "transparent"}
                  color={s <= effectiveRating ? "var(--gold, #caa869)" : "var(--muted)"}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Rating Form View */
          <form onSubmit={handleSubmit} style={{ padding: "26px 24px 22px" }}>
            {/* Header / Target info */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--accent, #a04834)",
                  background: "rgba(160, 72, 52, 0.09)",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  marginBottom: "8px",
                }}
              >
                <Sparkles size={13} />
                পাঠ সমাপ্তি · {targetType}
              </span>

              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  lineHeight: "1.35",
                  margin: "0 0 6px",
                  color: "var(--ink)",
                  padding: "0 20px",
                }}
              >
                {targetTitle}
              </h2>

              <p style={{ fontSize: "13.5px", color: "var(--muted)", margin: 0 }}>
                লেখাটি কেমন লাগলো? আপনার রেটিং ও অনুভূতি প্রকাশ করুন
              </p>

              {stats.count > 0 && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "var(--muted)",
                    background: "var(--surface)",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    border: "1px solid var(--line)",
                  }}
                >
                  <Award size={13} style={{ color: "var(--gold)" }} />
                  <span>
                    পাঠকদের গড় রেটিং: <strong>{formatBengaliNumber(stats.average)} ★</strong> ({formatBengaliNumber(stats.count)} জন পাঠক)
                  </span>
                </div>
              )}
            </div>

            {/* Interactive Star Picker */}
            <div
              style={{
                background: "var(--surface, #f1ede3)",
                border: "1px solid var(--line, #dcd7cb)",
                borderRadius: "14px",
                padding: "18px 14px",
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                {[1, 2, 3, 4, 5].map((starNum) => {
                  const isFilled = starNum <= effectiveRating;
                  return (
                    <button
                      key={starNum}
                      type="button"
                      onClick={() => setRating(starNum)}
                      onMouseEnter={() => setHoverRating(starNum)}
                      onMouseLeave={() => setHoverRating(null)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: "6px",
                        cursor: "pointer",
                        outline: "none",
                        transform: isFilled ? "scale(1.12)" : "scale(1)",
                        transition: "transform 0.16s ease, color 0.16s ease",
                      }}
                      aria-label={`${formatBengaliNumber(starNum)} স্টার`}
                    >
                      <Star
                        size={32}
                        fill={isFilled ? "var(--gold, #caa869)" : "transparent"}
                        color={isFilled ? "var(--gold, #caa869)" : "var(--muted, #8b9286)"}
                        strokeWidth={1.75}
                        style={{
                          filter: isFilled ? "drop-shadow(0 2px 6px rgba(202, 168, 105, 0.45))" : "none",
                        }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Sentiment Text */}
              <div style={{ minHeight: "38px" }}>
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "var(--gold, #caa869)",
                    margin: "0 0 2px",
                  }}
                >
                  {formatBengaliNumber(effectiveRating)}/৫ স্টার · {RATING_LABELS[effectiveRating]?.text}
                </p>
                <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>
                  {RATING_LABELS[effectiveRating]?.sub}
                </p>
              </div>
            </div>

            {/* Reader Name (Optional) */}
            <div style={{ marginBottom: "14px" }}>
              <label
                htmlFor="reader-rating-name"
                style={{
                  display: "block",
                  fontSize: "12.5px",
                  fontWeight: 500,
                  color: "var(--muted)",
                  marginBottom: "5px",
                }}
              >
                আপনার নাম (ঐচ্ছিক)
              </label>
              <input
                id="reader-rating-name"
                type="text"
                value={readerName}
                onChange={(e) => setReaderName(e.target.value)}
                placeholder="যেমন: এক মুগ্ধ পাঠক / আপনার নাম"
                maxLength={40}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--line, #dcd7cb)",
                  background: "var(--card, #fffdf8)",
                  color: "var(--ink, #1c2420)",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Reader Review / Feeling Message (Optional) */}
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="reader-rating-review"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12.5px",
                  fontWeight: 500,
                  color: "var(--muted)",
                  marginBottom: "5px",
                }}
              >
                <MessageSquare size={13} />
                আপনার অনুভূতি বা মন্তব্য (ঐচ্ছিক)
              </label>
              <textarea
                id="reader-rating-review"
                rows={2}
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="লেখাটি পড়ে মনের অনুভূতি বা মতামত জানাতে পারেন..."
                maxLength={300}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--line, #dcd7cb)",
                  background: "var(--card, #fffdf8)",
                  color: "var(--ink, #1c2420)",
                  fontSize: "13.5px",
                  lineHeight: "1.5",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Notification if previously rated */}
            {existingUserRating && (
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--muted)",
                  margin: "0 0 16px",
                  textAlign: "center",
                  fontStyle: "italic",
                }}
              >
                * আপনি পূর্বে {formatBengaliNumber(existingUserRating)} স্টার দিয়েছিলেন। নতুন রেটিং দিলে তা আপডেট হবে।
              </p>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: "11px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--line, #dcd7cb)",
                  background: "transparent",
                  color: "var(--muted, #646b60)",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                এখন নয়
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  flex: 2,
                  padding: "11px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background: "var(--accent, #a04834)",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: isSubmitting ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(160, 72, 52, 0.28)",
                  transition: "transform 0.15s ease, background 0.15s ease",
                }}
              >
                <Star size={16} fill="#fff" />
                {isSubmitting ? "সংরক্ষণ হচ্ছে..." : "রেটিং জমা দিন"}
              </button>
            </div>
          </form>
        )}
      </div>

      <style jsx global>{`
        @keyframes ratingModalPopIn {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(14px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>,
    document.body
  );
}
