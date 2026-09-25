import { NextResponse } from "next/server";
import { sendMonthlyReminders } from "@/lib/push-notifications";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Cron is not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await sendMonthlyReminders();
  return NextResponse.json(result);
}
