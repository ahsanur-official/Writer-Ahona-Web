import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import firebaseConfig from "@/firebase-applet-config.json";
import type { Post, Novel, ReaderComment, Subscriber, AuthorProfile, ItemRating } from "./store";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
  }
  return app;
}

export function getDb(): Firestore | null {
  if (typeof window === "undefined") return null;
  if (!db) {
    try {
      const fbApp = getFirebaseApp();
      const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";
      db = getFirestore(fbApp, databaseId);
    } catch (err) {
      console.warn("Firestore initialization error, will use local storage fallback:", err);
      return null;
    }
  }
  return db;
}

// ----------------- FIRESTORE COLLECTIONS -----------------
export const COLLECTIONS = {
  POSTS: "posts",
  NOVELS: "novels",
  COMMENTS: "comments",
  SUBSCRIBERS: "subscribers",
  RATINGS: "ratings",
  SETTINGS: "settings",
} as const;

// ----------------- SEEDING INITIAL DATA -----------------
export async function seedInitialDataIfEmpty(
  initialPosts: Post[],
  initialNovels: Novel[],
  initialProfile: AuthorProfile,
  initialComments: ReaderComment[],
  initialSubscribers: Subscriber[],
  initialRatings?: ItemRating[]
): Promise<boolean> {
  const firestore = getDb();
  if (!firestore) return false;

  try {
    // Check if initial seeding was already executed in the past
    const seedStatusRef = doc(firestore, COLLECTIONS.SETTINGS, "seed_status");
    const seedStatusSnap = await getDoc(seedStatusRef);
    if (seedStatusSnap.exists() && seedStatusSnap.data()?.seeded) {
      // Platform already seeded. Never re-seed deleted posts or novels!
      return true;
    }

    // Check if posts collection is empty
    const postsSnap = await getDocs(collection(firestore, COLLECTIONS.POSTS));
    if (postsSnap.empty) {
      console.log("Seeding initial posts to Firestore...");
      for (const post of initialPosts) {
        await setDoc(doc(firestore, COLLECTIONS.POSTS, post.id), post);
      }
    }

    // Check if novels collection is empty
    const novelsSnap = await getDocs(collection(firestore, COLLECTIONS.NOVELS));
    if (novelsSnap.empty) {
      console.log("Seeding initial novels to Firestore...");
      for (const novel of initialNovels) {
        await setDoc(doc(firestore, COLLECTIONS.NOVELS, novel.id), novel);
      }
    }

    // Check author settings
    const profileRef = doc(firestore, COLLECTIONS.SETTINGS, "author_profile");
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) {
      console.log("Seeding initial author profile to Firestore...");
      await setDoc(profileRef, initialProfile);
    } else {
      const data = profileSnap.data();
      if (
        !data?.bio ||
        data.bio.startsWith("আমি অহনা") ||
        !data?.avatarUrl ||
        data.avatarUrl?.includes("unsplash.com") ||
        data?.location === "ঢাকা, বাংলাদেশ"
      ) {
        console.log("Updating author profile in Firestore with new official bio, ahona.png avatar and Joypurhat location...");
        await setDoc(profileRef, {
          ...data,
          ...initialProfile,
          location: (!data?.location || data.location === "ঢাকা, বাংলাদেশ") ? initialProfile.location : data.location,
          avatarUrl: "/ahona.png",
          bio: (!data?.bio || data.bio.startsWith("আমি অহনা")) ? initialProfile.bio : data.bio,
        });
      }
    }

    // Check comments
    const commentsSnap = await getDocs(collection(firestore, COLLECTIONS.COMMENTS));
    if (commentsSnap.empty) {
      for (const com of initialComments) {
        await setDoc(doc(firestore, COLLECTIONS.COMMENTS, com.id), com);
      }
    }

    // Check subscribers
    const subSnap = await getDocs(collection(firestore, COLLECTIONS.SUBSCRIBERS));
    if (subSnap.empty) {
      for (const sub of initialSubscribers) {
        await setDoc(doc(firestore, COLLECTIONS.SUBSCRIBERS, sub.id), sub);
      }
    }

    // Check ratings
    if (initialRatings && initialRatings.length > 0) {
      const ratingsSnap = await getDocs(collection(firestore, COLLECTIONS.RATINGS));
      if (ratingsSnap.empty) {
        for (const rating of initialRatings) {
          await setDoc(doc(firestore, COLLECTIONS.RATINGS, rating.id), rating);
        }
      }
    }

    // Mark platform as seeded so future deletions will never be resurrected
    await setDoc(seedStatusRef, { seeded: true, seededAt: new Date().toISOString() });
    return true;
  } catch (err) {
    console.warn("Firestore seeding check warning:", err);
    return false;
  }
}

// ----------------- TOMBSTONES & DELETION GUARANTEE -----------------
const TOMBSTONE_KEY = "ahona_deleted_tombstones";

