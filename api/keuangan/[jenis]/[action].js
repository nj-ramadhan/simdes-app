import { getRows, addRow } from '../../_lib/sheets.js';
import { verifyToken, requireRole, assertScope } from '../../_lib/auth.js';

const SHEET_MAP = {
  global: 'Keuangan_Global',
  sampah: 'Keuangan_Sampah',
  keamanan: 'Keuangan_Keamanan',
  'dana-sosial': 'Keuangan_DanaSosial',
  'dana-kematian': 'Keuangan_DanaKematian',
  kompensasi: 'Keuangan_Kompensasi',
};
const LEDGER_TYPES = Object.keys(SHEET_MAP);

async function getScopedRows(jenis, user) {
  const data = jenis === 'global'
    ? (await Promise.all(LEDGER_TYPES.map(async (type) => (
      (await getRows(SHEET_MAP[type])).map(row => ({ ...row, sumber: type }))
    )))).flat()
    : await getRows(SHEET_MAP[jenis]);

  if (user.role !== 'rw_admin' && user.id_rt != null) {
    return data.filter(row => row.id_rt == null || Number(row.id_rt) === Number(user.id_rt));
  }
  if (user.role === 'rw_admin' && user.id_rw != null) {
    return data.filter(row => row.id_rw == null || Number(row.id_rw) === Number(user.id_rw));
  }
  return data;
}

export default async function handler(req, res) {
  try {
    const user = verifyToken(req);
    const { jenis, action } = req.query;
    const sheetName = SHEET_MAP[jenis];
    if (!sheetName) return res.status(400).json({ error: 'Jenis laporan tidak valid' });

    if (action === 'summary' && req.method === 'GET') {
      const data = await getScopedRows(jenis, user);
      const totalMasuk = data.filter(row => row.tipe === 'masuk').reduce((sum, row) => sum + Number(row.jumlah), 0);
      const totalKeluar = data.filter(row => row.tipe === 'keluar').reduce((sum, row) => sum + Number(row.jumlah), 0);
      return res.status(200).json({
        total_masuk: totalMasuk,
        total_keluar: totalKeluar,
        saldo: totalMasuk - totalKeluar,
        jumlah_transaksi: data.length,
      });
    }

    if (action === 'transactions' && req.method === 'GET') {
      return res.status(200).json(await getScopedRows(jenis, user));
    }

    if (action === 'transactions' && req.method === 'POST') {
      requireRole(user, ['rt_admin', 'rw_admin']);
      assertScope(user, req.body.id_rt, req.body.id_rw);
      const created = await addRow(sheetName, {
        id: crypto.randomUUID(),
        dicatat_oleh: user.id,
        created_at: new Date().toISOString(),
        ...req.body,
        id_rw: req.body.id_rw === '' ? null : req.body.id_rw,
        id_rt: req.body.id_rt === '' || req.body.id_rt === 'ALL' ? null : req.body.id_rt,
      });
      return res.status(201).json(created);
    }

    return res.status(405).json({ error: 'Method tidak diizinkan' });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}