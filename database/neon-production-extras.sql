
-- ============================================================
-- NEON PRODUCTION EXTRAS
-- Barbershop Continent
--
-- Jalankan setelah prisma db push berhasil.
-- Aman dijalankan berulang.
-- Tidak menghapus tabel atau mereset sequence yang sudah ada.
-- ============================================================

-- ============================================================
-- 1. BOOKING ID SEQUENCE
-- ============================================================

DO $$
DECLARE
    sequence_existed BOOLEAN;
    max_id INTEGER;
BEGIN
    sequence_existed :=
        to_regclass('public.booking_id_seq') IS NOT NULL;

    CREATE SEQUENCE IF NOT EXISTS public.booking_id_seq
        AS INTEGER
        START WITH 1
        INCREMENT BY 1
        MINVALUE 1
        MAXVALUE 9999
        NO CYCLE;

    IF NOT sequence_existed THEN
        SELECT COALESCE(
            MAX(SUBSTRING(id_booking FROM 2)::INTEGER), 0
        )
        INTO max_id
        FROM public.booking
        WHERE id_booking ~ '^B[0-9]{4}$';

        IF max_id = 0 THEN
            PERFORM setval('public.booking_id_seq', 1, false);
        ELSE
            PERFORM setval('public.booking_id_seq', max_id, true);
        END IF;
    END IF;
END $$;

-- ============================================================
-- 2. TRANSAKSI ID SEQUENCE
-- ============================================================

DO $$
DECLARE
    sequence_existed BOOLEAN;
    max_id INTEGER;
BEGIN
    sequence_existed :=
        to_regclass('public.transaksi_id_seq') IS NOT NULL;

    CREATE SEQUENCE IF NOT EXISTS public.transaksi_id_seq
        AS INTEGER
        START WITH 1
        INCREMENT BY 1
        MINVALUE 1
        MAXVALUE 9999
        NO CYCLE;

    IF NOT sequence_existed THEN
        SELECT COALESCE(
            MAX(SUBSTRING(id_transaksi FROM 2)::INTEGER), 0
        )
        INTO max_id
        FROM public.transaksi
        WHERE id_transaksi ~ '^T[0-9]{4}$';

        IF max_id = 0 THEN
            PERFORM setval('public.transaksi_id_seq', 1, false);
        ELSE
            PERFORM setval('public.transaksi_id_seq', max_id, true);
        END IF;
    END IF;
END $$;

-- ============================================================
-- 3. DETAIL TRANSAKSI ID SEQUENCE
-- ============================================================

DO $$
DECLARE
    sequence_existed BOOLEAN;
    max_id INTEGER;
BEGIN
    sequence_existed :=
        to_regclass('public.detail_transaksi_id_seq') IS NOT NULL;

    CREATE SEQUENCE IF NOT EXISTS public.detail_transaksi_id_seq
        AS INTEGER
        START WITH 1
        INCREMENT BY 1
        MINVALUE 1
        MAXVALUE 9999
        NO CYCLE;

    IF NOT sequence_existed THEN
        SELECT COALESCE(
            MAX(SUBSTRING(id_detail FROM 2)::INTEGER), 0
        )
        INTO max_id
        FROM public.detail_transaksi
        WHERE id_detail ~ '^D[0-9]{3,4}$';

        IF max_id = 0 THEN
            PERFORM setval('public.detail_transaksi_id_seq', 1, false);
        ELSE
            PERFORM setval(
                'public.detail_transaksi_id_seq', max_id, true
            );
        END IF;
    END IF;
END $$;

-- ============================================================
-- 4. JADWAL KAPSTER ID SEQUENCE
-- ============================================================

DO $$
DECLARE
    sequence_existed BOOLEAN;
    max_id INTEGER;
BEGIN
    sequence_existed :=
        to_regclass('public.jadwal_kapster_id_seq') IS NOT NULL;

    CREATE SEQUENCE IF NOT EXISTS public.jadwal_kapster_id_seq
        AS INTEGER
        START WITH 1
        INCREMENT BY 1
        MINVALUE 1
        MAXVALUE 9999
        NO CYCLE;

    IF NOT sequence_existed THEN
        SELECT COALESCE(
            MAX(SUBSTRING(id_jadwal FROM 2)::INTEGER), 0
        )
        INTO max_id
        FROM public.jadwal_kapster
        WHERE id_jadwal ~ '^J[0-9]{4}$';

        IF max_id = 0 THEN
            PERFORM setval('public.jadwal_kapster_id_seq', 1, false);
        ELSE
            PERFORM setval(
                'public.jadwal_kapster_id_seq', max_id, true
            );
        END IF;
    END IF;
END $$;

-- ============================================================
-- 5. CHECK CONSTRAINT: ROLE AKUN
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'akun_role_check'
          AND conrelid = 'public.akun'::regclass
    ) THEN
        ALTER TABLE public.akun
        ADD CONSTRAINT akun_role_check
        CHECK (
            role IN ('owner', 'kasir', 'kapster', 'pelanggan')
        );
    END IF;
END $$;

-- ============================================================
-- 6. CHECK CONSTRAINT: KESESUAIAN ROLE DAN PROFIL
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'akun_profile_role_check'
          AND conrelid = 'public.akun'::regclass
    ) THEN
        ALTER TABLE public.akun
        ADD CONSTRAINT akun_profile_role_check
        CHECK (
            (
                role = 'owner'
                AND id_owner IS NOT NULL
                AND num_nonnulls(
                    id_kasir, id_kapster, id_pelanggan
                ) = 0
            )
            OR
            (
                role = 'kasir'
                AND id_kasir IS NOT NULL
                AND num_nonnulls(
                    id_owner, id_kapster, id_pelanggan
                ) = 0
            )
            OR
            (
                role = 'kapster'
                AND id_kapster IS NOT NULL
                AND num_nonnulls(
                    id_owner, id_kasir, id_pelanggan
                ) = 0
            )
            OR
            (
                role = 'pelanggan'
                AND id_pelanggan IS NOT NULL
                AND num_nonnulls(
                    id_owner, id_kasir, id_kapster
                ) = 0
            )
        );
    END IF;
END $$;

-- ============================================================
-- 7. CHECK CONSTRAINT: JUMLAH PENYESUAIAN STOK
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'penyesuaian_stok_jumlah_check'
          AND conrelid = 'public.penyesuaian_stok'::regclass
    ) THEN
        ALTER TABLE public.penyesuaian_stok
        ADD CONSTRAINT penyesuaian_stok_jumlah_check
        CHECK (jumlah > 0);
    END IF;
END $$;

-- ============================================================
-- SELESAI
-- ============================================================
