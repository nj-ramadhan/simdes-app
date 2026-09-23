import { getRows, updateRowById, deleteRowById } from '../../_lib/sheets.js';
import { verifyToken, requireRole, assertScope } from '../../_lib/auth.js';

const SHEETS = {
  lingkungan: 'Lingkungan',
  infrastruktur: 'Infrastruktur',
};

export default async function handler(req, res) {
  try {
    const user = verifyToken(req);
    const sheetName = SHEETS[req.query.module];
    const { id } = req.query;
    if (!sheetName) return res.status(404).json({ error: 'Modul tidak ditemukan' });

    if (req.method === 'PUT') {
      requireRole(user, ['rt_admin', 'rw_admin']);
      const existing = (await getRows(sheetName, row => row.id === id))[0];
      if (!existing) return res.status(404).json({ error: 'Data tidak ditemukan' });
      assertScope(user, existing.id_rt, null);
      const updated = await updateRowById(sheetName, 'id', id, req.body);
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      requireRole(user, ['rt_admin', 'rw_admin']);
      const existing = (await getRows(sheetName, row => row.id === id))[0];
      if (!existing) return res.status(404).json({ error: 'Data tidak ditemukan' });
      assertScope(user, existing.id_rt, null);
      await deleteRowById(sheetName, 'id', id);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method tidak diizinkan' });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}