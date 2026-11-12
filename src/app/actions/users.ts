"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export type FormState = { error?: string; success?: string };
type Result = { error?: string };

const MIN_PASSWORD = 6;

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Tidak diizinkan");
  }
  return session;
}

// Semua pengguna yang sudah login boleh mengganti password miliknya sendiri
export async function changePassword(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: "Sesi habis, silakan login lagi" };

  const oldPw = String(formData.get("oldPassword") ?? "");
  const newPw = String(formData.get("newPassword") ?? "");
  const confirmPw = String(formData.get("confirmPassword") ?? "");

  if (newPw.length < MIN_PASSWORD) {
    return { error: `Password baru minimal ${MIN_PASSWORD} karakter` };
  }
  if (newPw !== confirmPw) {
    return { error: "Konfirmasi password tidak sama" };
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  const valid = user ? await bcrypt.compare(oldPw, user.password) : false;
  if (!user || !valid) return { error: "Password lama salah" };

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(newPw, 10) },
  });
  return { success: "Password berhasil diganti" };
}

export async function createUser(input: {
  name: string;
  username: string;
  password: string;
  role: string;
}): Promise<Result> {
  await requireAdmin();

  const name = input.name.trim();
  const username = input.username.trim().toLowerCase();
  if (!name) return { error: "Nama wajib diisi" };
  if (!/^[a-z0-9._-]{3,}$/.test(username)) {
    return {
      error:
        "Username minimal 3 karakter, hanya huruf kecil, angka, titik, strip, atau garis bawah",
    };
  }
  if (input.password.length < MIN_PASSWORD) {
    return { error: `Password minimal ${MIN_PASSWORD} karakter` };
  }
  if (input.role !== "ADMIN" && input.role !== "KASIR") {
    return { error: "Peran tidak valid" };
  }

  const exist = await prisma.user.findUnique({ where: { username } });
  if (exist) return { error: "Username sudah dipakai" };

  await prisma.user.create({
    data: {
      name,
      username,
      password: await bcrypt.hash(input.password, 10),
      role: input.role,
    },
  });
  revalidatePath("/pengaturan");
  return {};
}

export async function resetPassword(
  id: number,
  newPassword: string
): Promise<Result> {
  await requireAdmin();
  if (newPassword.length < MIN_PASSWORD) {
    return { error: `Password minimal ${MIN_PASSWORD} karakter` };
  }
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { error: "Akun tidak ditemukan" };

  await prisma.user.update({
    where: { id },
    data: { password: await bcrypt.hash(newPassword, 10) },
  });
  revalidatePath("/pengaturan");
  return {};
}

export async function deleteUser(id: number): Promise<Result> {
  const session = await requireAdmin();
  if (id === session.userId) {
    return { error: "Kamu tidak bisa menghapus akunmu sendiri" };
  }
  const used = await prisma.transaction.count({ where: { userId: id } });
  if (used > 0) {
    return {
      error:
        "Akun ini sudah punya riwayat transaksi, jadi tidak bisa dihapus. Ganti passwordnya saja kalau tidak dipakai lagi.",
    };
  }
  await prisma.user.delete({ where: { id } });
  revalidatePath("/pengaturan");
  return {};
}