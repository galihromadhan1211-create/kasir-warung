"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Username dan password wajib diisi" };
  }

  const user = await prisma.user.findUnique({ where: { username } });
  const valid = user ? await bcrypt.compare(password, user.password) : false;
  if (!user || !valid) {
    return { error: "Username atau password salah" };
  }

  await createSession({
    userId: user.id,
    role: user.role === "ADMIN" ? "ADMIN" : "KASIR",
    name: user.name,
  });
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}