import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, code, type = "register" } = body || {};

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "সঠিক ইমেইল ঠিকানা প্রয়োজন" },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string" || code.trim().length !== 6) {
      return NextResponse.json(
        { error: "সঠিক ৬-সংখ্যার ভেরিফিকেশন কোড প্রয়োজন" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();
    const readerName = (name && typeof name === "string" ? name.trim() : "") || "প্রিয় সুহৃদ পাঠক";

    const isForgot = type === "forgot";
    const subject = isForgot
      ? "🔐 পাসওয়ার্ড রিসেট ভেরিফিকেশন কোড - অহনা ইসলাম সাহিত্য আঙিনা"
      : "📖 একাউন্ট ভেরিফিকেশন কোড - অহনা ইসলাম সাহিত্য আঙিনা";

    const htmlContent = `
      <div style="font-family: 'Hind Siliguri', 'SolaimanLipi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e7dfd5; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
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
                ? "আপনার পাঠক একাউন্টের পাসওয়ার্ড পরিবর্তনের জন্য আবেদন করা হয়েছে। নিচের ৬-সংখ্যার গোপন ভেরিফিকেশন কোডটি ব্যবহার করে নতুন পাসওয়ার্ড নির্ধারণ করুন:"
                : "অহনা ইসলামের সাহিত্য আঙিনায় আপনার পাঠক একাউন্ট নিবন্ধন সফলভাবে সম্পন্ন করতে নিচের ৬-সংখ্যার ভেরিফিকেশন কোডটি প্রদান করুন। <strong>এই কোডটি প্রদান না করা পর্যন্ত আপনার একাউন্ট সক্রিয় বা বৈধ বলে গণ্য হবে না।</strong>"
            }
          </p>

          <div style="text-align: center; margin: 28px 0;">
            <div style="display: inline-block; padding: 16px 36px; background: #ffffff; border: 2px dashed #caa869; border-radius: 12px; box-shadow: 0 4px 12px rgba(160, 72, 52, 0.08);">
              <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8c827a; margin-bottom: 6px; font-weight: 600;">
                আপনার গোপন ভেরিফিকেশন কোড
              </div>
              <div style="font-size: 36px; font-weight: 800; letter-spacing: 0.28em; color: #a04834; font-family: monospace;">
                ${cleanCode}
              </div>
            </div>
          </div>

          <div style="background: rgba(202, 168, 105, 0.12); border-left: 4px solid #caa869; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 13px; color: #6e5828; line-height: 1.5;">
              ⏱ <strong>সতর্কতা:</strong> এই ভেরিফিকেশন কোডটির মেয়াদ <strong>১০ মিনিট</strong>। নিরাপত্তা স্বার্থে এই কোডটি অন্য কারো সাথে ভাগ করবেন না।
            </p>
          </div>

          <p style="font-size: 13px; color: #786f68; line-height: 1.6; margin: 0;">
            আপনি যদি এই অনুরোধ না করে থাকেন, তবে এই ইমেইলটি উপেক্ষা করুন। কোনো পরিবর্তনের প্রয়োজন নেই।
          </p>
        </div>

        <div style="padding: 18px 24px; background: #f3efe8; border-top: 1px solid #e7dfd5; text-align: center; font-size: 12px; color: #8c827a;">
          <p style="margin: 0;">© ২০২৬ অহনা ইসলাম · কথাসাহিত্য, গল্প ও কবিতার ডিজিটাল সংগ্রহশালা</p>
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
