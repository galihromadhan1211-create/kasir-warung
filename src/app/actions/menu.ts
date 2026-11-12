"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type Result = { error?: string };

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Tidak diizinkan");
  }
}

function refresh() {
  revalidatePath("/kelola-menu");
  revalidatePath("/");
}

export async function saveMenu(input: {
  id?: number;
  name: string;
  price: number;
  categoryId: number;
}): Promise<Result> {
  await requireAdmin();

  const name = input.name.trim();
  if (!name) return { error: "Nama menu wajib diisi" };
  if (!Number.isInteger(input.price) || input.price < 0) {
    return { error: "Harga tidak valid" };
  }
  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
  });
  if (!category) return { error: "Pilih kategori terlebih dahulu" };

  if (input.id) {
    await prisma.menu.update({
      where: { id: input.id },
      data: { name, price: input.price, categoryId: input.categoryId },
    });
  } else {
    await prisma.menu.create({
      data: { name, price: input.price, categoryId: input.categoryId },
    });
  }
  refresh();
  return {};
}

export async function toggleAvailable(id: number): Promise<void> {
  await requireAdmin();
  const menu = await prisma.menu.findUnique({ where: { id } });
  if (!menu) return;
  await prisma.menu.update({
    where: { id },
    data: { available: !menu.available },
  });
  refresh();
}

export async function deleteMenu(id: number): Promise<void> {
  await requireAdmin();
  // Riwayat transaksi tetap aman: nama & harga sudah disalin ke TransactionItem
  await prisma.menu.delete({ where: { id } });
  refresh();
}

export async function addCategory(rawName: string): Promise<Result> {
  await requireAdmin();
  const name = rawName.trim();
  if (!name) return { error: "Nama kategori wajib diisi" };
  const exist = await prisma.category.findUnique({ where: { name } });
  if (exist) return { error: "Kategori sudah ada" };
  await prisma.category.create({ data: { name } });
  refresh();
  return {};
}