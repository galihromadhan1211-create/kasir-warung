import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Akun awal (segera ganti password setelah login pertama)
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "Pemilik Warung",
      username: "admin",
      password: await bcrypt.hash("admin123", 10),
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { username: "kasir" },
    update: {},
    create: {
      name: "Kasir 1",
      username: "kasir",
      password: await bcrypt.hash("kasir123", 10),
      role: "KASIR",
    },
  });

  // Kategori
  const makanan = await prisma.category.upsert({
    where: { name: "Makanan" },
    update: {},
    create: { name: "Makanan" },
  });
  const minuman = await prisma.category.upsert({
    where: { name: "Minuman" },
    update: {},
    create: { name: "Minuman" },
  });
  const tambahan = await prisma.category.upsert({
    where: { name: "Tambahan" },
    update: {},
    create: { name: "Tambahan" },
  });

  // Menu contoh (hanya diisi jika masih kosong)
  const count = await prisma.menu.count();
  if (count === 0) {
    await prisma.menu.createMany({
      data: [
        { categoryId: makanan.id, name: "Nasi Goreng", price: 15000 },
        { categoryId: makanan.id, name: "Mie Ayam", price: 12000 },
        { categoryId: makanan.id, name: "Nasi Campur", price: 18000 },
        { categoryId: makanan.id, name: "Ayam Geprek", price: 16000 },
        { categoryId: minuman.id, name: "Es Teh", price: 4000 },
        { categoryId: minuman.id, name: "Es Jeruk", price: 6000 },
        { categoryId: minuman.id, name: "Kopi Hitam", price: 5000 },
        { categoryId: tambahan.id, name: "Telur Dadar", price: 4000 },
        { categoryId: tambahan.id, name: "Kerupuk", price: 2000 },
      ],
    });
  }

  console.log("Seed selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });