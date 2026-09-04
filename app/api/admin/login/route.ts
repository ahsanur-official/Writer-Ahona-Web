import { NextRequest, NextResponse } from "next/server";
import { checkAdminCredentials, createSessionToken, ADMIN_COOKIE_NAME } from "@/lib/server/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "ইমেইল এবং পাসওয়ার্ড আবশ্যক।" },
        { status: 400 }
      );
    }

    const isValid = checkAdminCredentials(email, password);
    if (!isValid) {
      return NextResponse.json(
        { error: "ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।" },
        { status: 401 }
      );
    }

    const token = await createSessionToken(email);

    const response = NextResponse.json({
      success: true,
      token,
      email: email.trim().toLowerCase(),
      message: "অ্যাডমিন লগইন সফল হয়েছে।",
    });

    try {
      response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    } catch {
      // Cookie set failed, client will use Bearer token
    }

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "সার্ভারে সমস্যা হয়েছে, আবার চেষ্টা করুন।" },
      { status: 500 }
    );
  }
}