export function getLocalTombstones(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(TOMBSTONE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function addLocalTombstone(id: string): void {
  if (typeof window === "undefined" || !id) return;
  try {
    const set = getLocalTombstones();
    set.add(id);
    localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn("Error saving tombstone:", e);
  }
}

// ----------------- POSTS CRUD -----------------
export async function syncPostToFirestore(post: Post): Promise<void> {
  const firestore = getDb();
  if (firestore) {
    try {
      await setDoc(doc(firestore, COLLECTIONS.POSTS, post.id), post);
    } catch (err) {
      console.error("Failed to sync post to Firestore:", err);
    }
  }
  // Also backup sync via server
  try {
    fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": "ahona-admin-verified" },
      body: JSON.stringify({ collection: COLLECTIONS.POSTS, id: post.id, data: post }),
    }).catch(() => {});
  } catch {}
}

export async function deletePostFromFirestore(postId: string): Promise<void> {
  addLocalTombstone(postId);
  // 1. Authoritative server delete
  try {
    await fetch("/api/admin/content", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-key": "ahona-admin-verified" },
      body: JSON.stringify({ collection: COLLECTIONS.POSTS, id: postId }),
    });
  } catch (err) {
    console.warn("Server delete fetch error:", err);
  }

  // 2. Client SDK delete
  const firestore = getDb();
  if (firestore) {
    try {
      await deleteDoc(doc(firestore, COLLECTIONS.POSTS, postId));
    } catch (err) {
      console.warn("Failed to delete post from Firestore:", err);
    }
  }
}

export async function fetchPostsFromFirestore(): Promise<Post[] | null> {
  const firestore = getDb();
  if (!firestore) return null;
  try {
    const snap = await getDocs(collection(firestore, COLLECTIONS.POSTS));
    if (snap.empty) return null;
    const tombstones = getLocalTombstones();
    const posts: Post[] = [];
    snap.forEach((d) => {
      const p = d.data() as Post;
      if (p && p.id && !tombstones.has(p.id)) {
        posts.push(p);
      }
    });
    return posts;
  } catch (err) {
    console.warn("Failed to fetch posts from Firestore:", err);
    return null;
  }
}

// ----------------- NOVELS CRUD -----------------
export async function syncNovelToFirestore(novel: Novel): Promise<void> {
  const firestore = getDb();
  if (firestore) {
    try {
      await setDoc(doc(firestore, COLLECTIONS.NOVELS, novel.id), novel);
    } catch (err) {
      console.error("Failed to sync novel to Firestore:", err);
    }
  }
  try {
    fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": "ahona-admin-verified" },
      body: JSON.stringify({ collection: COLLECTIONS.NOVELS, id: novel.id, data: novel }),
    }).catch(() => {});
  } catch {}
}

export async function deleteNovelFromFirestore(novelId: string): Promise<void> {
  addLocalTombstone(novelId);
  try {
    await fetch("/api/admin/content", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-key": "ahona-admin-verified" },
      body: JSON.stringify({ collection: COLLECTIONS.NOVELS, id: novelId }),
    });
  } catch (err) {
    console.warn("Server delete novel fetch error:", err);
  }

  const firestore = getDb();
  if (firestore) {
    try {
      await deleteDoc(doc(firestore, COLLECTIONS.NOVELS, novelId));
    } catch (err) {
      console.error("Failed to delete novel from Firestore:", err);
    }
  }
}

export async function deleteEpisodeFromFirestore(novelId: string, episodeId: string): Promise<void> {
  addLocalTombstone(episodeId);
  try {
    await fetch("/api/admin/content", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-key": "ahona-admin-verified" },
      body: JSON.stringify({ collection: COLLECTIONS.NOVELS, id: novelId, novelId, episodeId }),
    });
  } catch (err) {
    console.warn("Server delete episode fetch error:", err);
  }
}

export async function fetchNovelsFromFirestore(): Promise<Novel[] | null> {
  const firestore = getDb();
  if (!firestore) return null;
  try {
    const snap = await getDocs(collection(firestore, COLLECTIONS.NOVELS));
    if (snap.empty) return null;
    const tombstones = getLocalTombstones();
    const novels: Novel[] = [];
    snap.forEach((d) => {
      const n = d.data() as Novel;
      if (n && n.id && !tombstones.has(n.id)) {
        if (Array.isArray(n.episodes)) {
          n.episodes = n.episodes.filter((ep) => !tombstones.has(ep.id));
        }
        novels.push(n);
      }
    });
    return novels;
  } catch (err) {
    console.warn("Failed to fetch novels from Firestore:", err);
    return null;
  }
}

// ----------------- AUTHOR PROFILE CRUD -----------------
export async function syncAuthorProfileToFirestore(profile: AuthorProfile): Promise<void> {
  const firestore = getDb();
  if (firestore) {
    try {
      await setDoc(doc(firestore, COLLECTIONS.SETTINGS, "author_profile"), profile);
    } catch (err) {
      console.error("Failed to sync author profile to Firestore:", err);
    }
  }
}

export async function fetchAuthorProfileFromFirestore(): Promise<AuthorProfile | null> {
  const firestore = getDb();
  if (!firestore) return null;
  try {
    const snap = await getDoc(doc(firestore, COLLECTIONS.SETTINGS, "author_profile"));
    if (snap.exists()) {
      const data = snap.data() as AuthorProfile;
      return {
        ...data,
        avatarUrl: (!data.avatarUrl || data.avatarUrl.includes("unsplash.com")) ? "/ahona.png" : data.avatarUrl,
      };
    }
    return null;
  } catch (err) {
    console.warn("Failed to fetch author profile from Firestore:", err);
    return null;
  }
}

