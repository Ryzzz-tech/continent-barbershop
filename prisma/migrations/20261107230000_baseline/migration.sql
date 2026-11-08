-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "booking" (
    "id_booking" VARCHAR(5) NOT NULL,
    "tanggal_booking" DATE NOT NULL,
    "jam_booking" TIME(6) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "catatan" VARCHAR(100),
    "id_pelanggan" VARCHAR(5) NOT NULL,
    "id_kapster" VARCHAR(5) NOT NULL,
    "id_layanan" VARCHAR(5) NOT NULL,
    "id_kasir" VARCHAR(5) NOT NULL,

    CONSTRAINT "booking_pkey" PRIMARY KEY ("id_booking")
);

-- CreateTable
CREATE TABLE "detail_restok" (
    "id_detail_restok" VARCHAR(5) NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "harga_beli_satuan" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "id_produk" VARCHAR(5) NOT NULL,
    "id_restok" VARCHAR(5) NOT NULL,

    CONSTRAINT "detail_restok_pkey" PRIMARY KEY ("id_detail_restok")
);

-- CreateTable
CREATE TABLE "detail_transaksi" (
    "id_detail" VARCHAR(5) NOT NULL,
    "jenis_item" VARCHAR(20) NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "harga_satuan" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "id_transaksi" VARCHAR(5) NOT NULL,
    "id_layanan" VARCHAR(5),
    "id_produk" VARCHAR(5),

    CONSTRAINT "detail_transaksi_pkey" PRIMARY KEY ("id_detail")
);

-- CreateTable
CREATE TABLE "jadwal_kapster" (
    "id_jadwal" VARCHAR(5) NOT NULL,
    "tanggal" DATE NOT NULL,
    "jam_mulai" TIME(6) NOT NULL,
    "jam_selesai" TIME(6) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "id_kapster" VARCHAR(5) NOT NULL,
    "id_kasir" VARCHAR(5) NOT NULL,

    CONSTRAINT "jadwal_kapster_pkey" PRIMARY KEY ("id_jadwal")
);

-- CreateTable
CREATE TABLE "kapster" (
    "id_kapster" VARCHAR(5) NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "no_hp" VARCHAR(13) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "email" VARCHAR(100) NOT NULL,

    CONSTRAINT "kapster_pkey" PRIMARY KEY ("id_kapster")
);

-- CreateTable
CREATE TABLE "kasir" (
    "id_kasir" VARCHAR(5) NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "no_hp" VARCHAR(13) NOT NULL,
    "email" VARCHAR(100) NOT NULL,

    CONSTRAINT "kasir_pkey" PRIMARY KEY ("id_kasir")
);

-- CreateTable
CREATE TABLE "layanan" (
    "id_layanan" VARCHAR(5) NOT NULL,
    "nama_layanan" VARCHAR(100) NOT NULL,
    "durasi" INTEGER NOT NULL,
    "harga" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "layanan_pkey" PRIMARY KEY ("id_layanan")
);

-- CreateTable
CREATE TABLE "owner" (
    "id_owner" VARCHAR(5) NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "no_hp" VARCHAR(13) NOT NULL,
    "email" VARCHAR(100) NOT NULL,

    CONSTRAINT "owner_pkey" PRIMARY KEY ("id_owner")
);

-- CreateTable
CREATE TABLE "pelanggan" (
    "id_pelanggan" VARCHAR(5) NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "no_hp" VARCHAR(13) NOT NULL,
    "alamat" VARCHAR(500) NOT NULL,
    "tanggal_daftar" DATE NOT NULL,
    "email" VARCHAR(100) NOT NULL,

    CONSTRAINT "pelanggan_pkey" PRIMARY KEY ("id_pelanggan")
);

-- CreateTable
CREATE TABLE "produk" (
    "id_produk" VARCHAR(5) NOT NULL,
    "nama_produk" VARCHAR(100) NOT NULL,
    "harga" DECIMAL(12,2) NOT NULL,
    "stok" INTEGER NOT NULL,
    "satuan" VARCHAR(20) NOT NULL,

    CONSTRAINT "produk_pkey" PRIMARY KEY ("id_produk")
);

