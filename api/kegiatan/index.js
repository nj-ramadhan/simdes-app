import { getRows, addRow, updateRowById, deleteRowById } from '../_lib/sheets.js';
import { verifyToken, requireRole, assertScope } from '../_lib/auth.js';

const MAX_PHOTOS = 6;
const MAX_PHOTO_LENGTH = 1_200_000;

function normalizePhotos(value) {
  let photos = value;
  if (typeof photos === 'string') {
    try { photos = JSON.parse(photos); } catch { photos = []; }
  }
  if (!Array.isArray(photos)) return [];
  return photos.filter((photo) => typeof photo === 'string' && photo.startsWith('data:image/') && photo.length <= MAX_PHOTO_LENGTH).slice(0, MAX_PHOTOS);
}

function scopeRows(user, rows) {
  return rows.filter((row) => {
    if (user.role === 'rw_admin') return user.id_rw == null || Number(row.id_rw) === Number(user.id_rw);
    return user.id_rt == null || Number(row.id_rt) === Number(user.id_rt);
  });
}

function publicRow(row) {
  const dokumentasi = normalizePhotos(row.dokumentasi);
  return {
    id: row.id,
    id_rw: row.id_rw,
    id_rt: row.id_rt,
    judul: row.judul,
    tanggal: row.tanggal,
    lokasi: row.lokasi,
    deskripsi: row.deskripsi,
    dokumentasi,
    created_at: row.created_at,
  };
}

export default async function handler(req, res) {
  try {
    const user = verifyToken(req);
    const rows = scopeRows(user, await getRows('kegiatan'));

    if (req.method === 'GET') return res.status(200).json(rows.map(publicRow).sort((a, b) => String(b.tanggal || '').localeCompare(String(a.tanggal || ''))));

    if (req.method === 'POST') {
      requireRole(user, ['rt_admin', 'rw_admin']);
      const body = req.body || {};
      assertScope(user, body.id_rt, body.id_rw);
      if (!body.judul || !body.tanggal || !body.deskripsi) return res.status(400).json({ error: 'Judul, tanggal, dan uraian kegiatan wajib diisi' });
      const photos = normalizePhotos(body.dokumentasi);
      if (photos.length !== (Array.isArray(body.dokumentasi) ? body.dokumentasi.length : 0)) return res.status(400).json({ error: 'Dokumentasi foto tidak valid atau melebihi batas ukuran' });
      const created = await addRow('kegiatan', {
        id: crypto.randomUUID(),
        id_rw: body.id_rw ?? user.id_rw ?? null,
        id_rt: body.id_rt ?? user.id_rt ?? null,
        judul: String(body.judul).trim(),
        tanggal: body.tanggal,
        lokasi: body.lokasi ? String(body.lokasi).trim() : null,
        deskripsi: String(body.deskripsi).trim(),
        dokumentasi: JSON.stringify(photos),
        created_by: user.id,
      });
      return res.status(201).json(publicRow(created));
    }

    if (req.method === 'PUT' || req.method === 'DELETE') {
      requireRole(user, ['rt_admin', 'rw_admin']);
      const id = req.query?.id;
      const existing = rows.find(row => row.id === id);
      if (!existing) return res.status(404).json({ error: 'Data kegiatan tidak ditemukan' });
      assertScope(user, existing.id_rt, existing.id_rw);
      if (req.method === 'DELETE') {
        await deleteRowById('kegiatan', 'id', id);
        return res.status(200).json({ success: true });
      }

      const body = req.body || {};
      if (!body.judul || !body.tanggal || !body.deskripsi) return res.status(400).json({ error: 'Judul, tanggal, dan uraian kegiatan wajib diisi' });
      const photos = normalizePhotos(body.dokumentasi ?? existing.dokumentasi);
      if (photos.length !== (Array.isArray(body.dokumentasi) ? body.dokumentasi.length : photos.length)) return res.status(400).json({ error: 'Dokumentasi foto tidak valid atau melebihi batas ukuran' });
      const updated = await updateRowById('kegiatan', 'id', id, {
        id_rw: body.id_rw ?? existing.id_rw,
        id_rt: body.id_rt ?? existing.id_rt,
        judul: String(body.judul).trim(),
        tanggal: body.tanggal,
        lokasi: body.lokasi ? String(body.lokasi).trim() : null,
        deskripsi: String(body.deskripsi).trim(),
        dokumentasi: JSON.stringify(photos),
      });
      return res.status(200).json(publicRow(updated));
    }

    return res.status(405).json({ error: 'Method tidak diizinkan' });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}