// ----------------- COMMENTS CRUD -----------------
export async function syncCommentToFirestore(comment: ReaderComment): Promise<void> {
  const firestore = getDb();
  if (firestore) {
    try {
      await setDoc(doc(firestore, COLLECTIONS.COMMENTS, comment.id), comment);
    } catch (err) {
      console.error("Failed to sync comment to Firestore:", err);
    }
  }
}

export async function deleteCommentFromFirestore(commentId: string): Promise<void> {
  addLocalTombstone(commentId);
  try {
    await fetch("/api/admin/content", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-key": "ahona-admin-verified" },
      body: JSON.stringify({ collection: COLLECTIONS.COMMENTS, id: commentId }),
    });
  } catch {}

  const firestore = getDb();
  if (firestore) {
    try {
      await deleteDoc(doc(firestore, COLLECTIONS.COMMENTS, commentId));
    } catch (err) {
      console.error("Failed to delete comment from Firestore:", err);
    }
  }
}

// ----------------- SUBSCRIBERS CRUD -----------------
export async function syncSubscriberToFirestore(sub: Subscriber): Promise<void> {
  const firestore = getDb();
  if (firestore) {
    try {
      await setDoc(doc(firestore, COLLECTIONS.SUBSCRIBERS, sub.id), sub);
    } catch (err) {
      console.error("Failed to sync subscriber to Firestore:", err);
    }
  }
}

export async function deleteSubscriberFromFirestore(subId: string): Promise<void> {
  addLocalTombstone(subId);
  try {
    await fetch("/api/admin/content", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-key": "ahona-admin-verified" },
      body: JSON.stringify({ collection: COLLECTIONS.SUBSCRIBERS, id: subId }),
    });
  } catch {}

  const firestore = getDb();
  if (firestore) {
    try {
      await deleteDoc(doc(firestore, COLLECTIONS.SUBSCRIBERS, subId));
    } catch (err) {
      console.error("Failed to delete subscriber from Firestore:", err);
    }
  }
}

// ----------------- RATINGS CRUD -----------------
export async function syncRatingToFirestore(rating: ItemRating): Promise<void> {
  // 1. Authoritative server sync
  try {
    fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rating),
    }).catch(() => {});
  } catch {}

  // 2. Client Firestore SDK sync
  const firestore = getDb();
  if (firestore) {
    try {
      await setDoc(doc(firestore, COLLECTIONS.RATINGS, rating.id), rating);
    } catch (err) {
      console.error("Failed to sync rating to Firestore:", err);
    }
  }
}

export async function deleteRatingFromFirestore(ratingId: string): Promise<void> {
  addLocalTombstone(ratingId);
  // 1. Authoritative server delete
  try {
    fetch("/api/ratings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ratingId }),
    }).catch(() => {});
  } catch {}

  const firestore = getDb();
  if (firestore) {
    try {
      await deleteDoc(doc(firestore, COLLECTIONS.RATINGS, ratingId));
    } catch (err) {
      console.error("Failed to delete rating from Firestore:", err);
    }
  }
}

// ----------------- REAL-TIME SUBSCRIPTION HOOK HELPER -----------------
export function subscribeToFirestoreCollection<T>(
  collectionName: string,
  onData: (items: T[]) => void
): () => void {
  const firestore = getDb();
  if (!firestore) return () => {};

  try {
    const unsub = onSnapshot(
      collection(firestore, collectionName),
      (snapshot) => {
        const tombstones = getLocalTombstones();
        const items: T[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as { id?: string; isDeleted?: boolean; episodes?: { id: string }[] };
          if (data && data.id && !tombstones.has(data.id) && !data.isDeleted) {
            // Filter deleted episodes if this is a novel
            if (Array.isArray(data.episodes)) {
              data.episodes = data.episodes.filter((ep) => !tombstones.has(ep.id));
            }
            items.push(data as T);
          }
        });
        onData(items);
      },
      (error) => {
        console.warn(`Realtime subscription error for ${collectionName}:`, error);
      }
    );
    return unsub;
  } catch (e) {
    console.warn("Could not establish snapshot listener:", e);
    return () => {};
  }
}

export function subscribeToAuthorProfile(onData: (profile: AuthorProfile) => void): () => void {
  const firestore = getDb();
  if (!firestore) return () => {};

  try {
    const unsub = onSnapshot(
      doc(firestore, COLLECTIONS.SETTINGS, "author_profile"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as AuthorProfile;
          onData({
            ...data,
            avatarUrl: (!data.avatarUrl || data.avatarUrl.includes("unsplash.com")) ? "/ahona.png" : data.avatarUrl,
          });
        }
      },
      (err) => {
        console.warn("Author profile snapshot error:", err);
      }
    );
    return unsub;
  } catch (e) {
    console.warn("Could not establish author profile listener:", e);
    return () => {};
  }
}