-- CreateTable
CREATE TABLE "restok" (
    "id_restok" VARCHAR(5) NOT NULL,
    "tanggal_restok" DATE NOT NULL,
    "keterangan" VARCHAR(200),
    "id_owner" VARCHAR(5) NOT NULL,

    CONSTRAINT "restok_pkey" PRIMARY KEY ("id_restok")
);

-- CreateTable
CREATE TABLE "transaksi" (
    "id_transaksi" VARCHAR(5) NOT NULL,
    "tanggal_transaksi" DATE NOT NULL,
    "total_harga" DECIMAL(12,2) NOT NULL,
    "metode_pembayaran" VARCHAR(30) NOT NULL,
    "status_pembayaran" VARCHAR(20) NOT NULL,
    "id_pelanggan" VARCHAR(5) NOT NULL,
    "id_kasir" VARCHAR(5) NOT NULL,

    CONSTRAINT "transaksi_pkey" PRIMARY KEY ("id_transaksi")
);

-- CreateIndex
CREATE UNIQUE INDEX "kapster_no_hp_key" ON "kapster"("no_hp");

-- CreateIndex
CREATE UNIQUE INDEX "kapster_email_key" ON "kapster"("email");

-- CreateIndex
CREATE UNIQUE INDEX "kasir_no_hp_key" ON "kasir"("no_hp");

-- CreateIndex
CREATE UNIQUE INDEX "kasir_email_key" ON "kasir"("email");

-- CreateIndex
CREATE UNIQUE INDEX "owner_no_hp_key" ON "owner"("no_hp");

-- CreateIndex
CREATE UNIQUE INDEX "owner_email_key" ON "owner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pelanggan_no_hp_key" ON "pelanggan"("no_hp");

-- CreateIndex
CREATE UNIQUE INDEX "pelanggan_email_key" ON "pelanggan"("email");

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "fk_booking_kapster" FOREIGN KEY ("id_kapster") REFERENCES "kapster"("id_kapster") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "fk_booking_kasir" FOREIGN KEY ("id_kasir") REFERENCES "kasir"("id_kasir") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "fk_booking_layanan" FOREIGN KEY ("id_layanan") REFERENCES "layanan"("id_layanan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "fk_booking_pelanggan" FOREIGN KEY ("id_pelanggan") REFERENCES "pelanggan"("id_pelanggan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_restok" ADD CONSTRAINT "fk_detail_restok_produk" FOREIGN KEY ("id_produk") REFERENCES "produk"("id_produk") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_restok" ADD CONSTRAINT "fk_detail_restok_restok" FOREIGN KEY ("id_restok") REFERENCES "restok"("id_restok") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_transaksi" ADD CONSTRAINT "fk_detail_transaksi_layanan" FOREIGN KEY ("id_layanan") REFERENCES "layanan"("id_layanan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_transaksi" ADD CONSTRAINT "fk_detail_transaksi_produk" FOREIGN KEY ("id_produk") REFERENCES "produk"("id_produk") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_transaksi" ADD CONSTRAINT "fk_detail_transaksi_transaksi" FOREIGN KEY ("id_transaksi") REFERENCES "transaksi"("id_transaksi") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_kapster" ADD CONSTRAINT "fk_jadwal_kapster" FOREIGN KEY ("id_kapster") REFERENCES "kapster"("id_kapster") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_kapster" ADD CONSTRAINT "fk_jadwal_kasir" FOREIGN KEY ("id_kasir") REFERENCES "kasir"("id_kasir") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restok" ADD CONSTRAINT "fk_restok_owner" FOREIGN KEY ("id_owner") REFERENCES "owner"("id_owner") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "fk_transaksi_kasir" FOREIGN KEY ("id_kasir") REFERENCES "kasir"("id_kasir") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "fk_transaksi_pelanggan" FOREIGN KEY ("id_pelanggan") REFERENCES "pelanggan"("id_pelanggan") ON DELETE RESTRICT ON UPDATE CASCADE;
