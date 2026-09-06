import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, setDoc, getDocs, collection } from "firebase/firestore";
import { getServerFirestore } from "@/lib/server/firestore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// In-memory set for tracking (IP + PostId) pairs
const ipLikesSet = new Set<string>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  const ip = getClientIp(req);

  if (!postId) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
  }

  const key = `${ip}_${postId}`;
  const hasLiked = ipLikesSet.has(key);

  return NextResponse.json({ hasLiked, ip });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { postId, action = "toggle", clientLiked } = body;
    const ip = getClientIp(req);

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const key = `${ip}_${postId}`;
    const serverHasLiked = ipLikesSet.has(key);
    // User is considered currently liked if server knows it or client explicitly passed clientLiked: true
    const isCurrentlyLiked = typeof clientLiked === "boolean" ? clientLiked : serverHasLiked;

    let targetAction = action;
    if (action === "toggle") {
      targetAction = isCurrentlyLiked ? "unlike" : "like";
    }

    if (action === "check") {
      return NextResponse.json({ hasLiked: isCurrentlyLiked });
    }

    const db = getServerFirestore();
    let finalClaps = 0;
    let targetFound = false;

    // 1. Try finding in "posts"
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);

    if (postSnap.exists()) {
      targetFound = true;
      const data = postSnap.data();
      const currentClaps = typeof data.claps === "number" ? data.claps : 0;

      if (targetAction === "like") {
        finalClaps = currentClaps + 1;
        ipLikesSet.add(key);
      } else {
        finalClaps = Math.max(0, currentClaps - 1);
        ipLikesSet.delete(key);
      }

      await setDoc(postRef, { claps: finalClaps }, { merge: true });
    } else {
      // 2. Try finding inside "novels" episodes
      const novelsSnap = await getDocs(collection(db, "novels"));
      for (const nDoc of novelsSnap.docs) {
        const novelData = nDoc.data();
        const episodes = novelData.episodes || [];
        const epIndex = episodes.findIndex((ep: { id: string }) => ep.id === postId);

        if (epIndex >= 0) {
          targetFound = true;
          const currentEp = episodes[epIndex];
          const currentClaps = typeof currentEp.claps === "number" ? currentEp.claps : 0;

          if (targetAction === "like") {
            finalClaps = currentClaps + 1;
            ipLikesSet.add(key);
          } else {
            finalClaps = Math.max(0, currentClaps - 1);
            ipLikesSet.delete(key);
          }

          episodes[epIndex] = { ...currentEp, claps: finalClaps };
          await setDoc(doc(db, "novels", nDoc.id), { episodes }, { merge: true });
          break;
        }
      }
    }

    const isNowLiked = targetAction === "like";
    if (!targetFound) {
      // If doc is not yet in Firestore, still return calculated claps
      finalClaps = isNowLiked ? 1 : 0;
      if (isNowLiked) ipLikesSet.add(key);
      else ipLikesSet.delete(key);
    }

    return NextResponse.json({
      success: true,
      liked: isNowLiked,
      claps: finalClaps,
      message: isNowLiked
        ? "আপনার ভালোবাসা সফলভাবে যুক্ত হয়েছে! ❤️"
        : "ভালোবাসা প্রত্যাহার করা হয়েছে৤",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error processing like";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
