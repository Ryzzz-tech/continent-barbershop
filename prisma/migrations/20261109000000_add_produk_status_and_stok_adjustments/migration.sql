ALTER TABLE "produk"
ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "penyesuaian_stok" (
    "id_penyesuaian_stok" VARCHAR(5) PRIMARY KEY,
    "tanggal" DATE NOT NULL,
    "jenis" VARCHAR(20) NOT NULL,
    "jumlah" INTEGER NOT NULL CHECK ("jumlah" > 0),
    "alasan" VARCHAR(100) NOT NULL,
    "stok_sebelum" INTEGER NOT NULL,
    "stok_sesudah" INTEGER NOT NULL,
    "id_produk" VARCHAR(5) NOT NULL,
    "id_owner" VARCHAR(5) NOT NULL,
    CONSTRAINT "fk_penyesuaian_stok_produk"
        FOREIGN KEY ("id_produk") REFERENCES "produk"("id_produk")
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT "fk_penyesuaian_stok_owner"
        FOREIGN KEY ("id_owner") REFERENCES "owner"("id_owner")
        ON UPDATE CASCADE ON DELETE RESTRICT
);
