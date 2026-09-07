// Reader User Authentication & Profile Engine with Full User Panel, Registration, Verification & Avatar Setup
// Ahona Islam Literary Platform

import { getDb } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";

export interface ReaderUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  avatarColor: string;
  bio?: string;
  emailVerified: boolean;
  verificationCode?: string;
  verificationSentAt?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export const STORAGE_KEY_USER = "ahona_reader_user";
export const STORAGE_KEY_ALL_USERS = "ahona_registered_readers";
export const AUTH_EVENT_NAME = "ahona-auth-changed";
export const USERS_EVENT_NAME = "ahona_registered_users_updated";

export const AVATAR_COLORS = [
  "#a04834", // terracotta
  "#caa869", // warm gold
  "#2a6f62", // deep sage / pine
  "#4f46e5", // royal indigo
  "#c026d3", // fuchsia rose
  "#0284c7", // sky sapphire
  "#d97706", // amber ochre
];

// Curated Literary Reader Avatars (Preset options for quick selection)
export const LITERARY_AVATAR_PRESETS = [
  {
    id: "preset-1",
    label: "বইপ্রেমী পাঠক",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
  },
  {
    id: "preset-2",
    label: "শান্ত দৃষ্টি",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80",
  },
  {
    id: "preset-3",
    label: "সাহিত্যানুরাগী",
    url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80",
  },
  {
    id: "preset-4",
    label: "চিন্তাশীল লেখক",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80",
  },
  {
    id: "preset-5",
    label: "জানালায় বইপড়া",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80",
  },
  {
    id: "preset-6",
    label: "তরুণ কাব্যপ্রেমী",
    url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&q=80",
  },
];

export function getRandomColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

// Generate 6-digit OTP code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 1. Get current logged in reader (only if emailVerified is true)
export function getCurrentUser(): ReaderUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReaderUser;
    if (!parsed || !parsed.emailVerified) return null;
    return parsed;
  } catch (err) {
    console.error("Failed to parse current reader user:", err);
    return null;
  }
}

// 2. Get all registered readers from local cache
export function getAllRegisteredUsers(): ReaderUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ALL_USERS);
    if (!raw) return [];
    return JSON.parse(raw) as ReaderUser[];
  } catch {
    return [];
  }
}

// Save user session (active login)
export function persistUserSession(user: ReaderUser | null): void {
  if (typeof window === "undefined") return;

  if (user && user.emailVerified) {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY_USER);
  }

  window.dispatchEvent(
    new CustomEvent(AUTH_EVENT_NAME, { detail: user && user.emailVerified ? user : null })
  );
}

// Save or update user in all registered list & sync to Firestore
export function saveRegisteredUserRecord(user: ReaderUser): void {
  if (typeof window === "undefined") return;
  const all = getAllRegisteredUsers();
  const idx = all.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...user };
  } else {
    all.push(user);
  }
  localStorage.setItem(STORAGE_KEY_ALL_USERS, JSON.stringify(all));

  // Sync to Firestore
  syncUserToFirestore(user).catch(() => {});
  window.dispatchEvent(new CustomEvent(USERS_EVENT_NAME, { detail: all }));
}

// Alias for backwards compatibility
export function persistUser(user: ReaderUser | null): void {
  if (user) {
    saveRegisteredUserRecord(user);
    if (user.emailVerified) {
      persistUserSession(user);
    }
  } else {
    persistUserSession(null);
  }
}

// 3. Sync user to Firestore
export async function syncUserToFirestore(user: ReaderUser): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    const userRef = doc(db, "users", user.id);
    const payload = { ...user };
    await setDoc(userRef, payload, { merge: true });
  } catch (err) {
    console.warn("Firestore sync error for user:", err);
  }
}

// Helper: Dispatch verification email through server route
export async function dispatchVerificationEmail(params: {
  email: string;
  name: string;
  code: string;
  type?: "register" | "forgot" | "resend";
}): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("/api/auth/send-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, message: data.error || "ইমেইল পাঠাতে সমস্যা হয়েছে" };
    }
    const data = await res.json();
    return { success: true, message: data.message || "ভেরিফিকেশন কোড পাঠানো হয়েছে" };
  } catch {
    return { success: false, message: "নেটওয়ার্কের কারণে ইমেইল পাঠানো সম্ভব হয়নি" };
  }
}

