import dotenv from 'dotenv';
import { getRows } from '../_lib/sheets.js';

dotenv.config({ path: '.env.local', override: true });

const LEDGERS = [
  ['global', 'Keuangan_Global'],
  ['sampah', 'Keuangan_Sampah'],
  ['keamanan', 'Keuangan_Keamanan'],
  ['dana-sosial', 'Keuangan_DanaSosial'],
  ['dana-kematian', 'Keuangan_DanaKematian'],
  ['kompensasi', 'Keuangan_Kompensasi'],
];

function ageFrom(date) {
  if (!date) return null;
  const birth = new Date(date);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const birthdayPassed = now.getMonth() > birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!birthdayPassed) age -= 1;
  return age >= 0 ? age : null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method tidak diizinkan' });
  try {
    const rw = req.query?.rw ? Number(req.query.rw) : null;
    const rt = req.query?.rt ? Number(req.query.rt) : null;
    const kategori = req.query?.kategori ? String(req.query.kategori) : null;
    if (rw !== null && !Number.isInteger(rw)) return res.status(400).json({ error: 'Filter RW harus berupa angka' });
    if (rt !== null && !Number.isInteger(rt)) return res.status(400).json({ error: 'Filter RT harus berupa angka' });

    let residents = await getRows('Sensus');
    if (rw !== null) residents = residents.filter((row) => Number(row.id_rw) === rw);
    if (rt !== null) residents = residents.filter((row) => Number(row.id_rt) === rt);

    const publicResidents = residents.map((row) => {
      const usia = ageFrom(row.tgl_lahir);
      return {
        jenis_kelamin: row.jenis_kelamin,
        pekerjaan: row.pekerjaan,
        usia,
        kategori_usia: usia === null ? 'Tidak diketahui' : usia < 18 ? 'Anak' : usia >= 60 ? 'Jompo' : 'Dewasa',
      };
    });

    const ledgers = (await Promise.all(LEDGERS.map(async ([sumber, table]) => (await getRows(table)).map((row) => ({ ...row, sumber })))))
      .flat()
      .filter((row) => (rw === null || row.id_rw == null || Number(row.id_rw) === rw) && (rt === null || row.id_rt == null || Number(row.id_rt) === rt) && (!kategori || row.sumber === kategori));
    const totalMasuk = ledgers.filter((row) => row.tipe === 'masuk').reduce((sum, row) => sum + Number(row.jumlah || 0), 0);
    const totalKeluar = ledgers.filter((row) => row.tipe === 'keluar').reduce((sum, row) => sum + Number(row.jumlah || 0), 0);

    const inScope = (row) => (rw === null || Number(row.id_rw) === rw) && (rt === null || Number(row.id_rt) === rt);
    const [lingkungan, infrastruktur, aset] = await Promise.all([
      getRows('Lingkungan'),
      getRows('Infrastruktur'),
      getRows('Aset'),
    ]);

    const occupationCounts = publicResidents.reduce((counts, row) => {
      const occupation = row.pekerjaan || 'Tidak diisi';
      counts[occupation] = (counts[occupation] || 0) + 1;
      return counts;
    }, {});
    const classificationCounts = publicResidents.reduce((counts, row) => {
      counts[row.kategori_usia] = (counts[row.kategori_usia] || 0) + 1;
      return counts;
    }, {});

    return res.status(200).json({
      wilayah: { rw, rt },
      filter_keuangan: { kategori },
      statistik: {
        total_warga: publicResidents.length,
        anak: classificationCounts.Anak || 0,
        jompo: classificationCounts.Jompo || 0,
        usia_produktif: classificationCounts.Dewasa || 0,
        laki_laki: publicResidents.filter((row) => ['L', 'LAKI-LAKI', 'LAKI LAKI'].includes(String(row.jenis_kelamin || '').toUpperCase())).length,
        perempuan: publicResidents.filter((row) => ['P', 'PEREMPUAN'].includes(String(row.jenis_kelamin || '').toUpperCase())).length,
        total_transaksi: ledgers.length,
        total_masuk: totalMasuk,
        total_keluar: totalKeluar,
        saldo: totalMasuk - totalKeluar,
      },
      pekerjaan: Object.entries(occupationCounts).sort((a, b) => b[1] - a[1]).map(([label, jumlah]) => ({ label, jumlah })),
      klasifikasi_usia: Object.entries(classificationCounts).map(([label, jumlah]) => ({ label, jumlah })),
      keuangan_kategori: LEDGERS.map(([label]) => {
        const rows = ledgers.filter((row) => row.sumber === label);
        const masuk = rows.filter((row) => row.tipe === 'masuk').reduce((sum, row) => sum + Number(row.jumlah || 0), 0);
        const keluar = rows.filter((row) => row.tipe === 'keluar').reduce((sum, row) => sum + Number(row.jumlah || 0), 0);
        return { label, transaksi: rows.length, masuk, keluar, saldo: masuk - keluar };
      }),
      keuangan: ledgers.map(({ id, sumber, id_rw, id_rt, tanggal, tipe, kategori, jumlah }) => ({ id, sumber, id_rw, id_rt, tanggal, tipe, kategori, jumlah })),
      lingkungan: lingkungan.filter(inScope).map(({ kategori, lokasi, kondisi, tgl_laporan }) => ({ kategori, lokasi, kondisi, tgl_laporan })),
      infrastruktur: infrastruktur.filter(inScope).map(({ jenis, lokasi, kondisi, tahun_bangun }) => ({ jenis, lokasi, kondisi, tahun_bangun })),
      aset: aset.filter(inScope).map(({ nama_aset, kategori, jumlah, kondisi, lokasi_simpan }) => ({ nama_aset, kategori, jumlah, kondisi, lokasi_simpan })),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
