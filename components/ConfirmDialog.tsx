"use client";

import { useEffect } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemTitle?: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  itemTitle,
  confirmText = "হ্যাঁ, মুছে ফেলুন",
  cancelText = "বাতিল করুন",
  type = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(12, 18, 15, 0.65)",
        backdropFilter: "blur(6px)",
        animation: "fadeInConfirm 0.2s ease-out forwards",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "var(--adm-card, #ffffff)",
          color: "var(--adm-ink, #1c2420)",
          borderRadius: "16px",
          border: "1px solid var(--adm-line, rgba(0,0,0,0.08))",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05)",
          padding: "24px 26px",
          position: "relative",
          animation: "scaleInConfirm 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          fontFamily: "var(--font-siliguri), sans-serif",
        }}
      >
        {/* Header Icon & Close Button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              background:
                type === "danger"
                  ? "rgba(225, 29, 72, 0.12)"
                  : type === "warning"
                  ? "rgba(234, 179, 8, 0.15)"
                  : "rgba(202, 168, 105, 0.15)",
              color:
                type === "danger"
                  ? "#e11d48"
                  : type === "warning"
                  ? "#b45309"
                  : "#92400e",
              border: `1px solid ${
                type === "danger"
                  ? "rgba(225, 29, 72, 0.25)"
                  : "rgba(234, 179, 8, 0.3)"
              }`,
            }}
          >
            {type === "danger" ? "🗑️" : type === "warning" ? "⚠️" : "ℹ️"}
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--adm-muted, #717e77)",
              fontSize: "18px",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "6px",
              lineHeight: 1,
              transition: "color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--adm-ink, #1c2420)";
              e.currentTarget.style.background = "var(--adm-line, rgba(0,0,0,0.05))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--adm-muted, #717e77)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            ✕
          </button>
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: "18px",
            fontWeight: 700,
            margin: "0 0 8px",
            color: "var(--adm-ink, #1c2420)",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h3>

        {/* Message */}
        <p
          style={{
            fontSize: "14px",
            lineHeight: "1.6",
            color: "var(--adm-muted, #5f6c65)",
            margin: "0 0 16px",
          }}
        >
          {message}
        </p>

        {/* Item Title Badge / Quote */}
        {itemTitle && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              background: "var(--adm-bg, #f7f9f7)",
              border: "1px solid var(--adm-line, rgba(0,0,0,0.08))",
              fontSize: "13.5px",
              color: "var(--adm-ink, #1c2420)",
              fontWeight: 600,
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ opacity: 0.6 }}>📌</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              &ldquo;{itemTitle}&rdquo;
            </span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "9px 18px",
              borderRadius: "8px",
              border: "1px solid var(--adm-line, #dce4de)",
              background: "transparent",
              color: "var(--adm-ink, #1c2420)",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--adm-bg, #f3f5f3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: "9px 20px",
              borderRadius: "8px",
              border: "none",
              background:
                type === "danger"
                  ? "#e11d48"
                  : type === "warning"
                  ? "#d97706"
                  : "var(--adm-accent, #2d5a3f)",
              color: "#ffffff",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow:
                type === "danger"
                  ? "0 4px 14px rgba(225, 29, 72, 0.35)"
                  : "0 4px 14px rgba(45, 90, 63, 0.35)",
              transition: "transform 0.1s, opacity 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.92";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "none";
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
