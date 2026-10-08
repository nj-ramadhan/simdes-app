-- Create public complaint storage and link routed reports to category records.
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

ALTER TABLE aduan ADD COLUMN IF NOT EXISTS no_hp TEXT;
ALTER TABLE aduan ADD COLUMN IF NOT EXISTS id_rw INTEGER;
ALTER TABLE aduan ADD COLUMN IF NOT EXISTS id_rt INTEGER;
ALTER TABLE aduan ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'baru';
ALTER TABLE aduan ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE lingkungan ADD COLUMN IF NOT EXISTS aduan_id TEXT;
ALTER TABLE lingkungan ADD COLUMN IF NOT EXISTS nama_pelapor TEXT;
ALTER TABLE lingkungan ADD COLUMN IF NOT EXISTS no_hp_pelapor TEXT;

ALTER TABLE infrastruktur ADD COLUMN IF NOT EXISTS aduan_id TEXT;
ALTER TABLE infrastruktur ADD COLUMN IF NOT EXISTS nama_pelapor TEXT;
ALTER TABLE infrastruktur ADD COLUMN IF NOT EXISTS no_hp_pelapor TEXT;

ALTER TABLE aset ADD COLUMN IF NOT EXISTS aduan_id TEXT;
ALTER TABLE aset ADD COLUMN IF NOT EXISTS nama_pelapor TEXT;
ALTER TABLE aset ADD COLUMN IF NOT EXISTS no_hp_pelapor TEXT;

-- Preserve any legacy complaint descriptions before removing the redundant fields.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lingkungan' AND column_name = 'deskripsi_aduan') THEN
    UPDATE lingkungan SET kondisi = CASE WHEN kondisi IS NULL OR kondisi = 'Aduan warga' THEN deskripsi_aduan WHEN kondisi = deskripsi_aduan THEN kondisi ELSE concat_ws(E'\n', kondisi, deskripsi_aduan) END WHERE deskripsi_aduan IS NOT NULL;
    ALTER TABLE lingkungan DROP COLUMN deskripsi_aduan;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'infrastruktur' AND column_name = 'deskripsi_aduan') THEN
    UPDATE infrastruktur SET kondisi = CASE WHEN kondisi IS NULL OR kondisi = 'Aduan warga' THEN deskripsi_aduan WHEN kondisi = deskripsi_aduan THEN kondisi ELSE concat_ws(E'\n', kondisi, deskripsi_aduan) END WHERE deskripsi_aduan IS NOT NULL;
    ALTER TABLE infrastruktur DROP COLUMN deskripsi_aduan;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'aset' AND column_name = 'deskripsi_aduan') THEN
    UPDATE aset SET kondisi = CASE WHEN kondisi IS NULL OR kondisi = 'Aduan warga' THEN deskripsi_aduan WHEN kondisi = deskripsi_aduan THEN kondisi ELSE concat_ws(E'\n', kondisi, deskripsi_aduan) END WHERE deskripsi_aduan IS NOT NULL;
    ALTER TABLE aset DROP COLUMN deskripsi_aduan;
  END IF;
END $$;
