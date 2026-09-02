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
import type { Post, Novel, ReaderComment, Subscriber, AuthorProfile } from "./store";

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
  SETTINGS: "settings",
} as const;

// ----------------- SEEDING INITIAL DATA -----------------
export async function seedInitialDataIfEmpty(
  initialPosts: Post[],
  initialNovels: Novel[],
  initialProfile: AuthorProfile,
  initialComments: ReaderComment[],
  initialSubscribers: Subscriber[]
): Promise<boolean> {
  const firestore = getDb();
  if (!firestore) return false;

  try {
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
      if (!data?.bio || data.bio.startsWith("আমি অহনা") || data.avatarUrl?.includes("unsplash.com")) {
        console.log("Updating author profile in Firestore with new official bio and avatar...");
        await setDoc(profileRef, { ...data, ...initialProfile });
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

    return true;
  } catch (err) {
    console.warn("Firestore seeding check warning:", err);
    return false;
  }
}

// ----------------- POSTS CRUD -----------------
export async function syncPostToFirestore(post: Post): Promise<void> {
  const firestore = getDb();
  if (!firestore) return;
  try {
    await setDoc(doc(firestore, COLLECTIONS.POSTS, post.id), post);
  } catch (err) {
    console.error("Failed to sync post to Firestore:", err);
  }
}

export async function deletePostFromFirestore(postId: string): Promise<void> {
  const firestore = getDb();
  if (!firestore) return;
  try {
    await deleteDoc(doc(firestore, COLLECTIONS.POSTS, postId));
  } catch (err) {
    console.error("Failed to delete post from Firestore:", err);
  }
}

export async function fetchPostsFromFirestore(): Promise<Post[] | null> {
  const firestore = getDb();
  if (!firestore) return null;
  try {
    const snap = await getDocs(collection(firestore, COLLECTIONS.POSTS));
    if (snap.empty) return null;
    const posts: Post[] = [];
    snap.forEach((d) => posts.push(d.data() as Post));
    return posts;
  } catch (err) {
    console.warn("Failed to fetch posts from Firestore:", err);
    return null;
  }
}

// ----------------- NOVELS CRUD -----------------
export async function syncNovelToFirestore(novel: Novel): Promise<void> {
  const firestore = getDb();
  if (!firestore) return;
  try {
    await setDoc(doc(firestore, COLLECTIONS.NOVELS, novel.id), novel);
  } catch (err) {
    console.error("Failed to sync novel to Firestore:", err);
  }
}

export async function deleteNovelFromFirestore(novelId: string): Promise<void> {
  const firestore = getDb();
  if (!firestore) return;
  try {
    await deleteDoc(doc(firestore, COLLECTIONS.NOVELS, novelId));
  } catch (err) {
    console.error("Failed to delete novel from Firestore:", err);
  }
}

export async function fetchNovelsFromFirestore(): Promise<Novel[] | null> {
  const firestore = getDb();
  if (!firestore) return null;
  try {
    const snap = await getDocs(collection(firestore, COLLECTIONS.NOVELS));
    if (snap.empty) return null;
    const novels: Novel[] = [];
    snap.forEach((d) => novels.push(d.data() as Novel));
    return novels;
  } catch (err) {
    console.warn("Failed to fetch novels from Firestore:", err);
    return null;
  }
}

// ----------------- AUTHOR PROFILE CRUD -----------------
export async function syncAuthorProfileToFirestore(profile: AuthorProfile): Promise<void> {
  const firestore = getDb();
  if (!firestore) return;
  try {
    await setDoc(doc(firestore, COLLECTIONS.SETTINGS, "author_profile"), profile);
  } catch (err) {
    console.error("Failed to sync author profile to Firestore:", err);
  }
}

export async function fetchAuthorProfileFromFirestore(): Promise<AuthorProfile | null> {
  const firestore = getDb();
  if (!firestore) return null;
  try {
    const snap = await getDoc(doc(firestore, COLLECTIONS.SETTINGS, "author_profile"));
    if (snap.exists()) {
      return snap.data() as AuthorProfile;
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
  if (!firestore) return;
  try {
    await setDoc(doc(firestore, COLLECTIONS.COMMENTS, comment.id), comment);
  } catch (err) {
    console.error("Failed to sync comment to Firestore:", err);
  }
}

export async function deleteCommentFromFirestore(commentId: string): Promise<void> {
  const firestore = getDb();
  if (!firestore) return;
  try {
    await deleteDoc(doc(firestore, COLLECTIONS.COMMENTS, commentId));
  } catch (err) {
    console.error("Failed to delete comment from Firestore:", err);
  }
}

// ----------------- SUBSCRIBERS CRUD -----------------
export async function syncSubscriberToFirestore(sub: Subscriber): Promise<void> {
  const firestore = getDb();
  if (!firestore) return;
  try {
    await setDoc(doc(firestore, COLLECTIONS.SUBSCRIBERS, sub.id), sub);
  } catch (err) {
    console.error("Failed to sync subscriber to Firestore:", err);
  }
}

export async function deleteSubscriberFromFirestore(subId: string): Promise<void> {
  const firestore = getDb();
  if (!firestore) return;
  try {
    await deleteDoc(doc(firestore, COLLECTIONS.SUBSCRIBERS, subId));
  } catch (err) {
    console.error("Failed to delete subscriber from Firestore:", err);
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
        const items: T[] = [];
        snapshot.forEach((doc) => {
          items.push(doc.data() as T);
        });
        if (items.length > 0) {
          onData(items);
        }
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
          onData(snapshot.data() as AuthorProfile);
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
