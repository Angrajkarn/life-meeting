import { NextRequest, NextResponse } from "next/server";
import { getFooterConfig } from "@/lib/footer-config";

export const dynamic = "force-dynamic";
export const revalidate = 300; // 5 min CDN cache

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region") ?? "global";
  const locale = searchParams.get("locale") ?? "en";
  const tenantId = request.headers.get("x-tenant-id") ?? undefined;

  const config = getFooterConfig(region, tenantId);

  return NextResponse.json(
    { config, locale, region, generatedAt: new Date().toISOString() },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "X-Footer-Version": "2.0.0",
      },
    }
  );
}
