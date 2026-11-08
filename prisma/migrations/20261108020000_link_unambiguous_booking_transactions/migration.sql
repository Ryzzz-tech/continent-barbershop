WITH matching_transactions AS (
    SELECT
        t."id_transaksi",
        b."id_booking",
        COUNT(*) OVER (PARTITION BY t."id_transaksi") AS transaction_matches,
        COUNT(*) OVER (PARTITION BY b."id_booking") AS booking_matches
    FROM "transaksi" AS t
    JOIN "booking" AS b
      ON b."id_pelanggan" = t."id_pelanggan"
     AND b."tanggal_booking" = t."tanggal_transaksi"
    JOIN "detail_transaksi" AS d
      ON d."id_transaksi" = t."id_transaksi"
     AND d."id_layanan" = b."id_layanan"
    WHERE t."id_booking" IS NULL
)
UPDATE "transaksi" AS t
SET "id_booking" = m."id_booking"
FROM matching_transactions AS m
WHERE t."id_transaksi" = m."id_transaksi"
  AND m.transaction_matches = 1
  AND m.booking_matches = 1;
