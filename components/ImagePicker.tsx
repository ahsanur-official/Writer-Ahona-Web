/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef, ChangeEvent } from "react";
import { LITERARY_IMAGE_PRESETS } from "@/lib/store";
import ImageCropperModal, { AspectRatioOption } from "./ImageCropperModal";

interface ImagePickerProps {
  value?: string | null;
  onChange: (url: string) => void;
  label?: string;
  presetType?: "avatars" | "postCovers" | "novelCovers";
  aspectRatio?: "square" | "cover" | "banner" | "avatar";
  hint?: string;
}

export default function ImagePicker({
  value,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawData = event.target?.result as string;
      setIsProcessing(false);
      // Automatically open the Cropper & Adjuster so user can frame and size before saving
      setCropperSrc(rawData);
      setIsCropperOpen(true);
    };
    reader.onerror = () => {
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  };

  const handleClear = () => {
    onChange("");
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

      {/* Preview Box */}
      <div
        className="image-picker-main"
        style={{
          display: "flex",
          gap: "16px",
          alignItems: "flex-start",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
          <div
            className="image-picker-preview"
            style={{
              width: isNovel ? "105px" : isAvatar || isSquare ? "110px" : "180px",
              height: isNovel ? "140px" : isAvatar || isSquare ? "110px" : "105px",
              borderRadius: isAvatar ? "50%" : isSquare ? "8px" : "var(--adm-radius-sm)",
              overflow: "hidden",
              background: "rgba(0,0,0,0.04)",
              border: "1px dashed var(--adm-line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {value ? (
              <img
                src={value}
                alt="Preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: isAvatar ? "center 20%" : "center",
                }}
              />
            ) : (
              <span style={{ fontSize: "28px", opacity: 0.35 }}>
                {isNovel ? "📚" : isAvatar ? "👤" : "📷"}
              </span>
            )}
            {isProcessing && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(255,255,255,0.7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: "600",
                }}
              >
                প্রসেস হচ্ছে...
              </div>
            )}
          </div>

          {/* Quick Adjust Button on existing preview */}
          {value && (
            <button
              type="button"
              onClick={() => {
                setCropperSrc(value);
                setIsCropperOpen(true);
              }}
              style={{
                fontSize: "12px",
                padding: "5px 10px",
                borderRadius: "6px",
                border: "1px solid var(--adm-line)",
                background: "var(--adm-card, #ffffff)",
                color: "var(--adm-text, #1e293b)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                fontWeight: 600,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
              title="ছবির ফ্রেম, জুম ও পজিশন সমন্বয় করুন"
            >
              <span>✂️</span>
              <span>সাইজ ও ফ্রেম সমন্বয়</span>
            </button>
          )}
        </div>

        {/* Tab Controls */}
        <div className="image-picker-tabs" style={{ flex: 1, minWidth: "220px" }}>
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
                fontWeight: activeTab === "preset" ? "600" : "400",
              }}
            >
              নান্দনিক ফটো কালেকশন
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
                fontWeight: activeTab === "upload" ? "600" : "400",
              }}
            >
              ফাইল আপলোড
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
                fontWeight: activeTab === "url" ? "600" : "400",
              }}
            >
              ছবি URL লিঙ্ক
            </button>
          </div>

          {/* Tab: Presets */}
          {activeTab === "preset" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                gap: "8px",
                maxHeight: "140px",
                overflowY: "auto",
                padding: "4px 2px",
              }}
            >
              {presets.map((item, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    onChange(item.url);
                    setUrlInput(item.url);
                  }}
                  title={item.label}
                  style={{
                    padding: "2px",
                    border:
                      value === item.url
                        ? "2px solid var(--adm-accent)"
                        : "1px solid var(--adm-line)",
                    borderRadius: "4px",
                    background: "var(--adm-surface)",
                    cursor: "pointer",
                    overflow: "hidden",
                    textAlign: "center",
                  }}
                >
                  <img
                    src={item.url}
                    alt={item.label}
                    style={{
                      width: "100%",
                      height: "50px",
                      objectFit: "cover",
                      objectPosition: aspectRatio === "avatar" ? "center 20%" : "center",
                      borderRadius: "2px",
                    }}
                  />
                  <span
                    style={{
                      display: "block",
                      fontSize: "9px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      marginTop: "2px",
                      color: "var(--adm-text)",
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Tab: File Upload */}
          {activeTab === "upload" && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{
                  fontSize: "14px",
                  padding: "10px 0",
                  width: "100%",
                }}
              />
              <p style={{ fontSize: "11px", color: "var(--adm-muted)", margin: "4px 0 0" }}>
                JPG, PNG, WebP ফরম্যাট সমর্থিত। ছবি সিলেক্ট করলে ক্রপ ও সাইজ সমন্বয়ের উইন্ডো ওপেন হবে।
              </p>
            </div>
          )}

          {/* Tab: Direct URL */}
          {activeTab === "url" && (
            <div className="image-picker-url-row" style={{ display: "flex", gap: "8px" }}>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  fontSize: "14px",
                  border: "1px solid var(--adm-line)",
                  borderRadius: "var(--adm-radius-sm)",
                  background: "var(--adm-surface)",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="admin-button"
                style={{ padding: "8px 16px", fontSize: "13px", minHeight: "40px" }}
              >
                যুক্ত করুন
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Crop & Adjust Modal */}
      {isCropperOpen && cropperSrc && (
        <ImageCropperModal
          imageSrc={cropperSrc}
          isOpen={isCropperOpen}
          onClose={() => {
            setIsCropperOpen(false);
            setCropperSrc(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
          onCropComplete={(croppedDataUrl) => {
            onChange(croppedDataUrl);
            setUrlInput(croppedDataUrl);
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
    </div>
  );
}
