DROP TABLE IF EXISTS detail_restok;
DROP TABLE IF EXISTS restok;
DROP TABLE IF EXISTS detail_transaksi;
DROP TABLE IF EXISTS transaksi;
DROP TABLE IF EXISTS jadwal_kapster;
DROP TABLE IF EXISTS booking;
DROP TABLE IF EXISTS produk;
DROP TABLE IF EXISTS layanan;
DROP TABLE IF EXISTS owner;
DROP TABLE IF EXISTS kasir;
DROP TABLE IF EXISTS kapster;
DROP TABLE IF EXISTS pelanggan;

-- ============================================================
-- 1. TABEL INDUK
-- ============================================================

CREATE TABLE pelanggan (
    id_pelanggan VARCHAR(5) PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    no_hp VARCHAR(13) NOT NULL UNIQUE,
    alamat VARCHAR(500) NOT NULL,
    tanggal_daftar DATE NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE kasir (
    id_kasir VARCHAR(5) PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    no_hp VARCHAR(13) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE kapster (
    id_kapster VARCHAR(5) PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    no_hp VARCHAR(13) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE layanan (
    id_layanan VARCHAR(5) PRIMARY KEY,
    nama_layanan VARCHAR(100) NOT NULL,
    durasi INTEGER NOT NULL,
    harga DECIMAL(12,2) NOT NULL
);

CREATE TABLE produk (
    id_produk VARCHAR(5) PRIMARY KEY,
    nama_produk VARCHAR(100) NOT NULL,
    harga DECIMAL(12,2) NOT NULL,
    stok INTEGER NOT NULL,
    satuan VARCHAR(20) NOT NULL
);

CREATE TABLE owner (
    id_owner VARCHAR(5) PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    no_hp VARCHAR(13) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE
);

-- ============================================================
-- 2. TABEL TRANSAKSI DAN TABEL YANG MEMILIKI FOREIGN KEY
-- ============================================================

CREATE TABLE booking (
    id_booking VARCHAR(5) PRIMARY KEY,
    tanggal_booking DATE NOT NULL,
    jam_booking TIME(7) NOT NULL,
    status VARCHAR(20) NOT NULL,
    catatan VARCHAR(100),
    id_pelanggan VARCHAR(5) NOT NULL,
    id_kapster VARCHAR(5) NOT NULL,
    id_layanan VARCHAR(5) NOT NULL,
    id_kasir VARCHAR(5) NOT NULL,
    CONSTRAINT fk_booking_pelanggan FOREIGN KEY (id_pelanggan)
        REFERENCES pelanggan(id_pelanggan) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_booking_kapster FOREIGN KEY (id_kapster)
        REFERENCES kapster(id_kapster) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_booking_layanan FOREIGN KEY (id_layanan)
        REFERENCES layanan(id_layanan) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_booking_kasir FOREIGN KEY (id_kasir)
        REFERENCES kasir(id_kasir) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE jadwal_kapster (
    id_jadwal VARCHAR(5) PRIMARY KEY,
    tanggal DATE NOT NULL,
    jam_mulai TIME(7) NOT NULL,
    jam_selesai TIME(7) NOT NULL,
    status VARCHAR(20) NOT NULL,
    id_kapster VARCHAR(5) NOT NULL,
    id_kasir VARCHAR(5) NOT NULL,
    CONSTRAINT fk_jadwal_kapster FOREIGN KEY (id_kapster)
        REFERENCES kapster(id_kapster) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_jadwal_kasir FOREIGN KEY (id_kasir)
        REFERENCES kasir(id_kasir) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE transaksi (
    id_transaksi VARCHAR(5) PRIMARY KEY,
    tanggal_transaksi DATE NOT NULL,
    total_harga DECIMAL(12,2) NOT NULL,
    metode_pembayaran VARCHAR(30) NOT NULL,
    status_pembayaran VARCHAR(20) NOT NULL,
    id_pelanggan VARCHAR(5) NOT NULL,
    id_kasir VARCHAR(5) NOT NULL,
    CONSTRAINT fk_transaksi_pelanggan FOREIGN KEY (id_pelanggan)
        REFERENCES pelanggan(id_pelanggan) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_transaksi_kasir FOREIGN KEY (id_kasir)
        REFERENCES kasir(id_kasir) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE detail_transaksi (
    id_detail VARCHAR(5) PRIMARY KEY,
    jenis_item VARCHAR(20) NOT NULL,
    jumlah INTEGER NOT NULL,
    harga_satuan DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    id_transaksi VARCHAR(5) NOT NULL,
    id_layanan VARCHAR(5),
    id_produk VARCHAR(5),
    CONSTRAINT fk_detail_transaksi_transaksi FOREIGN KEY (id_transaksi)
        REFERENCES transaksi(id_transaksi) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_detail_transaksi_layanan FOREIGN KEY (id_layanan)
        REFERENCES layanan(id_layanan) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_detail_transaksi_produk FOREIGN KEY (id_produk)
        REFERENCES produk(id_produk) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE restok (
    id_restok VARCHAR(5) PRIMARY KEY,
    tanggal_restok DATE NOT NULL,
    keterangan VARCHAR(200),
    id_owner VARCHAR(5) NOT NULL,
    CONSTRAINT fk_restok_owner FOREIGN KEY (id_owner)
        REFERENCES owner(id_owner) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE detail_restok (
    id_detail_restok VARCHAR(5) PRIMARY KEY,
    jumlah INTEGER NOT NULL,
    harga_beli_satuan DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    id_produk VARCHAR(5) NOT NULL,
    id_restok VARCHAR(5) NOT NULL,
    CONSTRAINT fk_detail_restok_produk FOREIGN KEY (id_produk)
        REFERENCES produk(id_produk) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_detail_restok_restok FOREIGN KEY (id_restok)
        REFERENCES restok(id_restok) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ============================================================
-- 3. DATA AWAL (DUMMY DATA) DARI LEMBAR 3NF
-- ============================================================

INSERT INTO pelanggan (id_pelanggan, nama, no_hp, alamat, tanggal_daftar, email) VALUES
('P0001', 'Alya Putri', '6281234567801', 'Padang', '2026-10-01', 'alya.putri@example.com'),
('P0002', 'Fajar Ramadhan', '6281234567802', 'Koto Tangah, Padang', '2026-09-25', 'fajar.r@example.com'),
('P0003', 'Nadia Safitri', '6281234567803', 'Padang Barat', '2026-10-05', 'nadia.s@example.com'),
('P0004', 'Dimas Prakoso', '6281234567804', 'Lubuk Begalung', '2026-10-08', 'dimas.p@example.com'),
('P0005', 'Intan Permata', '6281234567805', 'Pauh, Padang', '2026-10-10', 'intan.p@example.com');

INSERT INTO kasir (id_kasir, nama, no_hp, email) VALUES
('KS001', 'Dina Rahma', '6281234567821', 'dina.kasir@example.com'),
('KS002', 'Rafi Maulana', '6281234567822', 'rafi.kasir@example.com');

INSERT INTO kapster (id_kapster, nama, no_hp, status, email) VALUES
('K0001', 'Rizky Pratama', '6281234567811', 'Aktif', 'rizky.kapster@example.com'),
('K0002', 'Andi Saputra', '6281234567812', 'Aktif', 'andi.kapster@example.com'),
('K0003', 'Fikri Hidayat', '6281234567813', 'Aktif', 'fikri.kapster@example.com');

-- ID layanan L0002-L0004 mengikuti referensi yang sudah digunakan
-- oleh data Booking dan Detail Transaksi pada lembar 3NF.
INSERT INTO layanan (id_layanan, nama_layanan, durasi, harga) VALUES
('L0001', 'Haircut', 30, 50000),
('L0002', 'Haircut', 45, 70000),
('L0003', 'Haircut', 20, 30000),
('L0004', 'Haircut', 90, 150000);

INSERT INTO produk (id_produk, nama_produk, harga, stok, satuan) VALUES
('PR001', 'Pomade Mini', 25000, 18, 'pcs'),
('PR002', 'Hair Tonic', 35000, 12, 'botol'),
('PR003', 'Shampoo', 40000, 20, 'botol'),
('PR004', 'Clay', 30000, 9, 'pcs'),
('PR005', 'Hair Serum', 45000, 15, 'botol');

INSERT INTO owner (id_owner, nama, no_hp, email) VALUES
('O001', 'Budi Santoso', '6281234567831', 'budi.owner@example.com'),
('O002', 'Sari Wulandari', '6281234567832', 'sari.owner@example.com');

INSERT INTO booking (id_booking, tanggal_booking, jam_booking, status, catatan,
                     id_pelanggan, id_kapster, id_layanan, id_kasir) VALUES
('B0001', '2026-10-18', '10:00:00', 'Selesai', 'Potong pendek', 'P0001', 'K0001', 'L0001', 'KS001'),
('B0002', '2026-10-18', '11:00:00', 'Dikonfirmasi', 'Minta kapster tertentu', 'P0002', 'K0002', 'L0001', 'KS002'),
('B0003', '2026-10-19', '13:30:00', 'Menunggu', 'Tidak ada catatan', 'P0003', 'K0001', 'L0001', 'KS001'),
('B0004', '2026-10-19', '15:00:00', 'Dibatalkan', 'Berhalangan hadir', 'P0004', 'K0003', 'L0001', 'KS002'),
('B0005', '2026-10-20', '09:30:00', 'Dikonfirmasi', 'Minta selesai sebelum siang', 'P0005', 'K0002', 'L0004', 'KS001');

INSERT INTO jadwal_kapster (id_jadwal, tanggal, jam_mulai, jam_selesai, status, id_kapster, id_kasir) VALUES
('J0001', '2026-10-18', '09:00:00', '10:00:00', 'Tersedia', 'K0001', 'KS001'),
('J0002', '2026-10-18', '10:00:00', '11:00:00', 'Tersedia', 'K0002', 'KS002'),
('J0003', '2026-10-19', '09:00:00', '10:30:00', 'Tersedia', 'K0001', 'KS001'),
('J0004', '2026-10-19', '11:00:00', '12:00:00', 'Tersedia', 'K0003', 'KS002'),
('J0005', '2026-10-20', '09:00:00', '10:15:00', 'Tersedia', 'K0002', 'KS001');

INSERT INTO transaksi (id_transaksi, tanggal_transaksi, total_harga, metode_pembayaran,
                       status_pembayaran, id_pelanggan, id_kasir) VALUES
('T0001', '2026-10-18', 75000, 'QRIS', 'Lunas', 'P0001', 'KS001'),
('T0002', '2026-10-18', 70000, 'Tunai', 'Lunas', 'P0002', 'KS002'),
('T0003', '2026-10-19', 30000, 'QRIS', 'Menunggu', 'P0003', 'KS001'),
('T0004', '2026-10-19', 50000, 'Tunai', 'Belum dibayar', 'P0004', 'KS002'),
('T0005', '2026-10-20', 150000, 'QRIS', 'Menunggu', 'P0005', 'KS001');

INSERT INTO detail_transaksi (id_detail, jenis_item, jumlah, harga_satuan, total,
                              id_transaksi, id_layanan, id_produk) VALUES
('D001', 'Jasa', 1, 50000, 50000, 'T0001', 'L0001', NULL),
('D002', 'Produk', 1, 25000, 25000, 'T0001', NULL, 'PR001'),
('D003', 'Jasa', 1, 70000, 70000, 'T0002', 'L0002', NULL),
('D004', 'Jasa', 1, 30000, 30000, 'T0003', 'L0003', NULL),
('D005', 'Jasa', 1, 50000, 50000, 'T0004', 'L0001', NULL),
('D006', 'Jasa', 1, 150000, 150000, 'T0005', 'L0004', NULL);

INSERT INTO restok (id_restok, tanggal_restok, keterangan, id_owner) VALUES
('R0001', '2026-10-17', 'Restok produk pomade', 'O001'),
('R0002', '2026-10-16', 'Pengadaan hair tonic', 'O001'),
('R0003', '2026-10-15', 'Restok shampoo', 'O002'),
('R0004', '2026-10-14', 'Restok clay', 'O002'),
('R0005', '2026-10-13', 'Restok hair serum', 'O001');

INSERT INTO detail_restok (id_detail_restok, jumlah, harga_beli_satuan, subtotal, id_produk, id_restok) VALUES
('DR001', 10, 15000, 150000, 'PR001', 'R0001'),
('DR002', 5, 20000, 100000, 'PR002', 'R0001'),
('DR003', 12, 22000, 264000, 'PR002', 'R0002'),
('DR004', 8, 27000, 216000, 'PR003', 'R0003'),
('DR005', 6, 18000, 108000, 'PR004', 'R0004'),
('DR006', 10, 30000, 300000, 'PR005', 'R0005');

-- ============================================================
-- 4. PEMERIKSAAN JUMLAH DATA
-- ============================================================
SELECT 'pelanggan' AS nama_tabel, COUNT(*) AS jumlah_data FROM pelanggan
UNION ALL SELECT 'kasir', COUNT(*) FROM kasir
UNION ALL SELECT 'kapster', COUNT(*) FROM kapster
UNION ALL SELECT 'layanan', COUNT(*) FROM layanan
UNION ALL SELECT 'produk', COUNT(*) FROM produk
UNION ALL SELECT 'owner', COUNT(*) FROM owner
UNION ALL SELECT 'booking', COUNT(*) FROM booking
UNION ALL SELECT 'jadwal_kapster', COUNT(*) FROM jadwal_kapster
UNION ALL SELECT 'transaksi', COUNT(*) FROM transaksi
UNION ALL SELECT 'detail_transaksi', COUNT(*) FROM detail_transaksi
UNION ALL SELECT 'restok', COUNT(*) FROM restok
UNION ALL SELECT 'detail_restok', COUNT(*) FROM detail_restok
ORDER BY nama_tabel;
