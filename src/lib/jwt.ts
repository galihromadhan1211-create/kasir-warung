import { SignJWT, jwtVerify } from "jose";

export type Session = {
  userId: number;
  role: "ADMIN" | "KASIR";
  name: string;
};

function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET belum diatur di file .env (minimal 32 karakter)"
    );
  }
  return new TextEncoder().encode(secret);
}

export async function encrypt(session: Session): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getKey());
}

export async function decrypt(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  const key = getKey(); // di luar try agar error konfigurasi terlihat jelas
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return {
      userId: Number(payload.userId),
      role: payload.role === "ADMIN" ? "ADMIN" : "KASIR",
      name: String(payload.name),
    };
  } catch {
    return null;
  }
}