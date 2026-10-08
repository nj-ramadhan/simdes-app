-- =============================================
-- SKEMA DATABASE simdes (PostgreSQL / Neon)
-- Jalankan file ini di Neon SQL Editor (dashboard) sekali saja
-- untuk membuat semua tabel.
-- =============================================

CREATE TABLE IF NOT EXISTS rw (
  id_rw INTEGER PRIMARY KEY,
  nama_rw TEXT,
  alamat TEXT,
  admin_rw_user_id TEXT
);

CREATE TABLE IF NOT EXISTS rt (
  id_rt INTEGER PRIMARY KEY,
  id_rw INTEGER REFERENCES rw(id_rw),
  nama_rt TEXT,
  admin_rt_user_id TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id_user TEXT PRIMARY KEY,
  nama TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('rw_admin','rt_admin','warga')),
  id_rt INTEGER,
  id_rw INTEGER,
  status TEXT DEFAULT 'aktif',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==== Data Sosial Kependudukan ====

CREATE TABLE IF NOT EXISTS sensus (
  id_warga TEXT PRIMARY KEY,
  id_rt INTEGER,
  nik TEXT,
  nama TEXT,
  jenis_kelamin TEXT,
  tgl_lahir DATE,
  pekerjaan TEXT,
  status_kk TEXT,
  no_kk TEXT,
  alamat TEXT,
  no_hp TEXT,
  foto_url TEXT,
  keterangan_khusus TEXT
);

ALTER TABLE sensus ADD COLUMN IF NOT EXISTS id_rw INTEGER;
ALTER TABLE sensus ADD COLUMN IF NOT EXISTS keterangan_khusus TEXT;

CREATE TABLE IF NOT EXISTS jompo (
  id TEXT REFERENCES sensus(id_warga),
  id_warga TEXT,
  id_rt INTEGER,
  usia INT,
  kondisi_kesehatan TEXT,
  penanggung_jawab TEXT,
  kebutuhan_khusus TEXT
);

CREATE TABLE IF NOT EXISTS anak (
  id TEXT REFERENCES sensus(id_warga),
  id_warga TEXT,
  id_rt INTEGER,
  tgl_lahir DATE,
  sekolah TEXT,
  jenjang TEXT,
  nama_ortu TEXT
);

CREATE TABLE IF NOT EXISTS inklusi (
  id TEXT REFERENCES sensus(id_warga),
  id_warga TEXT,
  id_rt INTEGER,
  jenis_disabilitas TEXT,
  kebutuhan_bantuan TEXT,
  alat_bantu TEXT
);

-- ==== Data Lingkungan & Aset ====

CREATE TABLE IF NOT EXISTS perusahaan (
  id TEXT PRIMARY KEY,
  id_rt INTEGER,
  nama_usaha TEXT,
  jenis_usaha TEXT,
  pemilik TEXT,
  alamat TEXT,
  status_izin TEXT
);

CREATE TABLE IF NOT EXISTS lingkungan (
  id TEXT PRIMARY KEY,
  id_rw INTEGER,
  id_rt INTEGER,
  kategori TEXT,
  lokasi TEXT,
  kondisi TEXT,
  tgl_laporan DATE,
  aduan_id TEXT,
  nama_pelapor TEXT,
  no_hp_pelapor TEXT
);

CREATE TABLE IF NOT EXISTS infrastruktur (
  id TEXT PRIMARY KEY,
  id_rw INTEGER,
  id_rt INTEGER,
  jenis TEXT,
  lokasi TEXT,
  kondisi TEXT,
  tahun_bangun INT,
  aduan_id TEXT,
  nama_pelapor TEXT,
  no_hp_pelapor TEXT
);

CREATE TABLE IF NOT EXISTS aset (
  id TEXT PRIMARY KEY,
  id_rw INTEGER,
  id_rt INTEGER,
  nama_aset TEXT,
  kategori TEXT,
  jumlah INT,
  kondisi TEXT,
  lokasi_simpan TEXT,
  nilai_perolehan NUMERIC,
  aduan_id TEXT,
  nama_pelapor TEXT,
  no_hp_pelapor TEXT
);

-- ==== Laporan Kegiatan dan Dokumentasi ====

CREATE TABLE IF NOT EXISTS kegiatan (
  id TEXT PRIMARY KEY,
  id_rw INTEGER,
  id_rt INTEGER,
  judul TEXT NOT NULL,
  tanggal DATE NOT NULL,
  lokasi TEXT,
  deskripsi TEXT NOT NULL,
  dokumentasi JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==== Modul Keuangan (6 jenis, struktur seragam) ====
-- Nama tabel HARUS persis: keuangan_global, keuangan_sampah, keuangan_keamanan,
-- keuangan_danasosial, keuangan_danakematian, keuangan_kompensasi
-- (mengikuti hasil lowercase dari SHEET_MAP di api/keuangan/[jenis]/index.js)

CREATE TABLE IF NOT EXISTS keuangan_global (
  id TEXT PRIMARY KEY,
  id_rw INTEGER,
  id_rt INTEGER,
  tanggal DATE,
  tipe TEXT CHECK (tipe IN ('masuk','keluar')),
  kategori TEXT,
  jumlah NUMERIC,
  keterangan TEXT,
  bukti_url TEXT,
  dicatat_oleh TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS keuangan_sampah (LIKE keuangan_global INCLUDING ALL);
CREATE TABLE IF NOT EXISTS keuangan_keamanan (LIKE keuangan_global INCLUDING ALL);
CREATE TABLE IF NOT EXISTS keuangan_danasosial (LIKE keuangan_global INCLUDING ALL);
CREATE TABLE IF NOT EXISTS keuangan_danakematian (LIKE keuangan_global INCLUDING ALL);
CREATE TABLE IF NOT EXISTS keuangan_kompensasi (LIKE keuangan_global INCLUDING ALL);

ALTER TABLE keuangan_global ADD COLUMN IF NOT EXISTS id_warga TEXT;
ALTER TABLE keuangan_global ADD COLUMN IF NOT EXISTS nama_warga TEXT;
ALTER TABLE keuangan_sampah ADD COLUMN IF NOT EXISTS id_warga TEXT;
ALTER TABLE keuangan_sampah ADD COLUMN IF NOT EXISTS nama_warga TEXT;
ALTER TABLE keuangan_keamanan ADD COLUMN IF NOT EXISTS id_warga TEXT;
ALTER TABLE keuangan_keamanan ADD COLUMN IF NOT EXISTS nama_warga TEXT;
ALTER TABLE keuangan_danasosial ADD COLUMN IF NOT EXISTS id_warga TEXT;
ALTER TABLE keuangan_danasosial ADD COLUMN IF NOT EXISTS nama_warga TEXT;
ALTER TABLE keuangan_danakematian ADD COLUMN IF NOT EXISTS id_warga TEXT;
ALTER TABLE keuangan_danakematian ADD COLUMN IF NOT EXISTS nama_warga TEXT;
ALTER TABLE keuangan_kompensasi ADD COLUMN IF NOT EXISTS id_warga TEXT;
ALTER TABLE keuangan_kompensasi ADD COLUMN IF NOT EXISTS nama_warga TEXT;

CREATE TABLE IF NOT EXISTS aduan (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  no_hp TEXT,
  kategori TEXT NOT NULL,
  id_rw INTEGER,
  id_rt INTEGER,
  lokasi TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'baru',
  created_at TIMESTAMPTZ DEFAULT now()
);
