import { getRows } from '../_lib/sheets.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method tidak diizinkan' });
  try {
    const rw = req.query?.rw ? Number(req.query.rw) : null;
    const rt = req.query?.rt ? Number(req.query.rt) : null;
    const rows = (await getRows('kegiatan'))
      .filter((row) => (rw === null || Number(row.id_rw) === rw) && (rt === null || Number(row.id_rt) === rt))
      .map((row) => ({ ...row, dokumentasi: Array.isArray(row.dokumentasi) ? row.dokumentasi : [] }))
      .sort((a, b) => String(b.tanggal || '').localeCompare(String(a.tanggal || '')));
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}