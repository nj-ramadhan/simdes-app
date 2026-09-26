// Konfigurasi kolom tabel & field form untuk tiap modul data.
// Dipakai oleh DataModulePage.jsx agar satu komponen bisa dipakai ulang
// untuk modul yang tersedia di API tanpa duplikasi kode halaman.

export const MODULES = {
  sensus: {
    title: 'Data Sensus Warga',
    apiPath: 'warga',
    idField: 'id_warga',
    columns: [
      { key: 'id_rw', label: 'RW' },
      { key: 'id_rt', label: 'RT' },
      { key: 'nik', label: 'NIK' },
      { key: 'nama', label: 'Nama Lengkap' },
      { key: 'jenis_kelamin', label: 'L/P' },
      { key: 'no_kk', label: 'No KK' },
      { key: 'status_kk', label: 'Status Dalam KK' },
      { key: 'alamat', label: 'Alamat' },
    ],
    formFields: [
      { key: 'id_rw', label: 'Nomor RW', type: 'number', required: true },
      { key: 'id_rt', label: 'Nomor RT', type: 'number', required: true },
      { key: 'nik', label: 'NIK', type: 'text', required: true },
      { key: 'nama', label: 'Nama Lengkap', type: 'text', required: true },
      { key: 'jenis_kelamin', label: 'Jenis Kelamin', type: 'select', options: ['L', 'P'] },
      { key: 'tgl_lahir', label: 'Tanggal Lahir', type: 'date' },
      { key: 'pekerjaan', label: 'Pekerjaan', type: 'select', options: ['Pelajar/Mahasiswa', 'PNS', 'TNI/Polri', 'Karyawan Swasta', 'Wiraswasta', 'Petani/Nelayan', 'Ibu Rumah Tangga', 'Pensiunan', 'Tidak Bekerja', 'Lainnya'] },
      { key: 'status_kk', label: 'Status dalam KK', type: 'select', options: ['Kepala Keluarga', 'Anggota Keluarga'] },
      { key: 'no_kk', label: 'No. KK', type: 'text' },
      { key: 'alamat', label: 'Alamat', type: 'text' },
      { key: 'no_hp', label: 'No HP', type: 'text' },
      { key: 'keterangan_khusus', label: 'Keterangan Khusus', type: 'text' },
    ],
  },
  lingkungan: {
    title: 'Data Lingkungan',
    apiPath: 'lingkungan',
    idField: 'id',
    columns: [
      { key: 'kategori', label: 'Kategori' },
      { key: 'lokasi', label: 'Lokasi' },
      { key: 'kondisi', label: 'Kondisi' },
      { key: 'tgl_laporan', label: 'Tgl Laporan' },
    ],
    formFields: [
      { key: 'id_rw', label: 'Nomor RW', type: 'number', required: true },
      { key: 'id_rt', label: 'Nomor RT', type: 'number', required: true },
      { key: 'kategori', label: 'Kategori (drainase/pohon/TPS/dll)', type: 'text', required: true },
      { key: 'lokasi', label: 'Lokasi', type: 'text' },
      { key: 'kondisi', label: 'Kondisi', type: 'text' },
      { key: 'tgl_laporan', label: 'Tanggal Laporan', type: 'date' },
    ],
  },
  infrastruktur: {
    title: 'Data Infrastruktur',
    apiPath: 'infrastruktur',
    idField: 'id',
    columns: [
      { key: 'jenis', label: 'Jenis' },
      { key: 'lokasi', label: 'Lokasi' },
      { key: 'kondisi', label: 'Kondisi' },
      { key: 'tahun_bangun', label: 'Tahun Bangun' },
    ],
    formFields: [
      { key: 'id_rw', label: 'Nomor RW', type: 'number', required: true },
      { key: 'id_rt', label: 'Nomor RT', type: 'number', required: true },
      { key: 'jenis', label: 'Jenis (jalan/lampu/pos ronda/dll)', type: 'text', required: true },
      { key: 'lokasi', label: 'Lokasi', type: 'text' },
      { key: 'kondisi', label: 'Kondisi', type: 'text' },
      { key: 'tahun_bangun', label: 'Tahun Dibangun', type: 'number' },
    ],
  },
  aset: {
    title: 'Data Inventaris Aset',
    apiPath: 'aset',
    idField: 'id',
    columns: [
      { key: 'nama_aset', label: 'Nama Aset' },
      { key: 'kategori', label: 'Kategori' },
      { key: 'jumlah', label: 'Jumlah' },
      { key: 'kondisi', label: 'Kondisi' },
    ],
    formFields: [
      { key: 'id_rw', label: 'Nomor RW', type: 'number', required: true },
      { key: 'id_rt', label: 'Nomor RT', type: 'number', required: true },
      { key: 'nama_aset', label: 'Nama Aset', type: 'text', required: true },
      { key: 'kategori', label: 'Kategori', type: 'text' },
      { key: 'jumlah', label: 'Jumlah', type: 'number' },
      { key: 'kondisi', label: 'Kondisi', type: 'text' },
      { key: 'lokasi_simpan', label: 'Lokasi Simpan', type: 'text' },
      { key: 'nilai_perolehan', label: 'Nilai Perolehan (Rp)', type: 'number' },
    ],
  },
};
