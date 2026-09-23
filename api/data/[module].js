import { getRows, addRow } from '../_lib/sheets.js';
import { verifyToken, requireRole, assertScope } from '../_lib/auth.js';

const SHEETS = {
  lingkungan: 'Lingkungan',
  infrastruktur: 'Infrastruktur',
};

export default async function handler(req, res) {
  try {
    const user = verifyToken(req);
    const sheetName = SHEETS[req.query.module];
    if (!sheetName) return res.status(404).json({ error: 'Modul tidak ditemukan' });

    if (req.method === 'GET') {
      let data = await getRows(sheetName);
      if (user.role !== 'rw_admin' && user.id_rt != null) {
        data = data.filter(row => Number(row.id_rt) === Number(user.id_rt));
      } else if (user.role === 'rw_admin' && user.id_rw != null) {
        const rtList = await getRows('RT', row => Number(row.id_rw) === Number(user.id_rw));
        const rtIds = new Set(rtList.map(row => Number(row.id_rt)));
        data = data.filter(row => Number(row.id_rw) === Number(user.id_rw) || rtIds.has(Number(row.id_rt)));
      }
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      requireRole(user, ['rt_admin', 'rw_admin']);
      const payload = req.body;
      assertScope(user, payload.id_rt, payload.id_rw);
      const created = await addRow(sheetName, { id: crypto.randomUUID(), ...payload });
      return res.status(201).json(created);
    }

    return res.status(405).json({ error: 'Method tidak diizinkan' });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}