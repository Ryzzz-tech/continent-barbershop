ALTER TABLE "booking"
    ALTER COLUMN "id_kasir" DROP NOT NULL,
    ADD COLUMN "nama_layanan_snapshot" VARCHAR(100),
    ADD COLUMN "harga_snapshot" DECIMAL(12,2),
    ADD COLUMN "durasi_snapshot" INTEGER,
    ADD COLUMN "catatan_status" VARCHAR(100);

UPDATE "booking" AS b
SET "nama_layanan_snapshot" = l."nama_layanan",
    "harga_snapshot" = l."harga",
    "durasi_snapshot" = l."durasi"
FROM "layanan" AS l
WHERE b."id_layanan" = l."id_layanan";

ALTER TABLE "jadwal_kapster"
    ALTER COLUMN "id_kasir" DROP NOT NULL,
    ADD COLUMN "catatan" VARCHAR(100);

ALTER TABLE "transaksi"
    ALTER COLUMN "id_kasir" DROP NOT NULL,
    ADD COLUMN "id_booking" VARCHAR(5);

CREATE UNIQUE INDEX "transaksi_id_booking_key" ON "transaksi"("id_booking");

ALTER TABLE "transaksi"
    ADD CONSTRAINT "fk_transaksi_booking"
    FOREIGN KEY ("id_booking") REFERENCES "booking"("id_booking")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "detail_transaksi"
    ADD COLUMN "nama_item_snapshot" VARCHAR(100);

UPDATE "detail_transaksi" AS d
SET "nama_item_snapshot" = CASE
    WHEN d."id_layanan" IS NOT NULL THEN (
        SELECT l."nama_layanan" FROM "layanan" AS l
        WHERE l."id_layanan" = d."id_layanan"
    )
    WHEN d."id_produk" IS NOT NULL THEN (
        SELECT p."nama_produk" FROM "produk" AS p
        WHERE p."id_produk" = d."id_produk"
    )
    ELSE NULL
END;

ALTER TABLE "layanan"
    ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

UPDATE "layanan" SET "is_active" = false;

INSERT INTO "layanan" ("id_layanan", "nama_layanan", "durasi", "harga", "is_active") VALUES
    ('L0005', 'Regular Haircut', 30, 50000, true),
    ('L0006', 'Premium Haircut', 45, 70000, true),
    ('L0007', 'Full Service', 60, 125000, true),
    ('L0008', 'Hair Styling', 20, 20000, true),
    ('L0009', 'Creambath', 45, 80000, true),
    ('L0010', 'Creambath + Facial Steam', 60, 100000, true),
    ('L0011', 'Creambath + Full Facial', 90, 160000, true),
    ('L0012', 'Perming (Keriting Rambut)', 120, 150000, true),
    ('L0013', 'Hair Colour', 90, 100000, true),
    ('L0014', 'Highlight', 120, 250000, true),
    ('L0015', 'Home Service', 90, 100000, true);

CREATE SEQUENCE "booking_id_seq" AS INTEGER;
SELECT setval(
    '"booking_id_seq"',
    COALESCE(MAX(SUBSTRING("id_booking" FROM 2)::INTEGER), 1),
    MAX(SUBSTRING("id_booking" FROM 2)::INTEGER) IS NOT NULL
)
FROM "booking"
WHERE "id_booking" ~ '^B[0-9]{4}$';

CREATE SEQUENCE "transaksi_id_seq" AS INTEGER;
SELECT setval(
    '"transaksi_id_seq"',
    COALESCE(MAX(SUBSTRING("id_transaksi" FROM 2)::INTEGER), 1),
    MAX(SUBSTRING("id_transaksi" FROM 2)::INTEGER) IS NOT NULL
)
FROM "transaksi"
WHERE "id_transaksi" ~ '^T[0-9]{4}$';

CREATE SEQUENCE "detail_transaksi_id_seq" AS INTEGER;
SELECT setval(
    '"detail_transaksi_id_seq"',
    COALESCE(MAX(SUBSTRING("id_detail" FROM 2)::INTEGER), 1),
    MAX(SUBSTRING("id_detail" FROM 2)::INTEGER) IS NOT NULL
)
FROM "detail_transaksi"
WHERE "id_detail" ~ '^D[0-9]{3,4}$';

CREATE SEQUENCE "jadwal_kapster_id_seq" AS INTEGER;
SELECT setval(
    '"jadwal_kapster_id_seq"',
    COALESCE(MAX(SUBSTRING("id_jadwal" FROM 2)::INTEGER), 1),
    MAX(SUBSTRING("id_jadwal" FROM 2)::INTEGER) IS NOT NULL
)
FROM "jadwal_kapster"
WHERE "id_jadwal" ~ '^J[0-9]{4}$';
