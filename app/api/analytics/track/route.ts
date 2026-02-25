import { NextRequest, NextResponse } from "next/server";

// ─── POST /api/analytics/track ───────────────────────────────────────────────
// Server-side analytics sink. Production: forward to Segment, Mixpanel, or GA4.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, properties = {} } = body;

    if (!event || typeof event !== "string") {
      return NextResponse.json({ error: "missing_event" }, { status: 400 });
    }

    const enriched = {
      event,
      properties: {
        ...properties,
        server_timestamp: new Date().toISOString(),
        user_agent: request.headers.get("user-agent") ?? "unknown",
        // Strip PII: do not log full IP in analytics
        region: request.headers.get("cf-ipcountry") ?? "unknown",
      },
    };

    // Production: await segment.track(enriched);
    console.log("[Analytics]", JSON.stringify(enriched));

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[Analytics] Track error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
