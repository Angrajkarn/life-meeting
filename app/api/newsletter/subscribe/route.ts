import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/email";

// ─── In-memory stores (production: Redis + PostgreSQL) ──────────────────────
const subscribers = new Map<
  string,
  {
    email: string;
    source: string;
    gdprConsent: boolean;
    subscribedAt: string;
    verified: boolean;
    token: string;
    tokenExpiresAt: number;
    unsubscribeToken: string;
  }
>();

// Rate limiter: IP → { count, windowStart }
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const HMAC_SECRET = process.env.NEWSLETTER_HMAC_SECRET ?? "dev-secret-change-in-production";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (record.count >= RATE_LIMIT_MAX) return true;
  record.count++;
  return false;
}

function generateToken(email: string): string {
  const nonce = randomBytes(16).toString("hex");
  const payload = `${email}:${nonce}:${Date.now()}`;
  return Buffer.from(payload).toString("base64url");
}

function generateUnsubscribeToken(email: string): string {
  return createHmac("sha256", HMAC_SECRET).update(email).digest("hex");
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.toLowerCase().trim());
}

// ─── POST /api/newsletter/subscribe ─────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "rate_limited", message: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, gdprConsent, source = "footer" } = body;

    // Input validation
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "invalid_email", message: "Email is required." },
        { status: 400 }
      );
    }
    const cleanEmail = email.toLowerCase().trim();
    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json(
        { error: "invalid_email", message: "Please enter a valid email address." },
        { status: 400 }
      );
    }
    if (!gdprConsent) {
      return NextResponse.json(
        { error: "gdpr_required", message: "GDPR consent is required." },
        { status: 400 }
      );
    }

    // Check if already subscribed and verified
    const existing = subscribers.get(cleanEmail);
    if (existing?.verified) {
      return NextResponse.json(
        { success: true, message: "You are already subscribed.", alreadySubscribed: true },
        { status: 200 }
      );
    }

    // Generate tokens
    const token = generateToken(cleanEmail);
    const unsubscribeToken = generateUnsubscribeToken(cleanEmail);
    const tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24h

    // Store subscriber (production: write to DB)
    subscribers.set(cleanEmail, {
      email: cleanEmail,
      source,
      gdprConsent,
      subscribedAt: new Date().toISOString(),
      verified: false,
      token,
      tokenExpiresAt,
      unsubscribeToken,
    });

    // Build URLs
    const origin = request.nextUrl.origin;
    const verifyUrl = `${origin}/api/newsletter/verify?token=${token}`;
    const unsubscribeUrl = `${origin}/unsubscribe?token=${unsubscribeToken}&email=${encodeURIComponent(cleanEmail)}`;

    // ── Send the actual verification email ──
    try {
      await sendVerificationEmail({ email: cleanEmail, verifyUrl, unsubscribeUrl });
    } catch (emailError) {
      // Log but don't fail the request — subscriber is stored, email can be retried
      console.error("[Newsletter] Email send failed:", emailError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Please check your inbox to confirm your subscription.",
        // Only included in dev for quick testing
        ...(process.env.NODE_ENV === "development" && { _devVerifyUrl: verifyUrl }),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[Newsletter] Subscribe error:", err);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// ─── Export store for verify route ──────────────────────────────────────────
export { subscribers };
