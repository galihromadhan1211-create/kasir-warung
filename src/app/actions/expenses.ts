"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { EXPENSE_CATEGORIES } from "@/lib/config";

type Result = { error?: string };

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Tidak diizinkan");
  }
}

export async function addExpense(input: {
  title: string;
  category: string;
  amount: number;
  date: string; // format YYYY-MM-DD
}): Promise<Result> {
  await requireAdmin();

  const title = input.title.trim();
  if (!title) return { error: "Keterangan wajib diisi" };
  if (!EXPENSE_CATEGORIES.includes(input.category)) {
    return { error: "Kategori tidak valid" };
  }
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    return { error: "Nominal harus lebih dari 0" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return { error: "Tanggal tidak valid" };
  }
  // Jam 12 siang agar aman dari pergeseran zona waktu
  const date = new Date(`${input.date}T12:00:00`);
  if (isNaN(date.getTime())) return { error: "Tanggal tidak valid" };

  await prisma.expense.create({
    data: { title, category: input.category, amount: input.amount, date },
  });
  revalidatePath("/pengeluaran");
  revalidatePath("/laporan");
  return {};
}

export async function deleteExpense(id: number): Promise<void> {
  await requireAdmin();
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/pengeluaran");
  revalidatePath("/laporan");
}