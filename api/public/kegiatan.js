import { getRows } from '../_lib/sheets.js';

function parsePhotos(value) {
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { return []; }
  }
  return Array.isArray(value) ? value.filter((photo) => typeof photo === 'string' && photo.startsWith('data:image/')).slice(0, 6) : [];
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method tidak diizinkan' });
  try {
    const rw = req.query?.rw ? Number(req.query.rw) : null;
    const rt = req.query?.rt ? Number(req.query.rt) : null;
    const rows = (await getRows('kegiatan'))
      .filter((row) => (rw === null || Number(row.id_rw) === rw) && (rt === null || Number(row.id_rt) === rt))
      .map((row) => ({ ...row, dokumentasi: parsePhotos(row.dokumentasi) }))
      .sort((a, b) => String(b.tanggal || '').localeCompare(String(a.tanggal || '')));
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}