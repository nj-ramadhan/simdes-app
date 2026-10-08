import { addRows } from '../_lib/sheets.js';

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

const CATEGORY_TARGETS = {
  Lingkungan: { tableName: 'Lingkungan', detailLabel: 'Jenis lingkungan', createRecord: ({ id, report, detail }) => ({
    id,
    id_rw: report.id_rw,
    id_rt: report.id_rt,
    kategori: detail,
    lokasi: report.lokasi,
    kondisi: report.deskripsi,
    tgl_laporan: new Date().toISOString().slice(0, 10),
    aduan_id: report.id,
    nama_pelapor: report.nama,
    no_hp_pelapor: report.no_hp,
  }) },
  Infrastruktur: { tableName: 'Infrastruktur', detailLabel: 'Jenis infrastruktur', createRecord: ({ id, report, detail }) => ({
    id,
    id_rw: report.id_rw,
    id_rt: report.id_rt,
    jenis: detail,
    lokasi: report.lokasi,
    kondisi: report.deskripsi,
    tahun_bangun: null,
    aduan_id: report.id,
    nama_pelapor: report.nama,
    no_hp_pelapor: report.no_hp,
  }) },
  Aset: { tableName: 'Aset', detailLabel: 'Nama aset', createRecord: ({ id, report, detail }) => ({
    id,
    id_rw: report.id_rw,
    id_rt: report.id_rt,
    nama_aset: detail,
    kategori: 'Aduan Warga',
    jumlah: null,
    kondisi: report.deskripsi,
    lokasi_simpan: report.lokasi,
    nilai_perolehan: null,
    aduan_id: report.id,
    nama_pelapor: report.nama,
    no_hp_pelapor: report.no_hp,
  }) },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method tidak diizinkan' });
  try {
    const body = req.body || {};
    const category = requiredText(body.kategori, 'Kategori', 80);
    const target = CATEGORY_TARGETS[category];
    if (!target) {
      throw Object.assign(new Error('Kategori harus Lingkungan, Infrastruktur, atau Aset'), { status: 400 });
    }

    const detail = requiredText(body.detail, target.detailLabel, 160);
    const report = {
      id: crypto.randomUUID(),
      nama: requiredText(body.nama, 'Nama pelapor', 120),
      no_hp: body.no_hp ? requiredText(body.no_hp, 'Nomor telepon', 30) : null,
      kategori: category,
      id_rw: optionalNumber(body.id_rw, 'RW'),
      id_rt: optionalNumber(body.id_rt, 'RT'),
      lokasi: requiredText(body.lokasi, 'Lokasi', 200),
      deskripsi: requiredText(body.deskripsi, 'Uraian aduan', 3000),
      status: 'baru',
    };
    const targetRecord = target.createRecord({ id: crypto.randomUUID(), report, detail });
    await addRows([
      { tableName: 'aduan', rowData: report },
      { tableName: target.tableName, rowData: targetRecord },
    ]);
    return res.status(201).json({ id: report.id, status: report.status, kategori: category });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}