import { NextRequest, NextResponse } from "next/server";

// In-memory set for tracking (IP + PostId) pairs
// Persists for the lifecycle of the server process
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
    const { postId, action = "toggle" } = body;
    const ip = getClientIp(req);

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const key = `${ip}_${postId}`;
    const currentlyLiked = ipLikesSet.has(key);

    if (action === "check") {
      return NextResponse.json({ hasLiked: currentlyLiked });
    }

    if (action === "like") {
      if (currentlyLiked) {
        return NextResponse.json({
          success: false,
          alreadyLiked: true,
          message: "আপনি ইতিমধ্যে এই আইপি (IP) ও ব্রাউজার থেকে ভালোবাসা জানিয়েছেন!",
        });
      }
      ipLikesSet.add(key);
      return NextResponse.json({
        success: true,
        liked: true,
        message: "আপনার ভালোবাসা সফলভাবে যুক্ত হয়েছে! ❤️",
      });
    }

    if (action === "unlike") {
      if (currentlyLiked) {
        ipLikesSet.delete(key);
      }
      return NextResponse.json({
        success: true,
        liked: false,
        message: "ভালোবাসা প্রত্যাহার করা হয়েছে।",
      });
    }

    // Default toggle behavior
    if (currentlyLiked) {
      // User is unliking
      ipLikesSet.delete(key);
      return NextResponse.json({
        success: true,
        liked: false,
        message: "ভালোবাসা প্রত্যাহার করা হয়েছে।",
      });
    } else {
      // User is liking
      ipLikesSet.add(key);
      return NextResponse.json({
        success: true,
        liked: true,
        message: "আপনার ভালোবাসা সফলভাবে যুক্ত হয়েছে! ❤️",
      });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
