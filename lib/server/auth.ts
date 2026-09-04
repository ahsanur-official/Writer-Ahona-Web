const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  "ahona-islam-writer-platform-ultra-secure-hmac-key-2026-bangla-literature";

export const ADMIN_COOKIE_NAME = "ahona_admin_session";

function base64UrlEncode(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf-8").toString("base64url");
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "base64url").toString("utf-8");
  }
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return atob(base64);
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(email: string): Promise<string> {
  const timestamp = Date.now().toString();
  const payload = `${email.toLowerCase()}:${timestamp}`;
  const enc = new TextEncoder();
  const key = await getCryptoKey(SESSION_SECRET);
  const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const sigHex = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const b64Payload = base64UrlEncode(payload);
  return `${b64Payload}.${sigHex}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token || typeof token !== "string") return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;
    const [b64Payload, sigHex] = parts;
    const payload = base64UrlDecode(b64Payload);
    const [email, timestampStr] = payload.split(":");
    if (!email || !timestampStr) return false;

    // Check expiration (7 days)
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp) || Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000) {
      return false;
    }

    // Verify signature
    const enc = new TextEncoder();
    const key = await getCryptoKey(SESSION_SECRET);
    const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
    const expectedSigHex = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return sigHex === expectedSigHex;
  } catch {
    return false;
  }
}

export function checkAdminCredentials(email?: string, password?: string): boolean {
  if (!email || !password) return false;
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const envPassword = process.env.ADMIN_PASSWORD?.trim();

  // If specific env credentials are set, check them
  if (envEmail && envPassword) {
    if (cleanEmail === envEmail && cleanPassword === envPassword) {
      return true;
    }
  }

  // Accepted admin emails / usernames
  const validEmails = [
    "admin@ahonaislam.com",
    "admin@ahnaislam.com",
    "admin",
    "ahona@gmail.com",
    "contact@ahonaislam.com",
    "mdahsanurrahaman2456@gmail.com",
    ...(envEmail ? [envEmail] : []),
  ];

  // Accepted admin passwords
  const validPasswords = [
    "ahona2026",
    "admin",
    "admin123",
    ...(envPassword ? [envPassword] : []),
  ];

  return validEmails.includes(cleanEmail) && validPasswords.includes(cleanPassword);
}
