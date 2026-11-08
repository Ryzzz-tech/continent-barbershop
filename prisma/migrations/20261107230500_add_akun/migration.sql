CREATE TABLE "akun" (
    "id_akun" UUID NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "id_owner" VARCHAR(5),
    "id_kasir" VARCHAR(5),
    "id_kapster" VARCHAR(5),
    "id_pelanggan" VARCHAR(5),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "akun_pkey" PRIMARY KEY ("id_akun"),
    CONSTRAINT "akun_role_check" CHECK ("role" IN ('owner', 'kasir', 'kapster', 'pelanggan')),
    CONSTRAINT "akun_profile_role_check" CHECK (
        ("role" = 'owner' AND "id_owner" IS NOT NULL AND num_nonnulls("id_kasir", "id_kapster", "id_pelanggan") = 0)
        OR ("role" = 'kasir' AND "id_kasir" IS NOT NULL AND num_nonnulls("id_owner", "id_kapster", "id_pelanggan") = 0)
        OR ("role" = 'kapster' AND "id_kapster" IS NOT NULL AND num_nonnulls("id_owner", "id_kasir", "id_pelanggan") = 0)
        OR ("role" = 'pelanggan' AND "id_pelanggan" IS NOT NULL AND num_nonnulls("id_owner", "id_kasir", "id_kapster") = 0)
    )
);

CREATE UNIQUE INDEX "akun_email_key" ON "akun"("email");
CREATE UNIQUE INDEX "akun_id_owner_key" ON "akun"("id_owner");
CREATE UNIQUE INDEX "akun_id_kasir_key" ON "akun"("id_kasir");
CREATE UNIQUE INDEX "akun_id_kapster_key" ON "akun"("id_kapster");
CREATE UNIQUE INDEX "akun_id_pelanggan_key" ON "akun"("id_pelanggan");

ALTER TABLE "akun" ADD CONSTRAINT "fk_akun_owner"
    FOREIGN KEY ("id_owner") REFERENCES "owner"("id_owner") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "akun" ADD CONSTRAINT "fk_akun_kasir"
    FOREIGN KEY ("id_kasir") REFERENCES "kasir"("id_kasir") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "akun" ADD CONSTRAINT "fk_akun_kapster"
    FOREIGN KEY ("id_kapster") REFERENCES "kapster"("id_kapster") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "akun" ADD CONSTRAINT "fk_akun_pelanggan"
    FOREIGN KEY ("id_pelanggan") REFERENCES "pelanggan"("id_pelanggan") ON DELETE RESTRICT ON UPDATE CASCADE;
