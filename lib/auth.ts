import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const COOKIE = "kamal_session";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters");
  return new TextEncoder().encode(value);
}

export async function loginAdmin(telephone: string, password: string) {
  const user = await prisma.user.findUnique({ where: { telephone } });
  if (!user || user.role !== "ADMIN" || !user.actif || !user.passwordHash) return false;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return false;

  const token = await new SignJWT({ role: user.role, telephone: user.telephone })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return true;
}

export async function logoutAdmin() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.role !== "ADMIN" || !payload.sub) return null;
    return { userId: payload.sub };
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
