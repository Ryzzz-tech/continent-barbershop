ALTER TABLE "layanan"
ADD COLUMN "deskripsi" TEXT;

UPDATE "layanan"
SET "deskripsi" = CASE "id_layanan"
    WHEN 'L0005' THEN 'Haircut, Hairwash, Tonic, Massage, Styling, Hair Product.'
    WHEN 'L0006' THEN 'Haircut, Hairwash, Tonic, Massage, Facial Steam, Styling, Hair Product.'
    WHEN 'L0007' THEN 'Haircut, Hairwash, Tonic, Massage, Facial Steam, Mask, Styling.'
    WHEN 'L0008' THEN 'Hair Wash, Tonic, Massage, Hair Styling, Hair Product.'
END
WHERE "id_layanan" IN ('L0005', 'L0006', 'L0007', 'L0008');