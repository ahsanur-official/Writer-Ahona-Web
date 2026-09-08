/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ReaderComment,
  CommentReply,
  getCommentsForTarget,
  addComment,
  addCommentReply,
  toggleLikeComment,
  formatBengaliNumber,
  formatCommentTimeWithRelative,
} from "@/lib/store";
import { getCurrentUser, ReaderUser, getUserIdentifier, getAllRegisteredUsers } from "@/lib/userAuth";

interface CommentsSectionProps {
  targetId: string;
  targetTitle: string;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenAuthModal?: () => void;
}

interface ReplyingTarget {
  commentId: string;
  targetName: string;
  replyId?: string;
}

export default function CommentsSection({
  targetId,
  targetTitle,
  isOpen,
  onClose,
  onOpenAuthModal,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<ReaderComment[]>([]);
  const [currentUser, setCurrentUser] = useState<ReaderUser | null>(null);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ReplyingTarget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const modalScrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-refresh relative time every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const isModalOpen = isOpen !== undefined ? isOpen : internalIsOpen;

  const handleClose = useCallback(() => {
    if (onClose) onClose();
    setInternalIsOpen(false);
    setReplyingTo(null);
  }, [onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = useCallback(() => {
    const list = getCommentsForTarget(targetId);
    setComments(list);
    const user = getCurrentUser();
    setCurrentUser(user);

    // Check liked status
    const userId = getUserIdentifier();
    const map: Record<string, boolean> = {};
    list.forEach((c) => {
      if (c.likedBy?.includes(userId)) {
        map[c.id] = true;
      }
      c.replies?.forEach((r) => {
        if (r.likedBy?.includes(userId)) {
          map[r.id] = true;
        }
      });
    });
    setLikedMap(map);
  }, [targetId]);

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    const handleAuthChange = () => {
      setCurrentUser(getCurrentUser());
      loadData();
    };
    const handleOpenCommentsModal = (e: CustomEvent<{ targetId?: string }>) => {
      if (!e.detail?.targetId || e.detail.targetId === targetId) {
        setInternalIsOpen(true);
      }
    };

    window.addEventListener("ahona_store_updated", handleUpdate);
    window.addEventListener("ahona-auth-changed", handleAuthChange);
    window.addEventListener("ahona-open-comments-modal", handleOpenCommentsModal as EventListener);

    return () => {
      window.removeEventListener("ahona_store_updated", handleUpdate);
      window.removeEventListener("ahona-auth-changed", handleAuthChange);
      window.removeEventListener("ahona-open-comments-modal", handleOpenCommentsModal as EventListener);
    };
  }, [loadData, targetId]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen, handleClose]);

  // Auto focus input when replyingTo changes
  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  // Handle Adding Top-level Comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !currentUser.emailVerified) {
      if (onOpenAuthModal) onOpenAuthModal();
      else {
        window.dispatchEvent(
          new CustomEvent("ahona-open-auth-modal", {
            detail: { reason: "comment", title: targetTitle },
          })
        );
      }
      return;
    }
    if (!newCommentText.trim()) return;

    const text = newCommentText.trim();
    setIsSubmitting(true);

    const optimisticComment: ReaderComment = {
      id: `comment-opt-${Date.now()}`,
      targetId,
      targetTitle,
      authorName: currentUser.name,
      authorEmail: currentUser.email,
      userId: currentUser.id,
      content: text,
      date: "এইমাত্র",
      claps: 0,
      likedBy: [],
      replies: [],
    };

    setComments((prev) => [optimisticComment, ...prev]);
    setNewCommentText("");

    try {
      addComment({
        targetId,
        targetTitle,
        authorName: currentUser.name,
        authorEmail: currentUser.email,
        userId: currentUser.id,
        content: text,
      });
    } catch {
      // Revert if error
    } finally {
      setIsSubmitting(false);
      loadData();
    }

    setTimeout(() => {
      if (modalScrollRef.current) {
        modalScrollRef.current.scrollTop = 0;
      }
    }, 50);
  };

  // Handle Adding Reply (to comment or to another reply)
  const handleAddReply = (commentId: string) => {
    if (!currentUser || !currentUser.emailVerified) {
      if (onOpenAuthModal) onOpenAuthModal();
      else {
        window.dispatchEvent(
          new CustomEvent("ahona-open-auth-modal", {
            detail: { reason: "comment", title: targetTitle },
          })
        );
      }
      return;
    }
    if (!newCommentText.trim()) return;

    const text = newCommentText.trim();
    setIsSubmitting(true);

    const currentReplyTarget = replyingTo;

    const optimisticReply: CommentReply = {
      id: `rep-opt-${Date.now()}`,
      commentId,
      authorName: currentUser.name,
      authorEmail: currentUser.email,
      userId: currentUser.id,
      replyToAuthorName: currentReplyTarget?.targetName,
      replyToReplyId: currentReplyTarget?.replyId,
      content: text,
      date: "এইমাত্র",
      claps: 0,
      likedBy: [],
    };

    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, replies: [...(c.replies || []), optimisticReply] }
          : c
      )
    );
    setNewCommentText("");
    setReplyingTo(null);

    try {
      addCommentReply(commentId, {
        authorName: currentUser.name,
        authorEmail: currentUser.email,
        userId: currentUser.id,
        replyToAuthorName: currentReplyTarget?.targetName,
        replyToReplyId: currentReplyTarget?.replyId,
        content: text,
      });
    } catch {
      // Ignore
    } finally {
      setIsSubmitting(false);
      loadData();
    }
  };

  // Handle Like (Optimistic Realtime feedback)
  const handleLike = (commentId: string, replyId?: string) => {
    if (!currentUser || !currentUser.emailVerified) {
      if (onOpenAuthModal) onOpenAuthModal();
      else {
        window.dispatchEvent(
          new CustomEvent("ahona-open-auth-modal", {
            detail: { reason: "read", title: targetTitle },
          })
        );
      }
      return;
    }

    const userId = currentUser.id;
    const targetKey = replyId || commentId;
    const wasLiked = likedMap[targetKey];
    const nextLiked = !wasLiked;

    setLikedMap((prev) => ({
      ...prev,
      [targetKey]: nextLiked,
    }));

    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          if (replyId && c.replies) {
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === replyId
                  ? {
                      ...r,
                      claps: nextLiked ? (r.claps || 0) + 1 : Math.max(0, (r.claps || 0) - 1),
                    }
                  : r
              ),
            };
          } else {
            return {
              ...c,
              claps: nextLiked ? (c.claps || 0) + 1 : Math.max(0, (c.claps || 0) - 1),
            };
          }
        }
        return c;
      })
    );

    try {
      toggleLikeComment(commentId, replyId, userId);
    } catch {
      // Revert if error
    }
  };

  const allUsers = getAllRegisteredUsers();

  const getMatchedUser = (authorEmail?: string, authorName?: string, userId?: string) => {
    return allUsers.find(
      (u) =>
        (userId && u.id === userId) ||
        (authorEmail && u.email.toLowerCase() === authorEmail.toLowerCase()) ||
        (authorName && u.name.toLowerCase() === authorName.toLowerCase())
    );
  };

  const totalCommentsCount = comments.reduce(
    (acc, c) => acc + 1 + (c.replies ? c.replies.length : 0),
    0
  );

  // If modal is not open, do not render anything on the page (no bottom redundant card!)
  if (!isModalOpen || !mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        backgroundColor: "rgba(18, 12, 10, 0.72)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        animation: "fadeInConfirm 0.2s ease-out",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "640px",
          height: "90vh",
          maxHeight: "720px",
          background: "var(--card, #ffffff)",
          borderRadius: "20px",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.45)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid var(--line, #e2d9cf)",
          fontFamily: "var(--font-siliguri), sans-serif",
          position: "relative",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--line, #e2e8f0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--surface, #faf8f5)",
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px" }}>💬</span>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--ink)" }}>
                মন্তব্যসমূহ ({formatBengaliNumber(totalCommentsCount)})
              </h3>
            </div>
            <p
              style={{
                margin: "3px 0 0",
                fontSize: "12px",
                color: "var(--muted)",
                maxWidth: "380px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              লেখা: {targetTitle}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {currentUser && (
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  window.dispatchEvent(new CustomEvent("ahona-open-user-panel"));
                }}
                style={{
                  background: "none",
                  border: "1px solid var(--line)",
                  padding: "4px 10px",
                  borderRadius: "14px",
                  fontSize: "12px",
                  color: "var(--ink)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                title="প্রোফাইল সেটিংস"
              >
                ⚙️ প্রোফাইল
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "rgba(0,0,0,0.06)",
                border: "none",
                fontSize: "16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--ink)",
                transition: "background 0.15s",
              }}
              title="বন্ধ করুন (Esc)"
              aria-label="বন্ধ করুন"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body: Comments Feed */}
        <div
          ref={modalScrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            background: "var(--card, #ffffff)",
          }}
        >
          {comments.length === 0 ? (
            <div
              style={{
                margin: "auto",
                textAlign: "center",
                padding: "40px 20px",
                color: "var(--muted)",
              }}
            >
              <span style={{ fontSize: "42px", display: "block", marginBottom: "12px" }}>✍️</span>
              <p style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700, color: "var(--ink)" }}>
                এখনো কোনো মন্তব্য নেই
              </p>
              <p style={{ margin: 0, fontSize: "13.5px" }}>
                লেখাটি সম্পর্কে আপনার সুন্দর অনুভূতি জানিয়ে প্রথম মন্তব্য করুন!
              </p>
            </div>
          ) : (
            comments.map((comment) => {
              const isLiked = likedMap[comment.id];
              const replies = comment.replies || [];
              const matchedUser = getMatchedUser(comment.authorEmail, comment.authorName, comment.userId);

              return (
                <div key={comment.id} style={{ display: "flex", gap: "12px" }}>
                  {/* Avatar */}
                  <div style={{ flexShrink: 0 }}>
                    {matchedUser?.avatarUrl ? (
                      <img
                        src={matchedUser.avatarUrl}
                        alt={comment.authorName}
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "1.5px solid var(--line)",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "50%",
                          background: matchedUser?.avatarColor || "var(--accent, #a04834)",
                          color: "#ffffff",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "15px",
                          fontWeight: 700,
                        }}
                      >
                        {comment.authorName.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Comment Content + Replies */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Comment Bubble */}
                    <div
                      style={{
                        background: "var(--surface, #f4f2ee)",
                        borderRadius: "16px",
                        padding: "10px 14px",
                        display: "inline-block",
                        maxWidth: "100%",
                        wordBreak: "break-word",
                        border: "1px solid var(--line, #e7e2d9)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)" }}>
                          {comment.authorName}
                        </span>
                        {matchedUser?.emailVerified && (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#15803d",
                              background: "#dcfce7",
                              padding: "1px 6px",
                              borderRadius: "10px",
                              fontWeight: 600,
                            }}
                          >
                            ✓ ভেরিফায়েড
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: "14.5px",
                          lineHeight: "1.6",
                          color: "var(--ink)",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {comment.content}
                      </div>
                    </div>

                    {/* Action Row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        marginTop: "4px",
                        marginLeft: "6px",
                        fontSize: "12px",
                        color: "var(--muted)",
                      }}
                    >
                      <span>
                        {formatCommentTimeWithRelative(comment.date, comment.createdAt, comment.id)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleLike(comment.id)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: isLiked ? 700 : 600,
                          color: isLiked ? "var(--accent, #a04834)" : "var(--muted)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <span>{isLiked ? "❤️" : "🤍"}</span>
                        <span>{isLiked ? "পছন্দ হয়েছে" : "পছন্দ"}</span>
                        {(comment.claps || 0) > 0 && (
                          <span style={{ fontWeight: 700 }}>
                            ({formatBengaliNumber(comment.claps || 0)})
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setReplyingTo({
                            commentId: comment.id,
                            targetName: comment.authorName,
                          });
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--muted)",
                        }}
                      >
                        উত্তর দিন
                      </button>
                    </div>

                    {/* Nested Replies List (Threaded, supports replying to any reply) */}
                    {replies.length > 0 && (
                      <div
                        style={{
                          marginTop: "10px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          paddingLeft: "14px",
                          borderLeft: "2px solid var(--line, #e2d9cf)",
                        }}
                      >
                        {replies.map((reply) => {
                          const isReplyLiked = likedMap[reply.id];
                          const matchedReplyUser = getMatchedUser(
                            reply.authorEmail,
                            reply.authorName,
                            reply.userId
                          );

                          return (
                            <div key={reply.id} style={{ display: "flex", gap: "10px" }}>
                              <div style={{ flexShrink: 0 }}>
                                {matchedReplyUser?.avatarUrl ? (
                                  <img
                                    src={matchedReplyUser.avatarUrl}
                                    alt={reply.authorName}
                                    style={{
                                      width: "30px",
                                      height: "30px",
                                      borderRadius: "50%",
                                      objectFit: "cover",
                                      border: "1px solid var(--line)",
                                    }}
                                  />
                                ) : (
                                  <span
                                    style={{
                                      width: "30px",
                                      height: "30px",
                                      borderRadius: "50%",
                                      background: matchedReplyUser?.avatarColor || "var(--accent)",
                                      color: "#fff",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: "12px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    {reply.authorName.charAt(0)}
                                  </span>
                                )}
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    background: "var(--surface, #f4f2ee)",
                                    borderRadius: "14px",
                                    padding: "8px 12px",
                                    display: "inline-block",
                                    maxWidth: "100%",
                                    wordBreak: "break-word",
                                    border: "1px solid var(--line, #e7e2d9)",
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }}>
                                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>
                                      {reply.authorName}
                                    </span>
                                    {matchedReplyUser?.emailVerified && (
                                      <span style={{ fontSize: "10px", color: "#15803d", fontWeight: 700 }}>
                                        ✓
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: "13.5px", color: "var(--ink)", lineHeight: "1.5" }}>
                                    {reply.replyToAuthorName && (
                                      <span
                                        style={{
                                          color: "var(--accent, #a04834)",
                                          fontWeight: 700,
                                          marginRight: "6px",
                                          display: "inline-block",
                                        }}
                                      >
                                        @{reply.replyToAuthorName}
                                      </span>
                                    )}
                                    <span>{reply.content}</span>
                                  </div>
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    marginTop: "3px",
                                    marginLeft: "4px",
                                    fontSize: "11.5px",
                                    color: "var(--muted)",
                                  }}
                                >
                                  <span>
                                    {formatCommentTimeWithRelative(reply.date, reply.createdAt, reply.id)}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => handleLike(comment.id, reply.id)}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      padding: 0,
                                      cursor: "pointer",
                                      fontSize: "11.5px",
                                      fontWeight: isReplyLiked ? 700 : 600,
                                      color: isReplyLiked ? "var(--accent)" : "var(--muted)",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "2px",
                                    }}
                                  >
                                    <span>{isReplyLiked ? "❤️" : "🤍"}</span>
                                    <span>{isReplyLiked ? "পছন্দ হয়েছে" : "পছন্দ"}</span>
                                    {(reply.claps || 0) > 0 && (
                                      <span>({formatBengaliNumber(reply.claps || 0)})</span>
                                    )}
                                  </button>

                                  {/* Reply to this specific reply */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplyingTo({
                                        commentId: comment.id,
                                        targetName: reply.authorName,
                                        replyId: reply.id,
                                      });
                                    }}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      padding: 0,
                                      cursor: "pointer",
                                      fontSize: "11.5px",
                                      fontWeight: 600,
                                      color: "var(--muted)",
                                    }}
                                  >
                                    উত্তর দিন
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Sticky Footer: Input Form */}
        <div
          style={{
            borderTop: "1px solid var(--line, #e2e8f0)",
            padding: "12px 16px",
            background: "var(--surface, #faf8f5)",
            flexShrink: 0,
          }}
        >
          {/* Replying banner */}
          {replyingTo && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "5px 12px",
                marginBottom: "8px",
                background: "rgba(160, 72, 52, 0.1)",
                borderRadius: "10px",
                fontSize: "12.5px",
                color: "var(--accent, #a04834)",
              }}
            >
              <span>
                💬 <strong>{replyingTo.targetName}</strong>-এর উত্তরের জবাব দিচ্ছেন
              </span>
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null);
                  setNewCommentText("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "12px",
                }}
              >
                ✕ বাতিল
              </button>
            </div>
          )}

          {!currentUser ? (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "14px",
                background: "var(--card, #ffffff)",
                border: "1px dashed var(--line)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <span style={{ fontSize: "13.5px", color: "var(--muted)" }}>
                মন্তব্য করতে অনুগ্রহ করে পাঠক একাউন্টে লগইন করুন
              </span>
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  if (onOpenAuthModal) onOpenAuthModal();
                  else {
                    window.dispatchEvent(
                      new CustomEvent("ahona-open-auth-modal", {
                        detail: { reason: "comment", title: targetTitle },
                      })
                    );
                  }
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "16px",
                  background: "var(--accent, #a04834)",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                লগইন / নিবন্ধন
              </button>
            </div>
          ) : !currentUser.emailVerified ? (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "14px",
                background: "rgba(234, 179, 8, 0.12)",
                border: "1px solid rgba(234, 179, 8, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <span style={{ fontSize: "13px", color: "#854d0e" }}>
                মন্তব্য করতে অনুগ্রহ করে ইমেইল ভেরিফিকেশন সম্পন্ন করুন
              </span>
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  window.dispatchEvent(new CustomEvent("ahona-open-user-panel"));
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "14px",
                  background: "var(--accent, #a04834)",
                  color: "#fff",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ভেরিফাই করুন
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (replyingTo) {
                  handleAddReply(replyingTo.commentId);
                } else {
                  handleAddComment(e);
                }
              }}
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <span
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: currentUser.avatarColor,
                    color: "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {currentUser.name.charAt(0)}
                </span>
              )}

              <input
                ref={inputRef}
                type="text"
                placeholder={
                  replyingTo
                    ? `${replyingTo.targetName}-কে উদ্দেশ্য করে উত্তর লিখুন...`
                    : "একটি সুন্দর মন্তব্য লিখুন..."
                }
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                required
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: "22px",
                  border: "1px solid var(--line, #cbd5e1)",
                  background: "var(--card, #ffffff)",
                  color: "var(--ink)",
                  fontSize: "14px",
                  outline: "none",
                }}
              />

              <button
                type="submit"
                disabled={isSubmitting || !newCommentText.trim()}
                style={{
                  padding: "10px 18px",
                  borderRadius: "22px",
                  background: "var(--accent, #a04834)",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  cursor: isSubmitting || !newCommentText.trim() ? "not-allowed" : "pointer",
                  opacity: isSubmitting || !newCommentText.trim() ? 0.5 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  flexShrink: 0,
                }}
              >
                <span>{isSubmitting ? "..." : replyingTo ? "উত্তর দিন" : "পাঠান"}</span>
                <span>➤</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
