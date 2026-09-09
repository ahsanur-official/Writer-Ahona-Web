/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { LITERARY_IMAGE_PRESETS, CropSettings } from "@/lib/store";
import ImageCropperModal, { AspectRatioOption } from "./ImageCropperModal";

interface ImagePickerProps {
  value?: string | null; // Cropped display cover URL
  originalValue?: string | null; // Full uncropped main picture URL
  cropSettings?: CropSettings | null;
  onChange: (url: string, originalUrl?: string, settings?: CropSettings) => void;
  label?: string;
  presetType?: "avatars" | "postCovers" | "novelCovers";
  aspectRatio?: "square" | "cover" | "banner" | "avatar";
  hint?: string;
}

export default function ImagePicker({
  value,
  originalValue,
  cropSettings,
  onChange,
  label = "ছবি বা কভার যুক্ত করুন",
  presetType = "postCovers",
  aspectRatio = "cover",
  hint = "ডিভাইস থেকে ফাইল নির্বাচন করুন, সরাসরি URL বসান অথবা নিচে সংরক্ষিত নান্দনিক ছবিগুলো থেকে বেছে নিন।",
}: ImagePickerProps) {
  const [activeTab, setActiveTab] = useState<"preset" | "url" | "upload">("preset");
  const [urlInput, setUrlInput] = useState(value || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [mainPicUrl, setMainPicUrl] = useState<string | null>(originalValue || value || null);
  const [currentCropSettings, setCurrentCropSettings] = useState<CropSettings | null>(cropSettings || null);
  const [isFullViewOpen, setIsFullViewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if props change from outside
  useEffect(() => {
    if (originalValue) {
      setMainPicUrl(originalValue);
    } else if (!mainPicUrl && value) {
      setMainPicUrl(value);
    }
  }, [originalValue, value, mainPicUrl]);

  useEffect(() => {
    if (cropSettings) {
      setCurrentCropSettings(cropSettings);
    }
  }, [cropSettings]);

  const presets =
    presetType === "avatars"
      ? LITERARY_IMAGE_PRESETS.avatars
      : presetType === "novelCovers"
      ? LITERARY_IMAGE_PRESETS.novelCovers
      : LITERARY_IMAGE_PRESETS.postCovers;

  const isNovel = presetType === "novelCovers";
  const isAvatar = aspectRatio === "avatar" || presetType === "avatars";
  const isSquare = aspectRatio === "square";

  // Dedicated fixed ratio based on content type: 16:9 for posts, 3:4 for novels, 1:1 for avatars
  const defaultCropRatio: AspectRatioOption = isNovel
    ? "3:4"
    : isAvatar || isSquare
    ? "1:1"
    : "16:9";

  const cropperTitle = isNovel
    ? "উপন্যাসের প্রচ্ছদ - সাইজ ও ফ্রেম সমন্বয়"
    : isAvatar
    ? "প্রোফাইল ছবি - সাইজ ও ফ্রেম সমন্বয়"
    : "গল্প ও কবিতা কভার - সাইজ ও ফ্রেম সমন্বয়";

  // When uploading a device file
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawData = event.target?.result as string;
      setIsProcessing(false);
      // Keep raw uncropped data as the main pic
      setMainPicUrl(rawData);
      setCropperSrc(rawData);
      setCurrentCropSettings(null); // fresh start for new upload
      setIsCropperOpen(true);
    };
    reader.onerror = () => {
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  // Open adjuster using the full original main picture
  const handleOpenAdjuster = () => {
    const target = mainPicUrl || value;
    if (!target) return;
    setCropperSrc(target);
    setIsCropperOpen(true);
  };

  // Apply URL directly and allow crop adjustment
  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      const u = urlInput.trim();
      setMainPicUrl(u);
      setCropperSrc(u);
      setCurrentCropSettings(null);
      setIsCropperOpen(true);
    }
  };

  // Select Preset and open adjuster
  const handleSelectPreset = (pUrl: string) => {
    setMainPicUrl(pUrl);
    setCropperSrc(pUrl);
    setCurrentCropSettings(null);
    setIsCropperOpen(true);
  };

  // Use full original main picture directly without any crop
  const handleUseMainPicDirectly = () => {
    const target = mainPicUrl || value;
    if (!target) return;
    onChange(target, target, {
      zoom: 1,
      pan: { x: 0, y: 0 },
      rotation: 0,
      flipped: false,
    });
    setUrlInput(target);
  };

  const handleClear = () => {
    onChange("");
    setMainPicUrl(null);
    setCurrentCropSettings(null);
    setUrlInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div
      className="image-picker-wrap"
      style={{
        background: "var(--adm-surface)",
        border: "1px solid var(--adm-line)",
        borderRadius: "var(--adm-radius-md)",
        padding: "16px",
        marginBottom: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <label
          style={{
            fontWeight: "600",
            fontSize: "14px",
            color: "var(--adm-text)",
          }}
        >
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: "transparent",
              border: "none",
              color: "#b91c1c",
              fontSize: "12px",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ✕ ছবি মুছে ফেলুন
          </button>
        )}
      </div>

      <p
        style={{
          fontSize: "12px",
          color: "var(--adm-muted)",
          margin: "0 0 14px",
          lineHeight: "1.5",
        }}
      >
        {hint}
      </p>

      {/* Visual Previews and Action Area */}
      {value ? (
        <div
          style={{
            background: "var(--adm-card, #ffffff)",
            border: "1px solid var(--adm-line)",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "18px",
              flexWrap: "wrap",
            }}
          >
            {/* Box 1: Cropped Web Cover */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)" }}>
                  ওয়েব কভার (ক্রপ করা রূপ)
                </span>
                <span
                  style={{
                    fontSize: "10.5px",
                    background: "rgba(160, 72, 52, 0.1)",
                    color: "var(--adm-accent, #a04834)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontWeight: 600,
                  }}
                >
                  {isNovel ? "৩:৪ বুক কভার" : isAvatar ? "১:১ স্কয়ার" : "১৬:৯ ব্যানার"}
                </span>
              </div>

              <div
                style={{
                  width: isNovel ? "110px" : isAvatar || isSquare ? "110px" : "190px",
                  height: isNovel ? "146px" : isAvatar || isSquare ? "110px" : "107px",
                  borderRadius: isAvatar ? "50%" : isSquare ? "8px" : "8px",
                  overflow: "hidden",
                  background: "rgba(0,0,0,0.04)",
                  border: "2px solid var(--adm-accent, #a04834)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                }}
              >
                <img
                  src={value}
                  alt="Cropped Cover"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: isAvatar ? "center 20%" : "center",
                  }}
                />
              </div>
            </div>

            {/* Box 2: Main Original Picture (Preserved intact!) */}
            {mainPicUrl && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)" }}>
                    মূল ছবি (Main Picture)
                  </span>
                  <span
                    style={{
                      fontSize: "10.5px",
                      background: "#f0fdf4",
                      color: "#166534",
                      border: "1px solid #bbf7d0",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontWeight: 600,
                    }}
                  >
                    ✓ অক্ষুণ্ণ সংরক্ষিত
                  </span>
                </div>

                <div
                  style={{
                    width: "140px",
                    height: isNovel ? "146px" : isAvatar || isSquare ? "110px" : "107px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    background: "#0f0f11",
                    border: "1px dashed var(--adm-line)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <img
                    src={mainPicUrl}
                    alt="Original Main Pic"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setIsFullViewOpen(true)}
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.45)",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      opacity: 0,
                      transition: "opacity 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                  >
                    <span>🔍</span>
                    <span>পূর্ণাঙ্গ রূপ দেখুন</span>
                  </button>
                </div>
              </div>
            )}

            {/* Actions Bar for the writer to adjust the main pic */}
            <div
              style={{
                flex: "1 1 260px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                justifyContent: "center",
                paddingTop: "24px",
              }}
            >
              <button
                type="button"
                onClick={handleOpenAdjuster}
                style={{
                  padding: "9px 16px",
                  borderRadius: "8px",
                  background: "var(--adm-accent, #a04834)",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  boxShadow: "0 2px 6px rgba(160, 72, 52, 0.25)",
                }}
                title="মূল ছবি থেকে ইচ্ছামতো ড্র্যাগ, প্যান ও জুম করে ফ্রেম পরিবর্তন করুন"
              >
                <span>🎨</span>
                <span>মূল ছবি থেকে পুনরায় ফ্রেম ও সাইজ সমন্বয় করুন</span>
              </button>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {mainPicUrl && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsFullViewOpen(true)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid var(--adm-line)",
                        background: "var(--adm-card, #ffffff)",
                        color: "var(--adm-text, #1e293b)",
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span>👁️</span>
                      <span>সম্পূর্ণ মূল ছবি দেখুন</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleUseMainPicDirectly}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px dashed var(--adm-line)",
                        background: "var(--adm-surface, #faf8f5)",
                        color: "var(--adm-text, #1e293b)",
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title="ক্রপ না করে সরাসরি সম্পূর্ণ মূল ছবিটিকেই পোস্টের কভার হিসেবে ব্যবহার করুন"
                    >
                      <span>🖼️</span>
                      <span>ক্রপ ছাড়া মূল ছবি ব্যবহার করুন</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Tabs for changing / adding new image */}
      <div className="image-picker-tabs" style={{ width: "100%" }}>
        <div
          className="image-picker-tab-bar"
          style={{
            display: "flex",
            gap: "6px",
            marginBottom: "12px",
            borderBottom: "1px solid var(--adm-line)",
            paddingBottom: "8px",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("preset")}
            style={{
              padding: "6px 12px",
              fontSize: "12.5px",
              borderRadius: "6px",
              border: "none",
              background: activeTab === "preset" ? "var(--adm-accent)" : "transparent",
              color: activeTab === "preset" ? "#fff" : "var(--adm-muted)",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            সংগ্রহশালা (Presets)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            style={{
              padding: "6px 12px",
              fontSize: "12.5px",
              borderRadius: "6px",
              border: "none",
              background: activeTab === "upload" ? "var(--adm-accent)" : "transparent",
              color: activeTab === "upload" ? "#fff" : "var(--adm-muted)",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            ডিভাইস আপলোড
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            style={{
              padding: "6px 12px",
              fontSize: "12.5px",
              borderRadius: "6px",
              border: "none",
              background: activeTab === "url" ? "var(--adm-accent)" : "transparent",
              color: activeTab === "url" ? "#fff" : "var(--adm-muted)",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            সরাসরি URL
          </button>
        </div>

        {/* Tab 1: Presets */}
        {activeTab === "preset" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: "8px",
              maxHeight: "180px",
              overflowY: "auto",
              padding: "4px",
            }}
          >
            {presets.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(item.url)}
                style={{
                  border:
                    value === item.url || mainPicUrl === item.url
                      ? "2px solid var(--adm-accent)"
                      : "1px solid var(--adm-line)",
                  borderRadius: "6px",
                  overflow: "hidden",
                  padding: 0,
                  background: "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "transform 0.1s",
                }}
                title={item.label}
              >
                <div style={{ width: "100%", height: "65px", position: "relative" }}>
                  <img
                    src={item.url}
                    alt={item.label}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
                <div
                  style={{
                    padding: "4px 6px",
                    fontSize: "11px",
                    color: "var(--adm-text)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.label}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Tab 2: Upload */}
        {activeTab === "upload" && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: "none" }}
              id={`image-upload-input-${label.replace(/\s+/g, "-")}`}
            />
            <label
              htmlFor={`image-upload-input-${label.replace(/\s+/g, "-")}`}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                border: "2px dashed var(--adm-line)",
                borderRadius: "var(--adm-radius-sm)",
                cursor: "pointer",
                background: "rgba(0,0,0,0.01)",
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: "32px", marginBottom: "8px" }}>📤</span>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--adm-text)" }}>
                ডিভাইস থেকে নতুন ছবি নির্বাচন করুন
              </span>
              <span style={{ fontSize: "11px", color: "var(--adm-muted)", marginTop: "4px" }}>
                ছবিটি সাথে সাথে লোড হবে এবং ইচ্ছামতো জুম ও পজিশন অ্যাডজাস্ট করতে পারবেন। মূল ছবি সবসময় সংরক্ষিত থাকবে।
              </span>
            </label>
          </div>
        )}

        {/* Tab 3: URL */}
        {activeTab === "url" && (
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 12px",
                fontSize: "13px",
                borderRadius: "6px",
                border: "1px solid var(--adm-line)",
                background: "var(--adm-card)",
                color: "var(--adm-text)",
              }}
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                background: "var(--adm-accent)",
                color: "#fff",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              যোগ ও ফ্রেম করুন
            </button>
          </div>
        )}
      </div>

      {/* Interactive Crop & Adjust Modal */}
      {isCropperOpen && cropperSrc && (
        <ImageCropperModal
          imageSrc={cropperSrc}
          isOpen={isCropperOpen}
          initialSettings={currentCropSettings}
          onClose={() => {
            setIsCropperOpen(false);
            setCropperSrc(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
          onCropComplete={(croppedDataUrl, originalDataUrl, settings) => {
            setMainPicUrl(originalDataUrl);
            setCurrentCropSettings(settings);
            onChange(croppedDataUrl, originalDataUrl, settings);
            setUrlInput(croppedDataUrl);
            setIsCropperOpen(false);
            setCropperSrc(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
          onUseOriginalWithoutCrop={(origUrl) => {
            setMainPicUrl(origUrl);
            const defaultSettings: CropSettings = { zoom: 1, pan: { x: 0, y: 0 }, rotation: 0, flipped: false };
            setCurrentCropSettings(defaultSettings);
            onChange(origUrl, origUrl, defaultSettings);
            setUrlInput(origUrl);
            setIsCropperOpen(false);
            setCropperSrc(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
          defaultAspectRatio={defaultCropRatio}
          title={cropperTitle}
        />
      )}

      {/* Full Original Image Lightbox Modal */}
      {isFullViewOpen && mainPicUrl && typeof document !== "undefined" && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999999,
            backgroundColor: "rgba(10, 8, 6, 0.92)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.2s ease-out",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFullViewOpen(false);
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "24px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              zIndex: 10,
            }}
          >
            <button
              type="button"
              onClick={handleOpenAdjuster}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                background: "var(--adm-accent, #a04834)",
                color: "#ffffff",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              }}
            >
              🎨 এই ছবি অ্যাডজাস্ট করুন
            </button>
            <button
              type="button"
              onClick={() => setIsFullViewOpen(false)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                border: "none",
                color: "#ffffff",
                fontSize: "18px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>

          <div
            style={{
              maxWidth: "90vw",
              maxHeight: "82vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
            }}
          >
            <img
              src={mainPicUrl}
              alt="Original Full Artwork"
              style={{
                maxWidth: "100%",
                maxHeight: "82vh",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>

          <div style={{ marginTop: "14px", color: "#e2e8f0", fontSize: "13px", textAlign: "center" }}>
            মূল অক্ষুণ্ণ ছবি (Original Uncropped Picture) • লেখিকা চাইলে যেকোনো সময় এটি থেকে ফ্রেম ও সাইজ পরিবর্তন করতে পারেন
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
