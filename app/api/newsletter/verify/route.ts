import { NextRequest, NextResponse } from "next/server";

// ─── In-memory store (shared with subscribe route in production via DB/Redis) ─
// For this monolith we duplicate the Map and note production uses a shared DB.
const verifiedEmails = new Set<string>();

// ─── GET /api/newsletter/verify?token=xxx ────────────────────────────────────
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/newsletter/error?reason=missing_token", request.url));
  }

  try {
    // Decode token: base64url { email:nonce:timestamp }
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(":");
    if (parts.length < 3) {
      return NextResponse.redirect(new URL("/newsletter/error?reason=invalid_token", request.url));
    }

    const [email, , timestampStr] = parts;
    const issuedAt = parseInt(timestampStr, 10);
    const tokenAgeMs = Date.now() - issuedAt;
    const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

    if (tokenAgeMs > MAX_AGE_MS) {
      return NextResponse.redirect(new URL("/newsletter/error?reason=expired_token", request.url));
    }

    // Mark as verified (production: UPDATE subscribers SET verified=true WHERE email=?)
    verifiedEmails.add(email);
    console.log(`[Newsletter] Verified: ${email}`);

    // Production: push to SendGrid/Mailchimp marketing list here
    // await addToMailingList({ email, tags: ["footer-signup", "double-opt-in-confirmed"] });

    return NextResponse.redirect(new URL("/newsletter/confirmed", request.url));
  } catch (err) {
    console.error("[Newsletter] Verify error:", err);
    return NextResponse.redirect(new URL("/newsletter/error?reason=server_error", request.url));
  }
}
