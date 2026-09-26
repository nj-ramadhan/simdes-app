import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import publicClient from '../api/publicClient';
import { formatDate } from '../utils/formatters';
import simdesIcon from '../assets/icon-simdes.png';

const money = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

export default function PublicHome() {
  const [filter, setFilter] = useState({ rw: '', rt: '', kategori: '' });
  const [data, setData] = useState(null);
  const [kegiatan, setKegiatan] = useState([]);
  const [selectedKegiatan, setSelectedKegiatan] = useState(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filter.rw) params.set('rw', filter.rw);
      if (filter.rt) params.set('rt', filter.rt);
      if (filter.kategori) params.set('kategori', filter.kategori);
      const response = await publicClient.get(`/public/transparency${params.toString() ? `?${params}` : ''}`);
      if (!response.data || typeof response.data !== 'object' || !response.data.statistik) {
        throw new Error('API transparansi belum tersedia. Jalankan vercel dev untuk mengaktifkan database.');
      }
      setData(response.data);
      try {
        const kegiatanResponse = await publicClient.get(`/public/kegiatan${params.toString() ? `?${params}` : ''}`);
        setKegiatan(kegiatanResponse.data);
      } catch {
        setKegiatan([]);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Informasi transparansi belum dapat dimuat');
    } finally { setLoading(false); }
  }

  useEffect(() => {
    // Load public transparency once when the portal opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(event) { event.preventDefault(); load(); }

  function openGallery(report) {
    setSelectedKegiatan(report);
    setActivePhoto(0);
  }

  function closeGallery() { setSelectedKegiatan(null); }

  function movePhoto(step) {
    const total = selectedKegiatan?.dokumentasi?.length || 0;
    if (!total) return;
    setActivePhoto((current) => (current + step + total) % total);
  }

  return <main className="public-home">
    <header className="public-nav"><div className="public-brand"><span className="public-logo"><img src={simdesIcon} alt="SIMDES" /></span><div><strong>SIMDES</strong><small>Sistem Informasi Masyarakat Desa</small></div></div><Link className="public-login-button" to="/login">Masuk Pengelola</Link></header>
    <section className="public-hero"><div><span className="section-kicker">Portal Transparansi Desa</span><h1>Informasi desa, terbuka untuk semua warga.</h1><p>Lihat ringkasan kependudukan dan keuangan desa berdasarkan RW atau RT tanpa harus masuk ke sistem pengelola.</p></div><div className="public-hero-mark">SIM<br />DES</div></section>
    <section className="public-content">
      <form className="public-filter" onSubmit={submit}><div><span className="panel-kicker">Cakupan Data</span><h2>Filter transparansi</h2></div><label>RW<input type="number" min="1" placeholder="Semua RW" value={filter.rw} onChange={(e) => setFilter({ ...filter, rw: e.target.value })} /></label><label>RT<input type="number" min="1" placeholder="Semua RT" value={filter.rt} onChange={(e) => setFilter({ ...filter, rt: e.target.value })} /></label><label>Kategori<select value={filter.kategori} onChange={(e) => setFilter({ ...filter, kategori: e.target.value })}><option value="">Semua kas</option><option value="global">Kas Global</option><option value="sampah">Iuran Sampah</option><option value="keamanan">Iuran Keamanan</option><option value="dana-sosial">Dana Sosial</option><option value="dana-kematian">Dana Kematian</option><option value="kompensasi">Dana Kompensasi</option></select></label><button className="primary-button" type="submit">Terapkan</button><button className="public-reset" type="button" onClick={() => { setFilter({ rw: '', rt: '', kategori: '' }); setTimeout(load, 0); }}>Reset</button></form>
      {error && <p className="finance-error">{error}</p>}
      {loading ? <div className="finance-empty">Memuat transparansi desa...</div> : data?.statistik && <>
        <section className="public-stats"><PublicStat label="Total Warga" value={data.statistik.total_warga} /><PublicStat label="Anak" value={data.statistik.anak} /><PublicStat label="Jompo" value={data.statistik.jompo} /><PublicStat label="Usia Produktif" value={data.statistik.usia_produktif} /><PublicStat label="Laki-laki" value={data.statistik.laki_laki} /><PublicStat label="Perempuan" value={data.statistik.perempuan} /><PublicStat label="Saldo Kas" value={money(data.statistik.saldo)} /><PublicStat label="Transaksi" value={data.statistik.total_transaksi} /></section>
        <section className="public-columns"><article className="public-panel"><div className="panel-header"><div><span className="panel-kicker">Kependudukan Umum</span><h2 className="panel-title">Ringkasan Klasifikasi</h2></div><span className="badge badge-info">Angka agregat</span></div><div className="public-breakdown"><Breakdown title="Pekerjaan" items={data.pekerjaan} /><Breakdown title="Kelompok usia" items={data.klasifikasi_usia} /></div></article><article className="public-panel"><div className="panel-header"><div><span className="panel-kicker">Kas Gabungan</span><h2 className="panel-title">Transparansi Keuangan</h2></div><span className="badge badge-success">{data.statistik.total_transaksi} transaksi</span></div><ul className="public-money-list"><li><span>Total masuk</span><strong>{money(data.statistik.total_masuk)}</strong></li><li><span>Total keluar</span><strong>{money(data.statistik.total_keluar)}</strong></li><li><span>Saldo</span><strong>{money(data.statistik.saldo)}</strong></li></ul><div className="public-breakdown">{data.keuangan_kategori.map((row) => <Breakdown key={row.label} title={row.label} items={[{ label: 'Saldo', jumlah: row.saldo }, { label: 'Transaksi', jumlah: row.transaksi }]} moneyValue={row.label !== 'global'} />)}</div></article></section>
        <section className="public-panel public-kegiatan-panel"><div className="panel-header"><div><span className="panel-kicker">Kabar Wilayah</span><h2 className="panel-title">Laporan Kegiatan Warga</h2></div><span className="badge badge-info">{kegiatan.length} laporan</span></div>{kegiatan.length ? <div className="kegiatan-grid">{kegiatan.map((report) => <article className="kegiatan-card kegiatan-card-clickable" key={report.id} tabIndex="0" onClick={() => openGallery(report)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') openGallery(report); }}><div className="kegiatan-gallery">{report.dokumentasi?.length ? report.dokumentasi.map((photo, index) => <img key={`${report.id}-${index}`} src={photo} alt={`${report.judul} dokumentasi ${index + 1}`} />) : <div className="kegiatan-no-photo">Tanpa foto</div>}</div><div className="kegiatan-card-body"><div className="kegiatan-meta"><span>{formatDate(report.tanggal)}</span><span>RT {report.id_rt || '-'} / RW {report.id_rw || '-'}</span></div><h2>{report.judul}</h2>{report.lokasi && <p className="kegiatan-location">Lokasi: {report.lokasi}</p>}<p>{report.deskripsi}</p><span className="kegiatan-view-hint">{report.dokumentasi?.length ? `Lihat ${report.dokumentasi.length} foto` : 'Lihat detail laporan'}</span></div></article>)}</div> : <div className="public-kegiatan-empty">Belum ada laporan kegiatan untuk cakupan wilayah ini.</div>}</section>
      </>}
    </section>
    {selectedKegiatan && <div className="gallery-modal-overlay" role="dialog" aria-modal="true" aria-label={`Galeri ${selectedKegiatan.judul}`} onClick={closeGallery}><div className="gallery-modal" onClick={(event) => event.stopPropagation()}><button type="button" className="gallery-close" onClick={closeGallery} aria-label="Tutup galeri">X</button><div className="gallery-modal-header"><span className="panel-kicker">Dokumentasi kegiatan</span><h2>{selectedKegiatan.judul}</h2><p>{formatDate(selectedKegiatan.tanggal)}{selectedKegiatan.lokasi ? ` · ${selectedKegiatan.lokasi}` : ''}</p></div>{selectedKegiatan.dokumentasi?.length ? <><div className="gallery-stage"><img src={selectedKegiatan.dokumentasi[activePhoto]} alt={`${selectedKegiatan.judul} dokumentasi ${activePhoto + 1}`} />{selectedKegiatan.dokumentasi.length > 1 && <><button type="button" className="gallery-arrow gallery-prev" onClick={() => movePhoto(-1)} aria-label="Foto sebelumnya">‹</button><button type="button" className="gallery-arrow gallery-next" onClick={() => movePhoto(1)} aria-label="Foto berikutnya">›</button></>}</div><div className="gallery-thumbnails">{selectedKegiatan.dokumentasi.map((photo, index) => <button type="button" className={`gallery-thumbnail ${index === activePhoto ? 'is-active' : ''}`} key={`${selectedKegiatan.id}-thumb-${index}`} onClick={() => setActivePhoto(index)}><img src={photo} alt={`Pilih foto ${index + 1}`} /></button>)}</div><p className="gallery-counter">{activePhoto + 1} / {selectedKegiatan.dokumentasi.length}</p></> : <div className="gallery-no-photo">Laporan ini tidak memiliki foto dokumentasi.</div>}<p className="gallery-description">{selectedKegiatan.deskripsi}</p></div></div>}
  </main>;
}

function PublicStat({ label, value }) { return <article className="public-stat"><span>{label}</span><strong>{value}</strong></article>; }
function Breakdown({ title, items, moneyValue = false }) { return <div className="public-breakdown-group"><h3>{title}</h3>{items.map((item) => <div className="public-breakdown-row" key={item.label}><span>{item.label}</span><strong>{moneyValue && item.label === 'Saldo' ? money(item.jumlah) : Number(item.jumlah || 0).toLocaleString('id-ID')}</strong></div>)}</div>; }
