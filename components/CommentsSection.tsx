/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ReaderComment,
  getCommentsForTarget,
  addComment,
  addCommentReply,
  toggleLikeComment,
} from "@/lib/store";
import { getCurrentUser, ReaderUser, getUserIdentifier, getAllRegisteredUsers } from "@/lib/userAuth";

interface CommentsSectionProps {
  targetId: string;
  targetTitle: string;
  onOpenAuthModal?: () => void;
}

export default function CommentsSection({
  targetId,
  targetTitle,
  onOpenAuthModal,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<ReaderComment[]>([]);
  const [currentUser, setCurrentUser] = useState<ReaderUser | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyAuthorName, setReplyAuthorName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  const loadData = useCallback(() => {
    const list = getCommentsForTarget(targetId);
    setComments(list);
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      setAuthorName(user.name);
      setAuthorEmail(user.email);
    }

    // Check user liked status
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
    window.addEventListener("ahona_store_updated", handleUpdate);
    window.addEventListener("ahona-auth-changed", handleUpdate);

    return () => {
      window.removeEventListener("ahona_store_updated", handleUpdate);
      window.removeEventListener("ahona-auth-changed", handleUpdate);
    };
  }, [loadData]);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !currentUser.emailVerified) {
      window.dispatchEvent(
        new CustomEvent("ahona-open-auth-modal", {
          detail: { reason: "comment", title: targetTitle },
        })
      );
      return;
    }
    if (!newCommentText.trim()) return;

    setIsSubmitting(true);
    addComment({
      targetId,
      targetTitle,
      authorName: currentUser.name,
      authorEmail: currentUser.email,
      userId: currentUser.id,
      content: newCommentText.trim(),
    });

    setNewCommentText("");
    setIsSubmitting(false);
    loadData();
  };

  const handleAddReply = (commentId: string) => {
    if (!currentUser || !currentUser.emailVerified) {
      window.dispatchEvent(
        new CustomEvent("ahona-open-auth-modal", {
          detail: { reason: "comment", title: targetTitle },
        })
      );
      return;
    }
    if (!replyText.trim()) return;

    addCommentReply(commentId, {
      authorName: currentUser.name,
      authorEmail: currentUser.email,
      userId: currentUser.id,
      content: replyText.trim(),
    });

    setReplyText("");
    setReplyingToId(null);
    loadData();
  };

  const handleLike = (commentId: string, replyId?: string) => {
    if (!currentUser || !currentUser.emailVerified) {
      window.dispatchEvent(
        new CustomEvent("ahona-open-auth-modal", {
          detail: { reason: "read", title: targetTitle },
        })
      );
      return;
    }
    const userId = currentUser.id;
    const targetKey = replyId || commentId;
    const res = toggleLikeComment(commentId, replyId, userId);
    setLikedMap((prev) => ({
      ...prev,
      [targetKey]: res.liked,
    }));
    loadData();
  };

  return (
    <section
      style={{
        marginTop: "32px",
        paddingTop: "24px",
        borderTop: "1px solid var(--line, #e2e8f0)",
        fontFamily: "var(--font-siliguri), sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>💬</span>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--ink)" }}>
            পাঠকদের মন্তব্য ও প্রতিক্রিয়া ({comments.length})
          </h3>
        </div>

        {/* User Status Bar / Quick Login Button */}
        {currentUser ? (
          <div
            onClick={() => window.dispatchEvent(new CustomEvent("ahona-open-user-panel"))}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 12px",
              borderRadius: "20px",
              background: "var(--surface, rgba(202, 168, 105, 0.12))",
              border: "1px solid var(--line, #e2e8f0)",
              cursor: "pointer",
              fontSize: "12.5px",
              fontWeight: 600,
              color: "var(--ink)",
            }}
            title="পাঠক প্যানেল খুলুন"
          >
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: currentUser.avatarColor,
                  color: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                }}
              >
                {currentUser.name.charAt(0)}
              </span>
            )}
            <span>{currentUser.name} হিসেবে মন্তব্য করছেন ⚙️</span>
          </div>
        ) : (
          onOpenAuthModal && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              style={{
                background: "none",
                border: "1px solid var(--line)",
                padding: "5px 12px",
                borderRadius: "16px",
                fontSize: "12.5px",
                color: "var(--accent, #a04834)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              👤 একাউন্ট দিয়ে মন্তব্য করুন
            </button>
          )
        )}
      </div>

      {/* Write New Comment Form */}
      {!currentUser || !currentUser.emailVerified ? (
        <div
          style={{
            marginBottom: "28px",
            padding: "24px 18px",
            borderRadius: "14px",
            background: "var(--surface, #faf7f2)",
            border: "1px dashed var(--line, #e2d9cf)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>💬</div>
          <h4 style={{ margin: "0 0 6px", fontSize: "16px", color: "var(--ink)", fontWeight: 700 }}>
            মন্তব্য করতে পাঠক একাউন্টে লগইন করুন
          </h4>
          <p style={{ margin: "0 auto 16px", fontSize: "13px", color: "var(--muted)", maxWidth: "440px", lineHeight: "1.6" }}>
            লেখাটি সম্পর্কে আপনার নিজস্ব চিন্তা, অনুভূতি বা পর্যালোচনা জানাতে একটি ভেরিফায়েড পাঠক একাউন্ট প্রয়োজন৤
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
            {currentUser && !currentUser.emailVerified ? (
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("ahona-open-auth-modal", {
                      detail: { mode: "verify", reason: "comment", title: targetTitle },
                    })
                  );
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "9px 24px",
                  borderRadius: "20px",
                  background: "var(--accent, #a04834)",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 3px 10px rgba(160, 72, 52, 0.25)",
                }}
              >
                <span>🛡️</span>
                <span>ইমেইল কোড ভেরিফাই করুন</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("ahona-open-auth-modal", {
                        detail: { mode: "login", reason: "comment", title: targetTitle },
                      })
                    );
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "9px 20px",
                    borderRadius: "20px",
                    background: "var(--accent, #a04834)",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 3px 10px rgba(160, 72, 52, 0.25)",
                  }}
                >
                  <span>🔑</span>
                  <span>লগইন করুন</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("ahona-open-auth-modal", {
                        detail: { mode: "register", reason: "comment", title: targetTitle },
                      })
                    );
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "9px 20px",
                    borderRadius: "20px",
                    background: "transparent",
                    color: "var(--accent, #a04834)",
                    border: "1.5px solid var(--accent, #a04834)",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <span>✍️</span>
                  <span>নতুন একাউন্ট নিবন্ধন</span>
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleAddComment}
          style={{
            marginBottom: "28px",
            padding: "16px",
            borderRadius: "14px",
            background: "var(--card, #ffffff)",
            border: "1px solid var(--line, #e2e8f0)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <span
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: currentUser.avatarColor || "var(--accent)",
                  color: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                {currentUser.name.charAt(0)}
              </span>
            )}
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>
              {currentUser.name}
            </span>
            <span style={{ fontSize: "11px", color: "#15803d", background: "#dcfce7", padding: "1px 6px", borderRadius: "10px", fontWeight: 600 }}>
              ✓ ভেরিফায়েড
            </span>
          </div>

          <textarea
            rows={3}
            placeholder="লেখাটি সম্পর্কে আপনার অনুভূতি বা মন্তব্য লিখুন..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid var(--line, #cbd5e1)",
              background: "var(--background, #f8fafc)",
              color: "var(--ink)",
              fontSize: "14px",
              lineHeight: "1.5",
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
            <button
              type="submit"
              disabled={isSubmitting || !newCommentText.trim()}
              style={{
                padding: "8px 20px",
                borderRadius: "20px",
                background: "var(--accent, #a04834)",
                color: "#ffffff",
                border: "none",
                fontSize: "13.5px",
                fontWeight: 600,
                cursor: isSubmitting || !newCommentText.trim() ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(160, 72, 52, 0.25)",
                opacity: isSubmitting || !newCommentText.trim() ? 0.6 : 1,
              }}
            >
              {isSubmitting ? "পাঠানো হচ্ছে..." : "মন্তব্য প্রকাশ করুন ↗"}
            </button>
          </div>
        </form>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "14px", margin: "20px 0" }}>
          এখনো কোনো মন্তব্য নেই৤ আপনার সুন্দর অনুভূতি সবার আগে প্রকাশ করুন!
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {(() => {
            const allUsers = getAllRegisteredUsers();

            return comments.map((comment) => {
              const isLiked = likedMap[comment.id];
              const replies = comment.replies || [];
              const matchedUser = allUsers.find(
                (u) =>
                  (comment.userId && u.id === comment.userId) ||
                  (comment.authorEmail && u.email.toLowerCase() === comment.authorEmail.toLowerCase()) ||
                  u.name.toLowerCase() === comment.authorName.toLowerCase()
              );

              return (
                <div
                  key={comment.id}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    background: "var(--card, #ffffff)",
                    border: "1px solid var(--line, #e2e8f0)",
                  }}
                >
                  {/* Author Info */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {matchedUser?.avatarUrl ? (
                        <img
                          src={matchedUser.avatarUrl}
                          alt={comment.authorName}
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "1.5px solid var(--gold, #caa869)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "50%",
                            background: matchedUser?.avatarColor || "var(--gold, #caa869)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "13px",
                          }}
                        >
                          {comment.authorName.charAt(0)}
                        </div>
                      )}

                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--ink)" }}>
                            {comment.authorName}
                          </h4>
                          {matchedUser?.emailVerified && (
                            <span
                              style={{
                                fontSize: "10.5px",
                                color: "#16a34a",
                                background: "rgba(22, 163, 74, 0.1)",
                                padding: "1px 6px",
                                borderRadius: "8px",
                                fontWeight: 600,
                              }}
                            >
                              ✓ ভেরিফায়েড
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: "11.5px", color: "var(--muted)" }}>
                          {comment.date}
                        </span>
                      </div>
                    </div>
                  </div>

                {/* Comment Content */}
                <p style={{ margin: "0 0 12px", fontSize: "14px", color: "var(--ink)", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                  {comment.content}
                </p>

                {/* Action Row: Like Comment & Reply Button */}
                <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "12.5px" }}>
                  <button
                    type="button"
                    onClick={() => handleLike(comment.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: isLiked ? "#dc2626" : "var(--muted)",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontWeight: 600,
                      padding: "2px 4px",
                    }}
                  >
                    <span>{isLiked ? "❤️" : "🤍"}</span>
                    <span>{comment.claps > 0 ? `${comment.claps}টি লাইক` : "লাইক দিন"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUser || !currentUser.emailVerified) {
                        window.dispatchEvent(
                          new CustomEvent("ahona-open-auth-modal", {
                            detail: { reason: "comment", title: targetTitle },
                          })
                        );
                        return;
                      }
                      setReplyingToId(replyingToId === comment.id ? null : comment.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent, #a04834)",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontWeight: 600,
                      padding: "2px 4px",
                    }}
                  >
                    <span>↩</span>
                    <span>{replyingToId === comment.id ? "বাতিল করুন" : "উত্তর দিন"}</span>
                  </button>
                </div>

                {/* Inline Reply Form */}
                {replyingToId === comment.id && currentUser && currentUser.emailVerified && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "12px",
                      borderRadius: "10px",
                      background: "var(--background, #f8fafc)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "12px", color: "var(--ink)", fontWeight: 600 }}>
                        {currentUser.name}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                        হিসেবে উত্তর দিচ্ছেন:
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      placeholder={`${comment.authorName}-কে উত্তর দিন...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        border: "1px solid var(--line)",
                        fontSize: "13px",
                        boxSizing: "border-box",
                        resize: "vertical",
                      }}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "6px" }}>
                      <button
                        type="button"
                        onClick={() => setReplyingToId(null)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "12px",
                          color: "var(--muted)",
                          cursor: "pointer",
                        }}
                      >
                        বাতিল
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddReply(comment.id)}
                        disabled={!replyText.trim()}
                        style={{
                          padding: "5px 14px",
                          borderRadius: "16px",
                          background: "var(--accent, #a04834)",
                          color: "#fff",
                          border: "none",
                          fontSize: "12.5px",
                          fontWeight: 600,
                          cursor: replyText.trim() ? "pointer" : "not-allowed",
                        }}
                      >
                        উত্তর প্রকাশ করুন ↗
                      </button>
                    </div>
                  </div>
                )}

                {/* Nested Replies */}
                {replies.length > 0 && (
                  <div
                    style={{
                      marginTop: "12px",
                      paddingLeft: "16px",
                      borderLeft: "2px solid var(--line, #e2e8f0)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {replies.map((reply) => {
                      const isReplyLiked = likedMap[reply.id];
                      const matchedReplyUser = allUsers.find(
                        (u) =>
                          (reply.userId && u.id === reply.userId) ||
                          (reply.authorEmail && u.email.toLowerCase() === reply.authorEmail.toLowerCase()) ||
                          u.name.toLowerCase() === reply.authorName.toLowerCase()
                      );

                      return (
                        <div
                          key={reply.id}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "8px",
                            background: "var(--surface, rgba(0,0,0,0.02))",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "11px", color: "var(--accent)" }}>↳</span>
                              {matchedReplyUser?.avatarUrl ? (
                                <img
                                  src={matchedReplyUser.avatarUrl}
                                  alt={reply.authorName}
                                  style={{
                                    width: "20px",
                                    height: "20px",
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <span
                                  style={{
                                    width: "20px",
                                    height: "20px",
                                    borderRadius: "50%",
                                    background: matchedReplyUser?.avatarColor || "var(--accent)",
                                    color: "#fff",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "10px",
                                    fontWeight: 700,
                                  }}
                                >
                                  {reply.authorName.charAt(0)}
                                </span>
                              )}
                              <strong style={{ fontSize: "13px", color: "var(--ink)" }}>{reply.authorName}</strong>
                              {matchedReplyUser?.emailVerified && (
                                <span style={{ fontSize: "10px", color: "#16a34a", fontWeight: 600 }}>✓</span>
                              )}
                              <span style={{ fontSize: "11px", color: "var(--muted)" }}>· {reply.date}</span>
                            </div>
                          </div>
                          <p style={{ margin: "0 0 6px", fontSize: "13px", color: "var(--ink)", lineHeight: "1.5" }}>
                            {reply.content}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleLike(comment.id, reply.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: isReplyLiked ? "#dc2626" : "var(--muted)",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "11.5px",
                              fontWeight: 600,
                              padding: 0,
                            }}
                          >
                            <span>{isReplyLiked ? "❤️" : "🤍"}</span>
                            <span>{reply.claps > 0 ? `${reply.claps}টি লাইক` : "পছন্দ"}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          });
        })()}
      </div>
    )}
    </section>
  );
}
