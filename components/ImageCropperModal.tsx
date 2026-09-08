/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

export type AspectRatioOption = "16:9" | "4:3" | "1:1" | "3:4" | "free";

interface ImageCropperModalProps {
  imageSrc: string;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
  defaultAspectRatio?: AspectRatioOption;
  title?: string;
}

export default function ImageCropperModal({
  imageSrc,
  isOpen,
  onClose,
  onCropComplete,
  defaultAspectRatio = "16:9",
  title = "ছবির ফ্রেম ও সাইজ সমন্বয় (Crop & Adjust)",
}: ImageCropperModalProps) {
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>(defaultAspectRatio);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [isFlippedH, setIsFlippedH] = useState(false);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load and inspect image dimensions
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImageMeta({ width: img.naturalWidth, height: img.naturalHeight });
      // Reset transformations
      setZoom(1);
      setRotation(0);
      setIsFlippedH(false);
      setPanOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  // Calculate crop container target ratio
  const getNumericRatio = useCallback((): number => {
    if (aspectRatio === "16:9") return 16 / 9;
    if (aspectRatio === "4:3") return 4 / 3;
    if (aspectRatio === "1:1") return 1;
    if (aspectRatio === "3:4") return 3 / 4;
    if (imageMeta && imageMeta.height > 0) return imageMeta.width / imageMeta.height;
    return 16 / 9;
  }, [aspectRatio, imageMeta]);

  // Mouse & Touch Drag Handlers
  const handlePointerDown = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX - panOffset.x, y: clientY - panOffset.y });
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setPanOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Zoom helpers
  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.max(0.8, Math.min(3.5, Number(newZoom.toFixed(2))));
    setZoom(clamped);
  };

  // Rotate helper
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Reset helper
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setIsFlippedH(false);
    setPanOffset({ x: 0, y: 0 });
  };

  // Perform canvas crop
  const handleApplyCrop = () => {
    if (!imageSrc || !imageMeta || !containerRef.current) return;
    setIsProcessing(true);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const container = containerRef.current;
      if (!container) {
        setIsProcessing(false);
        return;
      }

      const rect = container.getBoundingClientRect();
      const targetRatio = getNumericRatio();

      // Output resolution optimized for fast web loading and retina clarity
      let outWidth = 1280;
      let outHeight = Math.round(outWidth / targetRatio);

      if (aspectRatio === "1:1") {
        outWidth = 900;
        outHeight = 900;
      } else if (aspectRatio === "3:4") {
        outWidth = 900;
        outHeight = 1200;
      } else if (aspectRatio === "4:3") {
        outWidth = 1200;
        outHeight = 900;
      } else if (aspectRatio === "free" && imageMeta) {
        outWidth = Math.min(1280, imageMeta.width);
        outHeight = Math.round(outWidth / (imageMeta.width / imageMeta.height));
      }

      const canvas = document.createElement("canvas");
      canvas.width = outWidth;
      canvas.height = outHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      // Smooth image rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Fill background in case of transparent borders
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outWidth, outHeight);

      // We translate context to center of output canvas
      ctx.save();
      ctx.translate(outWidth / 2, outHeight / 2);

      // Scale factor between visual preview container and canvas output
      const scaleToCanvas = outWidth / rect.width;

      // Apply Pan offset
      ctx.translate(panOffset.x * scaleToCanvas, panOffset.y * scaleToCanvas);

      // Apply Rotation
      ctx.rotate((rotation * Math.PI) / 180);

      // Apply Horizontal Flip
      if (isFlippedH) {
        ctx.scale(-1, 1);
      }

      // Base fitted dimensions of image inside preview container
      const isRotatedQuarter = rotation === 90 || rotation === 270;
      const baseImgW = isRotatedQuarter ? imageMeta.height : imageMeta.width;
      const baseImgH = isRotatedQuarter ? imageMeta.width : imageMeta.height;

      // Cover scaling so image covers container at 1x
      const scaleCover = Math.max(rect.width / baseImgW, rect.height / baseImgH);
      const drawW = imageMeta.width * scaleCover * zoom * scaleToCanvas;
      const drawH = imageMeta.height * scaleCover * zoom * scaleToCanvas;

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Output compressed high quality JPEG/WebP
      const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
      onCropComplete(dataUrl);
      setIsProcessing(false);
      onClose();
    };

    img.onerror = () => {
      setIsProcessing(false);
      alert("ছবি প্রসেস করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    };

    img.src = imageSrc;
  };

  if (!isOpen || !mounted || typeof document === "undefined") {
    return null;
  }

  const currentRatio = getNumericRatio();

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999999,
        backgroundColor: "rgba(15, 10, 8, 0.82)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        animation: "fadeIn 0.2s ease-out",
        fontFamily: "var(--font-siliguri), system-ui, sans-serif",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "760px",
          maxHeight: "92vh",
          background: "var(--adm-card, #ffffff)",
          borderRadius: "18px",
          boxShadow: "0 25px 60px -10px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid var(--adm-line, #e2d9cf)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--adm-line, #e2e8f0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--adm-surface, #faf8f5)",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--adm-text, #1e293b)" }}>
              {title}
            </h3>
            <p style={{ margin: "3px 0 0", fontSize: "12px", color: "var(--adm-muted, #64748b)" }}>
              ওয়েব ও মোবাইলের জন্য নিখুঁত অনুপাতে কাটুন, ড্র্যাগ করে অবস্থান পরিবর্তন ও জুম করুন
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "rgba(0,0,0,0.06)",
              border: "none",
              fontSize: "15px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--adm-text, #1e293b)",
            }}
          >
            ✕
          </button>
        </div>

        {/* Aspect Ratio Selector */}
        <div
          style={{
            padding: "10px 20px",
            background: "var(--adm-surface, #faf8f5)",
            borderBottom: "1px solid var(--adm-line, #e2e8f0)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            overflowX: "auto",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--adm-muted)", whiteSpace: "nowrap" }}>
            অনুপাত:
          </span>
          {[
            { key: "16:9", label: "১৬:৯ (পোস্ট / ব্যানার)" },
            { key: "4:3", label: "৪:৩ (স্ট্যান্ডার্ড কভার)" },
            { key: "1:1", label: "১:১ (বর্গাকার)" },
            { key: "3:4", label: "৩:৪ (উপন্যাস কভার)" },
            { key: "free", label: "স্বাভাবিক অনুপাত" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setAspectRatio(item.key as AspectRatioOption);
                setPanOffset({ x: 0, y: 0 });
              }}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                borderRadius: "14px",
                border: "1px solid",
                borderColor: aspectRatio === item.key ? "var(--adm-accent, #a04834)" : "var(--adm-line, #cbd5e1)",
                background: aspectRatio === item.key ? "var(--adm-accent, #a04834)" : "var(--adm-card, #ffffff)",
                color: aspectRatio === item.key ? "#ffffff" : "var(--adm-text, #334155)",
                fontWeight: aspectRatio === item.key ? 700 : 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Interactive Cropper Stage */}
        <div
          style={{
            flex: 1,
            background: "#120e0b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            overflow: "hidden",
            position: "relative",
            userSelect: "none",
            touchAction: "none",
          }}
          onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
          onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={(e) => {
            if (e.touches[0]) handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchMove={(e) => {
            if (e.touches[0]) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchEnd={handlePointerUp}
        >
          {/* Crop Frame Box */}
          <div
            ref={containerRef}
            style={{
              width: "100%",
              maxWidth: "560px",
              aspectRatio: `${currentRatio}`,
              maxHeight: "44vh",
              position: "relative",
              overflow: "hidden",
              borderRadius: aspectRatio === "1:1" ? "12px" : "10px",
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.65), 0 0 20px rgba(0,0,0,0.8)",
              border: "2px solid #ffffff",
              cursor: isDragging ? "grabbing" : "grab",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#1a1614",
            }}
          >
            {/* Rule of Thirds Grid */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                zIndex: 10,
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gridTemplateRows: "1fr 1fr 1fr",
                opacity: 0.35,
              }}
            >
              <div style={{ borderRight: "1px dashed #ffffff", borderBottom: "1px dashed #ffffff" }} />
              <div style={{ borderRight: "1px dashed #ffffff", borderBottom: "1px dashed #ffffff" }} />
              <div style={{ borderBottom: "1px dashed #ffffff" }} />
              <div style={{ borderRight: "1px dashed #ffffff", borderBottom: "1px dashed #ffffff" }} />
              <div style={{ borderRight: "1px dashed #ffffff", borderBottom: "1px dashed #ffffff" }} />
              <div style={{ borderBottom: "1px dashed #ffffff" }} />
              <div style={{ borderRight: "1px dashed #ffffff" }} />
              <div style={{ borderRight: "1px dashed #ffffff" }} />
              <div />
            </div>

            {/* The Image inside crop frame */}
            {imageSrc && (
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop Target"
                draggable={false}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom}) rotate(${rotation}deg) ${
                    isFlippedH ? "scaleX(-1)" : ""
                  }`,
                  transformOrigin: "center center",
                  transition: isDragging ? "none" : "transform 0.1s ease-out",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              />
            )}
          </div>

          <div
            style={{
              position: "absolute",
              bottom: "10px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.6)",
              color: "#ffffff",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "11px",
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            🖱️ মাউস বা আঙুল দিয়ে টেনে পজিশন ঠিক করুন
          </div>
        </div>

        {/* Adjustment Controls Bar */}
        <div
          style={{
            padding: "14px 20px",
            background: "var(--adm-surface, #faf8f5)",
            borderTop: "1px solid var(--adm-line, #e2e8f0)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
          }}
        >
          {/* Zoom Slider */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1 1 240px" }}>
            <span style={{ fontSize: "12px", color: "var(--adm-muted)", fontWeight: 600 }}>🔍 জুম:</span>
            <button
              type="button"
              onClick={() => handleZoomChange(zoom - 0.15)}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                border: "1px solid var(--adm-line)",
                background: "var(--adm-card)",
                fontSize: "14px",
                cursor: "pointer",
              }}
              title="জুম কমান"
            >
              ➖
            </button>
            <input
              type="range"
              min="0.8"
              max="3.0"
              step="0.05"
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: "var(--adm-accent, #a04834)", cursor: "pointer" }}
            />
            <button
              type="button"
              onClick={() => handleZoomChange(zoom + 0.15)}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                border: "1px solid var(--adm-line)",
                background: "var(--adm-card)",
                fontSize: "14px",
                cursor: "pointer",
              }}
              title="জুম বাড়ান"
            >
              ➕
            </button>
            <span style={{ fontSize: "12px", minWidth: "42px", color: "var(--adm-text)", fontWeight: 600 }}>
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Transform Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              onClick={handleRotate}
              style={{
                padding: "6px 10px",
                borderRadius: "8px",
                border: "1px solid var(--adm-line)",
                background: "var(--adm-card)",
                fontSize: "12px",
                cursor: "pointer",
                color: "var(--adm-text)",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
              title="ঘড়ির কাঁটার দিকে ৯০ ডিগ্রি ঘোরান"
            >
              <span>⟳</span>
              <span>৯০° ঘোরান</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFlippedH(!isFlippedH)}
              style={{
                padding: "6px 10px",
                borderRadius: "8px",
                border: "1px solid var(--adm-line)",
                background: isFlippedH ? "var(--adm-accent)" : "var(--adm-card)",
                color: isFlippedH ? "#fff" : "var(--adm-text)",
                fontSize: "12px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
              title="পাশাপাশি উল্টান"
            >
              <span>⇄</span>
              <span>উল্টান</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: "6px 10px",
                borderRadius: "8px",
                border: "1px solid var(--adm-line)",
                background: "var(--adm-card)",
                fontSize: "12px",
                cursor: "pointer",
                color: "var(--adm-muted)",
              }}
              title="সকল অ্যাডজাস্টমেন্ট আগের মতো করুন"
            >
              ↺ রিসেট
            </button>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid var(--adm-line, #e2e8f0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--adm-card, #ffffff)",
          }}
        >
          <span style={{ fontSize: "12px", color: "var(--adm-muted)" }}>
            সাইজ: {aspectRatio === "16:9" ? "1280×720px (ওয়েব অপ্টিমাইজড)" : aspectRatio === "4:3" ? "1200×900px" : aspectRatio === "1:1" ? "900×900px" : "কাস্টম সাইজ"}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid var(--adm-line)",
                background: "transparent",
                fontSize: "13px",
                cursor: "pointer",
                color: "var(--adm-text)",
              }}
            >
              বাতিল
            </button>

            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={isProcessing}
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                background: "var(--adm-accent, #a04834)",
                color: "#ffffff",
                border: "none",
                fontSize: "13.5px",
                fontWeight: 700,
                cursor: isProcessing ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 8px rgba(160, 72, 52, 0.3)",
              }}
            >
              <span>{isProcessing ? "প্রসেস হচ্ছে..." : "✓ ক্রপ ও সাইজ নিশ্চিত করুন"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
