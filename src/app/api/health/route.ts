import { NextResponse } from "next/server";

export async function GET() {
  const hasCalcom = Boolean(process.env.CALCOM_WEBHOOK_SECRET);
  const hasSpruce = Boolean(process.env.SPRUCE_API_KEY);
  const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY);

  const payload = {
    status: "healthy",
    environment: process.env.NODE_ENV || "production",
    quarantine: "ZERO_ePHI_ENFORCED",
    integrations: {
      calcom: hasCalcom,
      spruce: hasSpruce,
      stripe: hasStripe,
      ecw_portal: true,
    },
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
