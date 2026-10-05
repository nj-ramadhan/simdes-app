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