import { cookies } from "next/headers";
import { encrypt, decrypt, type Session } from "@/lib/jwt";

const COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

export async function createSession(session: Session) {
  const token = await encrypt(session);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<Session | null> {
  return decrypt((await cookies()).get(COOKIE)?.value);
}

export async function deleteSession() {
  (await cookies()).delete(COOKIE);
}