import { useEffect, useState } from 'react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';

const MAX_PHOTOS = 6;
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_PHOTO_DATA_LENGTH = 450_000;

function parsePhotos(value) {
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { return []; }
  }
  return Array.isArray(value) ? value.filter((photo) => typeof photo === 'string' && photo.startsWith('data:image/')).slice(0, MAX_PHOTOS) : [];
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(`${value}T00:00:00`));
}

function compressPhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error(`${file.name} bukan file gambar`));
    if (file.size > MAX_FILE_SIZE) return reject(new Error(`${file.name} melebihi ukuran 8 MB`));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Foto ${file.name} tidak dapat dibaca`));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error(`Foto ${file.name} tidak valid`));
      image.onload = () => {
        const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        let quality = 0.78;
        let photo = canvas.toDataURL('image/jpeg', quality);
        while (photo.length > MAX_PHOTO_DATA_LENGTH && quality > 0.35) {
          quality -= 0.08;
          photo = canvas.toDataURL('image/jpeg', quality);
        }
        if (photo.length > MAX_PHOTO_DATA_LENGTH) return reject(new Error(`${file.name} terlalu besar setelah dikompresi`));
        resolve(photo);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function KegiatanPage() {
  const { user } = useAuth();
  const canWrite = ['rt_admin', 'rw_admin'].includes(user.role);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ judul: '', tanggal: new Date().toISOString().slice(0, 10), lokasi: '', deskripsi: '', dokumentasi: [] });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data } = await client.get('/kegiatan');
      setReports(data.map((report) => ({ ...report, dokumentasi: parsePhotos(report.dokumentasi) })));
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat laporan kegiatan');
    } finally { setLoading(false); }
  }

  useEffect(() => {
    // Keep the report list synchronized with the current user's scope.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  function openCreate() {
    setForm({ judul: '', tanggal: new Date().toISOString().slice(0, 10), lokasi: '', deskripsi: '', dokumentasi: [] });
    setShowModal(true);
  }

  async function handleFiles(event) {
    const files = Array.from(event.target.files || []);
    if (files.length > MAX_PHOTOS) return setError(`Maksimal ${MAX_PHOTOS} foto per laporan`);
    try {
      setError('');
      const dokumentasi = await Promise.all(files.map(compressPhoto));
      setForm((current) => ({ ...current, dokumentasi }));
    } catch (err) { setError(err.message); }
    event.target.value = '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await client.post('/kegiatan', { ...form, id_rw: user.id_rw, id_rt: user.id_rt });
      setShowModal(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan laporan kegiatan');
    } finally { setSaving(false); }
  }

  return <div className="data-page kegiatan-page">
    <div className="data-page-header">
      <div><span className="section-kicker">Dokumentasi Warga</span><h1>Laporan Kegiatan</h1><p className="page-description">Catat kegiatan lingkungan dan bagikan dokumentasinya kepada warga.</p></div>
      {canWrite && <button onClick={openCreate} className="primary-button small-button">+ Buat Laporan</button>}
    </div>
    {error && <p className="error-message">{error}</p>}
    {loading ? <div className="loader-wrap"><span className="loading-spinner" /><p>Memuat laporan kegiatan...</p></div> : reports.length === 0 ? <div className="empty-state"><strong>Belum ada laporan kegiatan</strong><span>Laporan dan dokumentasi yang diterbitkan akan tampil di sini.</span></div> : <section className="kegiatan-grid">{reports.map((report) => <article className="kegiatan-card" key={report.id}><div className="kegiatan-gallery">{report.dokumentasi?.length ? report.dokumentasi.map((photo, index) => <img key={`${report.id}-${index}`} src={photo} alt={`${report.judul} dokumentasi ${index + 1}`} />) : <div className="kegiatan-no-photo">Tanpa foto</div>}</div><div className="kegiatan-card-body"><div className="kegiatan-meta"><span>{formatDate(report.tanggal)}</span><span>RT {report.id_rt || '-'} / RW {report.id_rw || '-'}</span></div><h2>{report.judul}</h2>{report.lokasi && <p className="kegiatan-location">Lokasi: {report.lokasi}</p>}<p>{report.deskripsi}</p></div></article>)}</section>}

    {showModal && <Modal title="Buat Laporan Kegiatan" onClose={() => !saving && setShowModal(false)}><form onSubmit={handleSubmit} className="data-form kegiatan-form"><div className="form-field-wrap"><label className="form-label" htmlFor="kegiatan-judul">Judul kegiatan</label><input id="kegiatan-judul" className="form-control" required value={form.judul} onChange={(event) => setForm({ ...form, judul: event.target.value })} /></div><div className="form-field-wrap"><label className="form-label" htmlFor="kegiatan-tanggal">Tanggal</label><input id="kegiatan-tanggal" type="date" className="form-control" required value={form.tanggal} onChange={(event) => setForm({ ...form, tanggal: event.target.value })} /></div><div className="form-field-wrap"><label className="form-label" htmlFor="kegiatan-lokasi">Lokasi</label><input id="kegiatan-lokasi" className="form-control" value={form.lokasi} onChange={(event) => setForm({ ...form, lokasi: event.target.value })} /></div><div className="form-field-wrap"><label className="form-label" htmlFor="kegiatan-deskripsi">Uraian kegiatan</label><textarea id="kegiatan-deskripsi" className="form-control kegiatan-textarea" required rows="5" value={form.deskripsi} onChange={(event) => setForm({ ...form, deskripsi: event.target.value })} /></div><div className="form-field-wrap"><label className="form-label" htmlFor="kegiatan-foto">Dokumentasi foto <span className="form-hint">maks. {MAX_PHOTOS} foto, 8 MB/foto</span></label><input id="kegiatan-foto" type="file" accept="image/*" multiple className="form-control kegiatan-file" onChange={handleFiles} />{form.dokumentasi.length > 0 && <span className="form-hint">{form.dokumentasi.length} foto siap diunggah</span>}</div><button type="submit" className="submit-button" disabled={saving}>{saving ? 'Menyimpan...' : 'Terbitkan Laporan'}</button></form></Modal>}
  </div>;
}