// 4. Register new user (Unverified initially - code must be verified!)
export async function registerUser(params: {
  name: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  bio?: string;
}): Promise<{ user: ReaderUser; verificationCode: string; message: string }> {
  const cleanName = params.name.trim();
  const cleanEmail = params.email.trim().toLowerCase();

  if (!cleanName) {
    throw new Error("অনুগ্রহ করে আপনার পুরো নাম লিখুন");
  }
  if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
    throw new Error("অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা দিন");
  }
  if (params.password && params.password.length < 4) {
    throw new Error("পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে");
  }

  const all = getAllRegisteredUsers();
  const existing = all.find((u) => u.email.toLowerCase() === cleanEmail);

  if (existing) {
    if (existing.emailVerified) {
      throw new Error("এই ইমেইল দিয়ে ইতোমধ্যে একটি সক্রিয় একাউন্ট রয়েছে। অনুগ্রহ করে লগইন করুন।");
    } else {
      // Unverified account - issue a new verification code
      const verificationCode = generateVerificationCode();
      existing.name = cleanName;
      if (params.password) existing.password = params.password;
      if (params.avatarUrl) existing.avatarUrl = params.avatarUrl;
      if (params.bio) existing.bio = params.bio.trim();
      existing.verificationCode = verificationCode;
      existing.verificationSentAt = new Date().toISOString();

      saveRegisteredUserRecord(existing);

      await dispatchVerificationEmail({
        email: cleanEmail,
        name: cleanName,
        code: verificationCode,
        type: "register",
      });

      return {
        user: existing,
        verificationCode,
        message: `${cleanEmail} ঠিকানায় নতুন ভেরিফিকেশন কোড পাঠানো হয়েছে। কোড নিশ্চিত করে একাউন্ট সক্রিয় করুন।`,
      };
    }
  }

  const verificationCode = generateVerificationCode();
  const now = new Date().toISOString();

  const newUser: ReaderUser = {
    id: `usr_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
    name: cleanName,
    email: cleanEmail,
    password: params.password || "",
    avatarUrl: params.avatarUrl || "",
    avatarColor: getRandomColor(cleanEmail),
    bio: params.bio ? params.bio.trim() : "",
    emailVerified: false, // CRITICAL: account is NOT complete or verified until code matches
    verificationCode,
    verificationSentAt: now,
    createdAt: now,
    lastLoginAt: now,
  };

  // Save to registered list & Firestore (DO NOT log in to session yet!)
  saveRegisteredUserRecord(newUser);

  // Send verification code to email
  await dispatchVerificationEmail({
    email: cleanEmail,
    name: cleanName,
    code: verificationCode,
    type: "register",
  });

  return {
    user: newUser,
    verificationCode,
    message: `${cleanEmail} ঠিকানায় ৬-সংখ্যার ভেরিফিকেশন কোড পাঠানো হয়েছে। কোড যাচাই না করা পর্যন্ত একাউন্ট সক্রিয় বা সঠিক হবে না।`,
  };
}

// 5. Login existing user (Strictly mandates emailVerified === true)
export async function loginUser(params: {
  email: string;
  password?: string;
}): Promise<ReaderUser> {
  const cleanEmail = params.email.trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা লিখুন");
  }

  // 1. Try local list
  const all = getAllRegisteredUsers();
  let user = all.find((u) => u.email.toLowerCase() === cleanEmail);

  // 2. Try Firestore fallback if not in local storage
  if (!user) {
    const db = getDb();
    if (db) {
      try {
        const q = query(collection(db, "users"), where("email", "==", cleanEmail));
        const snap = await getDocs(q);
        if (!snap.empty) {
          user = snap.docs[0].data() as ReaderUser;
          saveRegisteredUserRecord(user);
        }
      } catch (err) {
        console.warn("Error fetching user from Firestore:", err);
      }
    }
  }

  if (!user) {
    throw new Error("এই ইমেইলে কোনো পাঠক একাউন্ট পাওয়া যায়নি। অনুগ্রহ করে নিবন্ধন করুন।");
  }

  // Check password if set
  if (user.password && params.password) {
    if (user.password !== params.password) {
      throw new Error("ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।");
    }
  }

  // MANDATORY: User cannot log in unless email is verified!
  if (!user.emailVerified) {
    // Generate fresh verification code and dispatch to their email
    const code = generateVerificationCode();
    user.verificationCode = code;
    user.verificationSentAt = new Date().toISOString();
    saveRegisteredUserRecord(user);

    dispatchVerificationEmail({
      email: user.email,
      name: user.name,
      code,
      type: "resend",
    }).catch(() => {});

    throw new Error(
      `UNVERIFIED:${user.email}:আপনার একাউন্টটি এখনও ভেরিফাই করা হয়নি! একাউন্ট সম্পূর্ণ করতে ইমেইলে পাঠানো ৬-সংখ্যার কোডটি প্রবেশ করিয়ে ভেরিফিকেশন সম্পন্ন করুন।`
    );
  }

  user.lastLoginAt = new Date().toISOString();
  saveRegisteredUserRecord(user);
  persistUserSession(user);

  return user;
}

// 6. Send / Resend Email Verification Code
export async function sendEmailVerificationCode(email: string): Promise<{ code: string; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const current = getCurrentUser();

  const targetEmail = cleanEmail || current?.email;
  if (!targetEmail) {
    throw new Error("ইমেইল ঠিকানা পাওয়া যায়নি");
  }

  const all = getAllRegisteredUsers();
  const user = all.find((u) => u.email.toLowerCase() === targetEmail.toLowerCase()) || current;

  if (!user) {
    throw new Error("পাঠক একাউন্ট পাওয়া যায়নি");
  }

  const code = generateVerificationCode();
  user.verificationCode = code;
  user.verificationSentAt = new Date().toISOString();

  saveRegisteredUserRecord(user);

  const res = await dispatchVerificationEmail({
    email: targetEmail,
    name: user.name,
    code,
    type: "resend",
  });

  return {
    code,
    message: res.message || `${targetEmail} ঠিকানায় ৬-সংখ্যার নতুন ভেরিফিকেশন কোড পাঠানো হয়েছে!`,
  };
}

// 7. Verify email with 6-digit code (This officially completes account creation)
export async function verifyEmailCode(
  email: string,
  code: string
): Promise<{ success: boolean; user: ReaderUser }> {
  const cleanCode = code.trim();
  const cleanEmail = email.trim().toLowerCase();

  const all = getAllRegisteredUsers();
  let user = all.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    const db = getDb();
    if (db) {
      try {
        const q = query(collection(db, "users"), where("email", "==", cleanEmail));
        const snap = await getDocs(q);
        if (!snap.empty) {
          user = snap.docs[0].data() as ReaderUser;
        }
      } catch {}
    }
  }

  if (!user) {
    throw new Error("পাঠক একাউন্ট পাওয়া যায়নি। অনুগ্রহ করে নিবন্ধন করুন।");
  }

  if (!user.verificationCode || user.verificationCode !== cleanCode) {
    throw new Error("ভেরিফিকেশন কোডটি সঠিক নয়! সঠিক কোড দেওয়া না হলে একাউন্ট কার্যকর হবে না।");
  }

  // Verification succeeded - activate account and start session!
  user.emailVerified = true;
  user.verificationCode = undefined;
  user.lastLoginAt = new Date().toISOString();

  saveRegisteredUserRecord(user);
  persistUserSession(user);

  return { success: true, user };
}

// 8. Request Password Reset
export async function requestPasswordReset(email: string): Promise<{ code: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const all = getAllRegisteredUsers();
  const user = all.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    throw new Error("এই ইমেইলে কোনো পাঠক একাউন্ট পাওয়া যায়নি");
  }

  const code = generateVerificationCode();
  user.verificationCode = code;
  user.verificationSentAt = new Date().toISOString();

  saveRegisteredUserRecord(user);

  await dispatchVerificationEmail({
    email: cleanEmail,
    name: user.name,
    code,
    type: "forgot",
  });

  return { code };
}

// 9. Reset Password with code
export function resetPassword(email: string, code: string, newPass: string): boolean {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  if (!newPass || newPass.length < 4) {
    throw new Error("নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে");
  }

  const all = getAllRegisteredUsers();
  const user = all.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    throw new Error("পাঠক একাউন্ট পাওয়া যায়নি");
  }

  if (!user.verificationCode || user.verificationCode !== cleanCode) {
    throw new Error("ভুল ভেরিফিকেশন কোড প্রদান করা হয়েছে");
  }

  user.password = newPass;
  user.verificationCode = undefined;
  user.emailVerified = true; // resets also confirm ownership of the email
  saveRegisteredUserRecord(user);

  return true;
}

// 10. Update profile
export function updateCurrentUser(updates: Partial<ReaderUser>): ReaderUser | null {
  const current = getCurrentUser();
  if (!current) return null;

  const updated: ReaderUser = {
    ...current,
    ...updates,
  };

  saveRegisteredUserRecord(updated);
  persistUserSession(updated);
  return updated;
}

// 11. Log out user
export function logoutUser(): void {
  persistUserSession(null);
}

// 12. Delete User Account (Admin & User feature)
export async function deleteUserAccount(userId: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const all = getAllRegisteredUsers().filter((u) => u.id !== userId);
  localStorage.setItem(STORAGE_KEY_ALL_USERS, JSON.stringify(all));

  const current = getCurrentUser();
  if (current && current.id === userId) {
    persistUserSession(null);
  }

  const db = getDb();
  if (db) {
    try {
      await deleteDoc(doc(db, "users", userId));
    } catch (err) {
      console.warn("Firestore delete user error:", err);
    }
  }

  window.dispatchEvent(new CustomEvent(USERS_EVENT_NAME, { detail: all }));
  return true;
}

// 13. Admin Toggle User Verification Status
export async function toggleUserVerification(
  userId: string,
  emailVerified: boolean
): Promise<ReaderUser | null> {
  const all = getAllRegisteredUsers();
  const user = all.find((u) => u.id === userId);
  if (!user) return null;

  user.emailVerified = emailVerified;
  if (emailVerified) {
    user.verificationCode = undefined;
  }
  saveRegisteredUserRecord(user);

  const current = getCurrentUser();
  if (current && current.id === userId) {
    persistUserSession(emailVerified ? user : null);
  }

  return user;
}

// 14. Real-time Subscription to all readers for Admin Panel
export function subscribeToReaders(callback: (readers: ReaderUser[]) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const db = getDb();
  if (!db) {
    callback(getAllRegisteredUsers());
    const handler = () => callback(getAllRegisteredUsers());
    window.addEventListener(USERS_EVENT_NAME, handler);
    return () => window.removeEventListener(USERS_EVENT_NAME, handler);
  }

  try {
    const unsub = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const firestoreUsers: ReaderUser[] = [];
        snapshot.forEach((d) => {
          firestoreUsers.push(d.data() as ReaderUser);
        });

        const local = getAllRegisteredUsers();
        const map = new Map<string, ReaderUser>();
        local.forEach((u) => map.set(u.id, u));
        firestoreUsers.forEach((u) => map.set(u.id, u));
        const merged = Array.from(map.values());

        localStorage.setItem(STORAGE_KEY_ALL_USERS, JSON.stringify(merged));
        callback(merged);
      },
      (err) => {
        console.warn("Firestore users listener fallback:", err);
        callback(getAllRegisteredUsers());
      }
    );

    const localHandler = () => callback(getAllRegisteredUsers());
    window.addEventListener(USERS_EVENT_NAME, localHandler);

    return () => {
      unsub();
      window.removeEventListener(USERS_EVENT_NAME, localHandler);
    };
  } catch {
    callback(getAllRegisteredUsers());
    return () => {};
  }
}

// 15. Get stable user identifier
export function getUserIdentifier(): string {
  const current = getCurrentUser();
  if (current) return current.id;

  if (typeof window === "undefined") return "anon_server";
  let token = localStorage.getItem("ahona_client_token");
  if (!token) {
    token = `anon_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    localStorage.setItem("ahona_client_token", token);
  }
  return token;
}

// Legacy helper compatibility
export function loginOrRegister(name: string, email: string): ReaderUser {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  const all = getAllRegisteredUsers();
  let user = all.find((u) => u.email === cleanEmail);

  if (user) {
    user.name = cleanName;
    user.lastLoginAt = new Date().toISOString();
  } else {
    const code = generateVerificationCode();
    user = {
      id: `usr_${Math.random().toString(36).slice(2, 8)}_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      avatarColor: getRandomColor(cleanEmail),
      emailVerified: false,
      verificationCode: code,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
  }

  saveRegisteredUserRecord(user);
  return user;
}
