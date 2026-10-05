import { addRow } from '../_lib/sheets.js';

function requiredText(value, field, maxLength) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text || text.length > maxLength) throw Object.assign(new Error(`${field} wajib diisi dan maksimal ${maxLength} karakter`), { status: 400 });
  return text;
}

function optionalNumber(value, field) {
  if (value == null || value === '') return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) throw Object.assign(new Error(`${field} harus berupa angka positif`), { status: 400 });
  return number;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method tidak diizinkan' });
  try {
    const body = req.body || {};
    const created = await addRow('aduan', {
      id: crypto.randomUUID(),
      nama: requiredText(body.nama, 'Nama pelapor', 120),
      no_hp: body.no_hp ? requiredText(body.no_hp, 'Nomor telepon', 30) : null,
      kategori: requiredText(body.kategori, 'Kategori', 80),
      id_rw: optionalNumber(body.id_rw, 'RW'),
      id_rt: optionalNumber(body.id_rt, 'RT'),
      lokasi: requiredText(body.lokasi, 'Lokasi', 200),
      deskripsi: requiredText(body.deskripsi, 'Uraian aduan', 3000),
      status: 'baru',
    });
    return res.status(201).json({ id: created.id, status: created.status });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}