This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.


## Production Database Preparation

The production database uses Neon PostgreSQL and Prisma ORM 7.10.0.

### 1. Environment Variables

Configure the following variables in the local environment.
Never commit actual credentials or passwords.

- `DATABASE_URL`: PostgreSQL connection URL used by the application.
- `DIRECT_URL`: Direct PostgreSQL connection URL used by Prisma CLI and production seed.
- `SESSION_SECRET`: Random secret containing at least 32 bytes.
- `PRODUCTION_SEED_OWNER_PASSWORD`
- `PRODUCTION_SEED_KASIR_PASSWORD`
- `PRODUCTION_SEED_KAPSTER_PASSWORD`
- `PRODUCTION_SEED_PELANGGAN_PASSWORD`

Production seed passwords must contain 8–72 bytes.
Password variables are required only when the corresponding operational account does not already exist.

### 2. Apply Prisma Schema to Neon

After reviewing the schema and confirming the target Neon database:

```bash
npx prisma validate
npx prisma db push
npx prisma generate
```

Do not use `--force-reset`.

### 3. Apply Additional PostgreSQL Objects

After the Prisma schema has been applied, open the Neon SQL Editor and execute:

`database/neon-production-extras.sql`

This script creates four PostgreSQL sequences and three CHECK constraints.

The script is designed to be safely executed again without resetting existing sequences or dropping database objects.

### 4. Insert Production Initial Data

Configure the required production environment variables locally.

For PowerShell:

```powershell
$env:NODE_ENV = "production"
npm.cmd run seed:production
```

The production seed creates missing operational profiles, services, products, and four operational accounts.

Existing profile and catalog records are not overwritten.
Existing operational account passwords are preserved.

### 5. Verify Production Database

Check that all 14 application tables are available.

Verify the following:

- 11 active services (L0005–L0015).
- 4 inactive legacy services (L0001–L0004).
- 5 initial products.
- Owner, cashier, barber, and customer operational accounts.
- Four PostgreSQL ID sequences.
- Three database CHECK constraints.

Example verification queries:

```sql
SELECT id_layanan, nama_layanan, durasi, harga, is_active
FROM public.layanan
ORDER BY id_layanan;

SELECT id_produk, nama_produk, stok, is_active
FROM public.produk
ORDER BY id_produk;

SELECT role, COUNT(*)
FROM public.akun
GROUP BY role
ORDER BY role;

SELECT sequence_name
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

SELECT conname
FROM pg_constraint
WHERE conrelid IN (
    'public.akun'::regclass,
    'public.penyesuaian_stok'::regclass
)
ORDER BY conname;
```

Never execute destructive database commands against production.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
