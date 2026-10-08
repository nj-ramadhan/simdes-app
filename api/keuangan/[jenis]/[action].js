import { getRows, addRow, addRows, updateRowById, deleteRowById } from '../../_lib/sheets.js';
import { verifyToken, requireRole, assertScope } from '../../_lib/auth.js';

const LEGACY_TYPE_ALIASES = { sampah: 'kebersihan', 'dana-sosial': 'sosial', 'dana-kematian': 'kematian' };
const SHEET_MAP = {
  global: 'Keuangan_Global',
  kebersihan: 'Keuangan_Sampah',
  keamanan: 'Keuangan_Keamanan',
  sosial: 'Keuangan_DanaSosial',
  kematian: 'Keuangan_DanaKematian',
  kompensasi: 'Keuangan_Kompensasi',
};
const CATEGORY_MAP = {
  kebersihan: 'Dana Kebersihan',
  keamanan: 'Dana Keamanan',
  sosial: 'Dana Sosial',
  kematian: 'Dana Kematian',
  kompensasi: 'Dana Kompensasi',
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
    const { action } = req.query;
    const requestedJenis = req.query.jenis;
    const jenis = LEGACY_TYPE_ALIASES[requestedJenis] || requestedJenis;
    const sheetName = SHEET_MAP[jenis];
    if (!sheetName) return res.status(400).json({ error: 'Jenis laporan tidak valid' });

    if (jenis === 'global' && action === 'iuran-bulanan' && req.method === 'POST') {
      requireRole(user, ['rt_admin', 'rw_admin']);
      const body = req.body || {};
      const legacyMonth = Number(body.bulan);
      const legacyYear = Number(body.tahun);
      const tanggal = body.tanggal || (Number.isInteger(legacyMonth) && Number.isInteger(legacyYear)
        ? `${legacyYear}-${String(legacyMonth).padStart(2, '0')}-01`
        : '');
      const date = new Date(`${tanggal}T12:00:00`);
      const tipe = body.tipe || 'masuk';
      if (!body.id_warga || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || Number.isNaN(date.getTime())
        || date.toISOString().slice(0, 10) !== tanggal || !['masuk', 'keluar'].includes(tipe)) {
        return res.status(400).json({ error: 'Warga, tanggal, dan tipe transaksi harus diisi dengan benar' });
      }
      const resident = (await getRows('Sensus', row => String(row.id_warga) === String(body.id_warga)))[0];
      if (!resident) return res.status(404).json({ error: 'Warga terdaftar tidak ditemukan' });
      assertScope(user, resident.id_rt, resident.id_rw);

      const feeTypes = {
        kebersihan: ['Keuangan_Sampah', CATEGORY_MAP.kebersihan],
        keamanan: ['Keuangan_Keamanan', CATEGORY_MAP.keamanan],
        sosial: ['Keuangan_DanaSosial', CATEGORY_MAP.sosial],
        kematian: ['Keuangan_DanaKematian', CATEGORY_MAP.kematian],
        kompensasi: ['Keuangan_Kompensasi', CATEGORY_MAP.kompensasi],
      };
      const fees = { ...(body.iuran || {}) };
      fees.kebersihan ??= fees.sampah;
      fees.sosial ??= fees['dana-sosial'];
      fees.kematian ??= fees['dana-kematian'];
      const otherAmount = Number(fees.dana_lain || 0);
      delete fees.dana_lain;
      if (!Number.isFinite(otherAmount) || otherAmount < 0) {
        return res.status(400).json({ error: 'Nilai Dana Lain tidak valid' });
      }
      if (otherAmount > 0) {
        const requestedOtherType = body.dana_lain_jenis;
        const otherType = LEGACY_TYPE_ALIASES[requestedOtherType] || requestedOtherType;
        if (!['sosial', 'kematian', 'kompensasi'].includes(otherType)) {
          return res.status(400).json({ error: 'Pilih kategori Dana Lain yang valid' });
        }
        fees[otherType] = Number(fees[otherType] || 0) + otherAmount;
      }
      const recordedAt = new Date().toISOString();
      const entries = Object.entries(feeTypes).flatMap(([type, [tableName, label]]) => {
        const amount = Number(fees[type] || 0);
        if (!Number.isFinite(amount) || amount < 0) throw Object.assign(new Error(`Nilai ${label} tidak valid`), { status: 400 });
        if (amount === 0) return [];
        return [{
          tableName,
          rowData: {
            id: crypto.randomUUID(),
            id_rw: resident.id_rw,
            id_rt: resident.id_rt,
            id_warga: resident.id_warga,
            nama_warga: resident.nama,
            tanggal,
            tipe,
            kategori: label,
            jumlah: amount,
            keterangan: body.keterangan?.trim() || `Iuran bulan ${new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date)}`,
            dicatat_oleh: user.id,
            created_at: recordedAt,
          },
        }];
      });
      if (!entries.length) return res.status(400).json({ error: 'Isi setidaknya satu nominal iuran' });
      const created = await addRows(entries);
      return res.status(201).json(created);
    }

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
        kategori: CATEGORY_MAP[jenis] || req.body.kategori,
        id_rw: req.body.id_rw === '' ? null : req.body.id_rw,
        id_rt: req.body.id_rt === '' || req.body.id_rt === 'ALL' ? null : req.body.id_rt,
      });
      return res.status(201).json(created);
    }

    if (action === 'transactions' && (req.method === 'PUT' || req.method === 'DELETE')) {
      if (jenis === 'global') return res.status(400).json({ error: 'Pilih jenis kas tertentu untuk mengubah atau menghapus transaksi' });
      requireRole(user, ['rt_admin', 'rw_admin']);
      const id = req.query?.id;
      const existing = (await getRows(sheetName, row => row.id === id))[0];
      if (!existing) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
      assertScope(user, existing.id_rt, existing.id_rw);
      if (req.method === 'DELETE') {
        await deleteRowById(sheetName, 'id', id);
        return res.status(200).json({ success: true });
      }
      const body = req.body || {};
      assertScope(user, body.id_rt ?? existing.id_rt, body.id_rw ?? existing.id_rw);
      const updated = await updateRowById(sheetName, 'id', id, {
        id_rw: body.id_rw === '' ? null : (body.id_rw ?? existing.id_rw),
        id_rt: body.id_rt === '' || body.id_rt === 'ALL' ? null : (body.id_rt ?? existing.id_rt),
        tanggal: body.tanggal,
        tipe: body.tipe,
        kategori: CATEGORY_MAP[jenis],
        jumlah: Number(body.jumlah),
        keterangan: body.keterangan || null,
      });
      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: 'Method tidak diizinkan' });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}