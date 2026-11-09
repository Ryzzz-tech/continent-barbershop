import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { Prisma, PrismaClient } from "../app/generated/prisma/client";

const connectionString =
  process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"];

if (process.env["NODE_ENV"] !== "production") {
  throw new Error("Seed produksi hanya dapat dijalankan dengan NODE_ENV=production.");
}

if (!connectionString) {
  throw new Error("DIRECT_URL atau DATABASE_URL belum dikonfigurasi.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const owners = [
  {
    id_owner: "O001",
    nama: "Budi Santoso",
    no_hp: "6281234567831",
    email: "budi.owner@example.com",
  },
  {
    id_owner: "O002",
    nama: "Sari Wulandari",
    no_hp: "6281234567832",
    email: "sari.owner@example.com",
  },
] satisfies Prisma.ownerCreateManyInput[];

const cashiers = [
  {
    id_kasir: "KS001",
    nama: "Dina Rahma",
    no_hp: "6281234567821",
    email: "dina.kasir@example.com",
  },
  {
    id_kasir: "KS002",
    nama: "Rafi Maulana",
    no_hp: "6281234567822",
    email: "rafi.kasir@example.com",
  },
] satisfies Prisma.kasirCreateManyInput[];

const barbers = [
  {
    id_kapster: "K0001",
    nama: "Rizky Pratama",
    no_hp: "6281234567811",
    status: "Aktif",
    email: "rizky.kapster@example.com",
  },
  {
    id_kapster: "K0002",
    nama: "Andi Saputra",
    no_hp: "6281234567812",
    status: "Aktif",
    email: "andi.kapster@example.com",
  },
  {
    id_kapster: "K0003",
    nama: "Fikri Hidayat",
    no_hp: "6281234567813",
    status: "Aktif",
    email: "fikri.kapster@example.com",
  },
] satisfies Prisma.kapsterCreateManyInput[];

const customers = [
  {
    id_pelanggan: "P0001",
    nama: "Alya Putri",
    no_hp: "6281234567801",
    alamat: "Padang",
    tanggal_daftar: new Date("2026-10-01T00:00:00.000Z"),
    email: "alya.putri@example.com",
  },
  {
    id_pelanggan: "P0002",
    nama: "Fajar Ramadhan",
    no_hp: "6281234567802",
    alamat: "Koto Tangah, Padang",
    tanggal_daftar: new Date("2026-09-25T00:00:00.000Z"),
    email: "fajar.r@example.com",
  },
  {
    id_pelanggan: "P0003",
    nama: "Nadia Safitri",
    no_hp: "6281234567803",
    alamat: "Padang Barat",
    tanggal_daftar: new Date("2026-10-05T00:00:00.000Z"),
    email: "nadia.s@example.com",
  },
  {
    id_pelanggan: "P0004",
    nama: "Dimas Prakoso",
    no_hp: "6281234567804",
    alamat: "Lubuk Begalung",
    tanggal_daftar: new Date("2026-10-08T00:00:00.000Z"),
    email: "dimas.p@example.com",
  },
  {
    id_pelanggan: "P0005",
    nama: "Intan Permata",
    no_hp: "6281234567805",
    alamat: "Pauh, Padang",
    tanggal_daftar: new Date("2026-10-10T00:00:00.000Z"),
    email: "intan.p@example.com",
  },
] satisfies Prisma.pelangganCreateManyInput[];


const services = [
  // Layanan lama dipertahankan sebagai arsip/nonaktif.
  {
    id_layanan: "L0001",
    nama_layanan: "Haircut",
    durasi: 30,
    harga: 50000,
    deskripsi: null,
    is_active: false,
  },
  {
    id_layanan: "L0002",
    nama_layanan: "Haircut",
    durasi: 45,
    harga: 70000,
    deskripsi: null,
    is_active: false,
  },
  {
    id_layanan: "L0003",
    nama_layanan: "Haircut",
    durasi: 20,
    harga: 30000,
    deskripsi: null,
    is_active: false,
  },
  {
    id_layanan: "L0004",
    nama_layanan: "Haircut",
    durasi: 90,
    harga: 150000,
    deskripsi: null,
    is_active: false,
  },

  // Katalog layanan aktif sesuai migrasi.
  {
    id_layanan: "L0005",
    nama_layanan: "Regular Haircut",
    durasi: 30,
    harga: 50000,
    deskripsi: "Haircut, Hairwash, Tonic, Massage, Styling, Hair Product.",
    is_active: true,
  },
  {
    id_layanan: "L0006",
    nama_layanan: "Premium Haircut",
    durasi: 45,
    harga: 70000,
    deskripsi: "Haircut, Hairwash, Tonic, Massage, Facial Steam, Styling, Hair Product.",
    is_active: true,
  },
  {
    id_layanan: "L0007",
    nama_layanan: "Full Service",
    durasi: 60,
    harga: 125000,
    deskripsi: "Haircut, Hairwash, Tonic, Massage, Facial Steam, Mask, Styling.",
    is_active: true,
  },
  {
    id_layanan: "L0008",
    nama_layanan: "Hair Styling",
    durasi: 20,
    harga: 20000,
    deskripsi: "Hair Wash, Tonic, Massage, Hair Styling, Hair Product.",
    is_active: true,
  },
  {
    id_layanan: "L0009",
    nama_layanan: "Creambath",
    durasi: 45,
    harga: 80000,
    deskripsi: null,
    is_active: true,
  },
  {
    id_layanan: "L0010",
    nama_layanan: "Creambath + Facial Steam",
    durasi: 60,
    harga: 100000,
    deskripsi: null,
    is_active: true,
  },
  {
    id_layanan: "L0011",
    nama_layanan: "Creambath + Full Facial",
    durasi: 90,
    harga: 160000,
    deskripsi: null,
    is_active: true,
  },
  {
    id_layanan: "L0012",
    nama_layanan: "Perming (Keriting Rambut)",
    durasi: 120,
    harga: 150000,
    deskripsi: null,
    is_active: true,
  },
  {
    id_layanan: "L0013",
    nama_layanan: "Hair Colour",
    durasi: 90,
    harga: 100000,
    deskripsi: null,
    is_active: true,
  },
  {
    id_layanan: "L0014",
    nama_layanan: "Highlight",
    durasi: 120,
    harga: 250000,
    deskripsi: null,
    is_active: true,
  },
  {
    id_layanan: "L0015",
    nama_layanan: "Home Service",
    durasi: 90,
    harga: 100000,
    deskripsi: null,
    is_active: true,
  },
] satisfies Prisma.layananCreateManyInput[];

const products = [
  {
    id_produk: "PR001",
    nama_produk: "Pomade Mini",
    harga: 25000,
    stok: 18,
    satuan: "pcs",
  },
  {
    id_produk: "PR002",
    nama_produk: "Hair Tonic",
    harga: 35000,
    stok: 12,
    satuan: "botol",
  },
  {
    id_produk: "PR003",
    nama_produk: "Shampoo",
    harga: 40000,
    stok: 20,
    satuan: "botol",
  },
  {
    id_produk: "PR004",
    nama_produk: "Clay",
    harga: 30000,
    stok: 9,
    satuan: "pcs",
  },
  {
    id_produk: "PR005",
    nama_produk: "Hair Serum",
    harga: 45000,
    stok: 15,
    satuan: "botol",
  },
] satisfies Omit<Prisma.produkCreateManyInput, "is_active">[];

const operationalAccounts = [
  {
    email: "budi.owner@example.com",
    passwordVariable: "PRODUCTION_SEED_OWNER_PASSWORD",
    profileId: "O001",
    role: "owner",
  },
  {
    email: "dina.kasir@example.com",
    passwordVariable: "PRODUCTION_SEED_KASIR_PASSWORD",
    profileId: "KS001",
    role: "kasir",
  },
  {
    email: "rizky.kapster@example.com",
    passwordVariable: "PRODUCTION_SEED_KAPSTER_PASSWORD",
    profileId: "K0001",
    role: "kapster",
  },
  {
    email: "alya.putri@example.com",
    passwordVariable: "PRODUCTION_SEED_PELANGGAN_PASSWORD",
    profileId: "P0001",
    role: "pelanggan",
  },
] as const;

async function ensureOperationalAccount(
  transaction: Prisma.TransactionClient,
  account: (typeof operationalAccounts)[number],
) {
  let existingAccount: {
    role: string;
    id_owner: string | null;
    id_kasir: string | null;
    id_kapster: string | null;
    id_pelanggan: string | null;
  } | null;

  switch (account.role) {
    case "owner":
      existingAccount = await transaction.akun.findUnique({
        where: { id_owner: account.profileId },
        select: {
          role: true,
          id_owner: true,
          id_kasir: true,
          id_kapster: true,
          id_pelanggan: true,
        },
      });
      break;
    case "kasir":
      existingAccount = await transaction.akun.findUnique({
        where: { id_kasir: account.profileId },
        select: {
          role: true,
          id_owner: true,
          id_kasir: true,
          id_kapster: true,
          id_pelanggan: true,
        },
      });
      break;
    case "kapster":
      existingAccount = await transaction.akun.findUnique({
        where: { id_kapster: account.profileId },
        select: {
          role: true,
          id_owner: true,
          id_kasir: true,
          id_kapster: true,
          id_pelanggan: true,
        },
      });
      break;
    case "pelanggan":
      existingAccount = await transaction.akun.findUnique({
        where: { id_pelanggan: account.profileId },
        select: {
          role: true,
          id_owner: true,
          id_kasir: true,
          id_kapster: true,
          id_pelanggan: true,
        },
      });
      break;
  }

  if (existingAccount) {
    const linkedProfileId = {
      owner: existingAccount.id_owner,
      kasir: existingAccount.id_kasir,
      kapster: existingAccount.id_kapster,
      pelanggan: existingAccount.id_pelanggan,
    }[account.role];
    const otherProfileIds = [
      existingAccount.id_owner,
      existingAccount.id_kasir,
      existingAccount.id_kapster,
      existingAccount.id_pelanggan,
    ].filter((profileId) => profileId !== linkedProfileId);

    if (
      existingAccount.role !== account.role ||
      linkedProfileId !== account.profileId ||
      otherProfileIds.some((profileId) => profileId !== null)
    ) {
      throw new Error(
        `Akun untuk profil ${account.profileId} sudah ada dengan role atau relasi yang tidak sesuai.`,
      );
    }

    return false;
  }

  const emailAccount = await transaction.akun.findUnique({
    where: { email: account.email },
    select: { id_akun: true },
  });
  if (emailAccount) {
    throw new Error(
      `Email akun operasional ${account.email} sudah terhubung ke profil lain.`,
    );
  }

  const password = process.env[account.passwordVariable];
  if (!password) {
    throw new Error(
      `Variabel ${account.passwordVariable} wajib diisi untuk membuat akun ${account.role}.`,
    );
  }
  if (
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    throw new Error(
      `Variabel ${account.passwordVariable} harus berisi password 8 sampai 72 byte.`,
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const data = {
    email: account.email,
    password_hash: passwordHash,
    role: account.role,
    is_active: true,
    id_owner: account.role === "owner" ? account.profileId : null,
    id_kasir: account.role === "kasir" ? account.profileId : null,
    id_kapster: account.role === "kapster" ? account.profileId : null,
    id_pelanggan: account.role === "pelanggan" ? account.profileId : null,
  } satisfies Prisma.akunUncheckedCreateInput;

  await transaction.akun.create({ data });
  return true;
}

async function seedProduction() {
  const result = await prisma.$transaction(async (transaction) => {
    for (const owner of owners) {
      await transaction.owner.upsert({
        where: { id_owner: owner.id_owner },
        update: {},
        create: owner,
      });
    }

    for (const cashier of cashiers) {
      await transaction.kasir.upsert({
        where: { id_kasir: cashier.id_kasir },
        update: {},
        create: cashier,
      });
    }

    for (const barber of barbers) {
      await transaction.kapster.upsert({
        where: { id_kapster: barber.id_kapster },
        update: {},
        create: barber,
      });
    }

    for (const customer of customers) {
      await transaction.pelanggan.upsert({
        where: { id_pelanggan: customer.id_pelanggan },
        update: {},
        create: customer,
      });
    }


    for (const service of services) {
      await transaction.layanan.upsert({
        where: { id_layanan: service.id_layanan },
        update: {},
        create: service,
     });
    }

    for (const product of products) {
      await transaction.produk.upsert({
        where: { id_produk: product.id_produk },
        update: {},
        create: {
          ...product,
          is_active: true,
        },
      });
    }

    let accountsCreated = 0;
    for (const account of operationalAccounts) {
      if (await ensureOperationalAccount(transaction, account)) {
        accountsCreated += 1;
      }
    }

    return { accountsCreated };
  });

  console.info(
    `Seed produksi selesai. Profil, layanan, dan produk diperiksa; ${result.accountsCreated} akun operasional dibuat.`,
  );
}

seedProduction()
  .catch((error: unknown) => {
    console.error("Seed produksi gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
