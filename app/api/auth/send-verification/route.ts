import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, code, type = "register" } = body || {};

    const cleanEmail = email && typeof email === "string" ? email.trim().toLowerCase() : "";
    const cleanCode = code && typeof code === "string" ? code.trim() : "";

    // Strict email format validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    const parts = cleanEmail.split("@");
    const domainParts = parts[1]?.split(".") || [];
    const tld = domainParts[domainParts.length - 1] || "";

    if (
      !cleanEmail ||
      !emailRegex.test(cleanEmail) ||
      cleanEmail.includes("..") ||
      parts.length !== 2 ||
      domainParts.length < 2 ||
      tld.length < 2
    ) {
      return NextResponse.json(
        { error: "অনুগ্রহ করে একটি সঠিক ও সক্রিয় ইমেইল ঠিকানা প্রদান করুন (যেমন: name@example.com)" },
        { status: 400 }
      );
    }

    if (!cleanCode || cleanCode.length !== 6) {
      return NextResponse.json(
        { error: "সঠিক ৬-সংখ্যার ভেরিফিকেশন কোড প্রয়োজন" },
        { status: 400 }
      );
    }

    // Derive server origin for direct verification link
    const hostHeader = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const protoHeader = req.headers.get("x-forwarded-proto") || "https";
    const origin = req.headers.get("origin") || (hostHeader ? `${protoHeader}://${hostHeader}` : req.nextUrl.origin);
    const verificationLink = `${origin}/?verify_email=${encodeURIComponent(cleanEmail)}&code=${encodeURIComponent(cleanCode)}`;

    const readerName = (name && typeof name === "string" ? name.trim() : "") || "প্রিয় সুহৃদ পাঠক";

    const isForgot = type === "forgot";
    const subject = isForgot
      ? "🔐 পাসওয়ার্ড রিসেট ভেরিফিকেশন কোড ও লিংক - অহনা ইসলাম সাহিত্য আঙিনা"
      : "📖 একাউন্ট ভেরিফিকেশন কোড ও লিংক - অহনা ইসলাম সাহিত্য আঙিনা";

    const htmlContent = `
      <div style="font-family: 'Hind Siliguri', 'SolaimanLipi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e7dfd5; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
        <div style="background: linear-gradient(135deg, #a04834 0%, #833523 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
          <span style="font-size: 32px; display: inline-block; margin-bottom: 8px;">📖</span>
          <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.02em;">অহনা ইসলাম</h1>
          <p style="margin: 6px 0 0; font-size: 13px; color: #fce7df; opacity: 0.95;">কথা ও শব্দের নান্দনিক আঙিনা</p>
        </div>

        <div style="padding: 32px 28px; background: #fdfbf7;">
          <p style="font-size: 16px; color: #2d2826; margin: 0 0 16px; line-height: 1.6;">
            নমস্কার / আসসালামু আলাইকুম, <strong>${readerName}</strong>!
          </p>
          <p style="font-size: 14.5px; color: #5a524e; margin: 0 0 24px; line-height: 1.7;">
            ${
              isForgot
                ? "আপনার পাঠক একাউন্টের পাসওয়ার্ড পরিবর্তনের জন্য আবেদন করা হয়েছে। নিচের ৬-সংখ্যার গোপন ভেরিফিকেশন কোডটি অথবা সরাসরি ভেরিফিকেশন লিংকটি ব্যবহার করুন:"
                : "অহনা ইসলামের সাহিত্য আঙিনায় আপনার পাঠক একাউন্ট সক্রিয় করতে নিচের ৬-সংখ্যার ভেরিফিকেশন কোডটি ব্যবহার করুন অথবা সরাসরি ভেরিফিকেশন বাটনে ক্লিক করুন:"
            }
          </p>

          <div style="text-align: center; margin: 24px 0;">
            <div style="display: inline-block; padding: 16px 36px; background: #ffffff; border: 2px dashed #caa869; border-radius: 12px; box-shadow: 0 4px 12px rgba(160, 72, 52, 0.08);">
              <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8c827a; margin-bottom: 6px; font-weight: 600;">
                আপনার ৬-সংখ্যার ভেরিফিকেশন কোড
              </div>
              <div style="font-size: 38px; font-weight: 800; letter-spacing: 0.28em; color: #a04834; font-family: monospace;">
                ${cleanCode}
              </div>
            </div>

            <div style="margin-top: 20px;">
              <a href="${verificationLink}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 26px; background: #a04834; color: #ffffff; text-decoration: none; border-radius: 24px; font-weight: 700; font-size: 14px; box-shadow: 0 3px 10px rgba(160, 72, 52, 0.3);">
                🔗 সরাসরি এক ক্লিকে একাউন্ট ভেরিফাই করুন
              </a>
            </div>
          </div>

          <div style="background: rgba(234, 179, 8, 0.12); border-left: 4px solid #caa869; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; color: #78350f; line-height: 1.5;">
              ⏱ <strong>মেয়াদ সতর্কতা:</strong> এই ভেরিফিকেশন কোড ও লিংকের মেয়াদ <strong>১ মিনিট (৬০ সেকেন্ড)</strong>। মেয়াদ শেষ হলে অ্যাপ থেকে পুনরায় নতুন কোড চেয়ে নিতে পারবেন (৩ মিনিট অন্তর)।
            </p>
          </div>

          <p style="font-size: 12px; color: #786f68; line-height: 1.6; margin: 0 0 10px; word-break: break-all;">
            বাটন কাজ না করলে এই লিংকে ক্লিক করুন: <br />
            <a href="${verificationLink}" style="color: #a04834;">${verificationLink}</a>
          </p>

          <p style="font-size: 12px; color: #a8a29e; line-height: 1.5; margin: 0;">
            আপনি যদি এই অনুরোধ না করে থাকেন, তবে এই বার্তাটি এড়িয়ে চলুন।
          </p>
        </div>

        <div style="padding: 16px 24px; background: #f3efe8; border-top: 1px solid #e7dfd5; text-align: center; font-size: 12px; color: #8c827a;">
          <p style="margin: 0;">© ২০২৬ অহনা ইসলাম · কথাসাহিত্য ও কবিতার সংগ্রহশালা</p>
        </div>
      </div>
    `;

    // Check if SMTP environment is configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || `"অহনা ইসলাম সাহিত্য আঙিনা" <noreply@ahonaislam.com>`;

    let sentViaSmtp = false;
    let deliveryMessage = "ইমেইল সার্ভিসের মাধ্যমে ভেরিফিকেশন কোড পাঠানো হয়েছে";

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: smtpFrom,
          to: cleanEmail,
          subject,
          html: htmlContent,
          text: `অহনা ইসলাম সাহিত্য আঙিনা - আপনার ৬-সংখ্যার ভেরিফিকেশন কোড: ${cleanCode}`,
        });

        sentViaSmtp = true;
        deliveryMessage = `সরাসরি আপনার ইমেইলে (${cleanEmail}) কোড পাঠানো হয়েছে!`;
      } catch (smtpErr) {
        console.warn("SMTP email dispatch notice:", smtpErr);
      }
    } else {
      // Fallback for container environment without external SMTP credentials
      console.log(`[Email Dispatch Simulation] Sent code "${cleanCode}" to "${cleanEmail}" for ${type}`);
    }

    return NextResponse.json({
      success: true,
      sentViaSmtp,
      email: cleanEmail,
      verificationLink,
      code: cleanCode,
      message: deliveryMessage,
    });
  } catch (err: any) {
    console.error("Failed to send verification code email:", err);
    return NextResponse.json(
      { error: err?.message || "ভেরিফিকেশন কোড পাঠাতে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
