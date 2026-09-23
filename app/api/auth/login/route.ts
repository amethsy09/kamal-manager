import { NextResponse } from "next/server";
import { z } from "zod";
import { loginAdmin } from "@/lib/auth";

const schema = z.object({ telephone: z.string().min(8).max(30), password: z.string().min(1).max(200) });

export async function POST(request: Request) {
  const form = await request.formData();
  const parsed = schema.safeParse({ telephone: form.get("telephone"), password: form.get("password") });
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  try {
    const ok = await loginAdmin(parsed.data.telephone, parsed.data.password);
    return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Service temporairement indisponible" }, { status: 503 });
  }
}
