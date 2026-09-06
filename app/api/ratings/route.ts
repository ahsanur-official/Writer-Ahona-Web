import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, arrayUnion } from "firebase/firestore";
import { getServerFirestore } from "@/lib/server/firestore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET all active ratings
export async function GET() {
  try {
    const db = getServerFirestore();
    const tombstoneDoc = await getDoc(doc(db, "settings", "deleted_tombstones"));
    const tombstones = new Set<string>(tombstoneDoc.exists() ? tombstoneDoc.data().ids || [] : []);

    const ratingsSnap = await getDocs(collection(db, "ratings"));
    const ratings: unknown[] = [];

    ratingsSnap.forEach((d) => {
      if (!tombstones.has(d.id)) {
        const data = d.data();
        if (data && data.targetId) {
          ratings.push({ ...data, id: d.id });
        }
      }
    });

    return NextResponse.json(
      { success: true, ratings },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch ratings";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST: submit / save a rating
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, targetId, targetTitle, targetType, rating, review, readerName, date, createdAt } = body;

    if (!targetId || !targetTitle || typeof rating !== "number") {
      return NextResponse.json(
        { success: false, error: "Missing required rating fields" },
        { status: 400 }
      );
    }

    const ratingId = id || `rating-${Date.now()}`;
    const cleanRating = {
      id: ratingId,
      targetId: String(targetId),
      targetTitle: String(targetTitle),
      targetType: String(targetType || "গল্প"),
      rating: Math.max(1, Math.min(5, Math.round(rating))),
      review: review ? String(review).trim() : undefined,
      readerName: readerName ? String(readerName).trim() : "মুগ্ধ পাঠক",
      date: date || new Date().toLocaleDateString("bn-BD"),
      createdAt: createdAt || new Date().toISOString(),
    };

    const db = getServerFirestore();
    await setDoc(doc(db, "ratings", ratingId), cleanRating);

    return NextResponse.json({ success: true, rating: cleanRating });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save rating";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE: delete a rating
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Rating ID is required" }, { status: 400 });
    }

    const db = getServerFirestore();
    // 1. Delete doc
    await deleteDoc(doc(db, "ratings", id));

    // 2. Add to tombstones
    const tombstoneRef = doc(db, "settings", "deleted_tombstones");
    await setDoc(
      tombstoneRef,
      { ids: arrayUnion(id), updatedAt: Date.now() },
      { merge: true }
    );

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete rating";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
