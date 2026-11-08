import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL belum dikonfigurasi.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const developmentAccounts = [
  {
    email: "budi.owner@example.com",
    envName: "DEV_SEED_OWNER_PASSWORD",
    profileId: "O001",
    role: "owner",
  },
  {
    email: "dina.kasir@example.com",
    envName: "DEV_SEED_KASIR_PASSWORD",
    profileId: "KS001",
    role: "kasir",
  },
  {
    email: "rizky.kapster@example.com",
    envName: "DEV_SEED_KAPSTER_PASSWORD",
    profileId: "K0001",
    role: "kapster",
  },
  {
    email: "alya.putri@example.com",
    envName: "DEV_SEED_PELANGGAN_PASSWORD",
    profileId: "P0001",
    role: "pelanggan",
  },
] as const;

async function seedDevelopmentAccounts() {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Akun pengujian hanya boleh di-seed pada NODE_ENV=development.");
  }

  const credentials = developmentAccounts.map(({ envName, ...account }) => {
    const password = process.env[envName];
    if (!password) {
      throw new Error(`Variabel ${envName} belum dikonfigurasi.`);
    }

    return { ...account, password };
  });
  const hashes = await Promise.all(
    credentials.map(({ password }) => bcrypt.hash(password, 12)),
  );

  await prisma.$transaction(async (transaction) => {
    const owner = await transaction.owner.findUnique({
      where: { id_owner: "O001" },
      select: { id_owner: true },
    });
    const cashier = await transaction.kasir.findUnique({
      where: { id_kasir: "KS001" },
      select: { id_kasir: true },
    });
    const barber = await transaction.kapster.findUnique({
      where: { id_kapster: "K0001" },
      select: { id_kapster: true },
    });
    const customer = await transaction.pelanggan.findUnique({
      where: { id_pelanggan: "P0001" },
      select: { id_pelanggan: true },
    });

    if (!owner || !cashier || !barber || !customer) {
      throw new Error("Satu atau beberapa profil akun pengujian tidak ditemukan.");
    }

    for (const [index, account] of credentials.entries()) {
      const profileFields = {
        id_owner: account.role === "owner" ? account.profileId : null,
        id_kasir: account.role === "kasir" ? account.profileId : null,
        id_kapster: account.role === "kapster" ? account.profileId : null,
        id_pelanggan: account.role === "pelanggan" ? account.profileId : null,
      };

      await transaction.akun.upsert({
        where: { email: account.email },
        update: {
          password_hash: hashes[index],
          role: account.role,
          is_active: true,
          ...profileFields,
        },
        create: {
          email: account.email,
          password_hash: hashes[index],
          role: account.role,
          ...profileFields,
        },
      });
    }
  });

  console.log(`Seed akun development berhasil: ${developmentAccounts.length} akun.`);
}

seedDevelopmentAccounts()
  .catch((error: unknown) => {
    console.error("Seed akun development gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
