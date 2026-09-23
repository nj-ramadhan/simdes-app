import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const LABEL = {
  global: 'Kas Global', sampah: 'Iuran Sampah', keamanan: 'Iuran Keamanan',
  'dana-sosial': 'Dana Sosial', 'dana-kematian': 'Dana Kematian', kompensasi: 'Dana Kompensasi',
};
const EMPTY_FORM = { tanggal: '', tipe: 'masuk', kategori: '', jumlah: '', keterangan: '' };
const currency = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

export default function LaporanKeuangan() {
  const { jenis } = useParams();
  const { user } = useAuth();
  const [transaksi, setTransaksi] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM, id_rw: user.id_rw ?? '', id_rt: user.id_rt ?? '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const canWrite = user.role === 'rt_admin' || user.role === 'rw_admin';

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [transactionsResponse, summaryResponse] = await Promise.all([
        client.get(`/keuangan/${jenis}`), client.get(`/keuangan/${jenis}/summary`),
      ]);
      setTransaksi(transactionsResponse.data);
      setSummary(summaryResponse.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat laporan keuangan');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jenis]);

  function resetForm() {
    setEditingTransaction(null);
    setForm({ ...EMPTY_FORM, id_rw: user.id_rw ?? '', id_rt: user.id_rt ?? '' });
  }

  function openCreate() {
    resetForm();
    setShowForm(true);
  }

  function openEdit(transaction) {
    setEditingTransaction(transaction);
    setForm({
      tanggal: transaction.tanggal ? String(transaction.tanggal).slice(0, 10) : '',
      tipe: transaction.tipe || 'masuk',
      kategori: transaction.kategori || '',
      jumlah: transaction.jumlah ?? '',
      keterangan: transaction.keterangan || '',
      id_rw: transaction.id_rw ?? '',
      id_rt: transaction.id_rt ?? '',
    });
    setShowForm(true);
  }

  async function handleDelete(transaction) {
    if (!window.confirm(`Hapus transaksi ${transaction.kategori || ''}?`)) return;
    setError('');
    try {
      await client.delete(`/keuangan/${jenis}?id=${encodeURIComponent(transaction.id)}`);
      await load();
    } catch (err) { setError(err.response?.data?.error || 'Gagal menghapus transaksi'); }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, jumlah: Number(form.jumlah), id_rw: form.id_rw === '' ? null : Number(form.id_rw), id_rt: form.id_rt === '' ? null : Number(form.id_rt) };
      if (editingTransaction) await client.put(`/keuangan/${jenis}?id=${encodeURIComponent(editingTransaction.id)}`, payload);
      else await client.post(`/keuangan/${jenis}`, payload);
      resetForm();
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan transaksi');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="finance-page">
      <header className="finance-header">
        <div><span className="section-kicker">Transparansi Keuangan</span><h1>{LABEL[jenis] || 'Laporan Keuangan'}</h1><p>Ringkasan transaksi yang tersimpan di database untuk wilayah Anda.</p></div>
        {canWrite && <button type="button" className="primary-button" onClick={() => showForm ? setShowForm(false) : openCreate()}>{showForm ? 'Tutup Form' : '+ Catat Transaksi'}</button>}
      </header>
      {error && <p className="finance-error">{error}</p>}
      {showForm && <form onSubmit={handleSubmit} className="finance-form"><div className="finance-form-grid">
        <label>Nomor RW<input required min="1" type="number" value={form.id_rw} onChange={(e) => setForm({ ...form, id_rw: e.target.value })} /></label>
        <label>Nomor RT<input min="1" type="number" value={form.id_rt} onChange={(e) => setForm({ ...form, id_rt: e.target.value })} /></label>
        <label>Tanggal<input required type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} /></label>
        <label>Tipe<select value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value })}><option value="masuk">Masuk</option><option value="keluar">Keluar</option></select></label>
        <label>Kategori<input required value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} /></label>
        <label>Jumlah<input required min="0" type="number" value={form.jumlah} onChange={(e) => setForm({ ...form, jumlah: e.target.value })} /></label>
        <label className="finance-form-wide">Keterangan<input value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} /></label>
      </div><button type="submit" className="submit-button" disabled={saving}>{saving ? 'Menyimpan...' : editingTransaction ? 'Simpan Perubahan' : 'Simpan Transaksi'}</button></form>}
      {loading ? <div className="finance-empty">Memuat data keuangan...</div> : <>
        <section className="finance-summary-grid"><FinanceStat label="Total Masuk" value={summary?.total_masuk} tone="income" /><FinanceStat label="Total Keluar" value={summary?.total_keluar} tone="expense" /><FinanceStat label="Saldo Berjalan" value={summary?.saldo} tone="balance" /><FinanceStat label="Jumlah Transaksi" value={summary?.jumlah_transaksi || 0} tone="count" isCount /></section>
        <section className="finance-table-panel"><div className="panel-header"><div><span className="panel-kicker">Data Database</span><h2 className="panel-title">Riwayat Transaksi</h2></div><span className="badge badge-info">{transaksi.length} transaksi</span></div>
          {transaksi.length === 0 ? <div className="finance-empty">Belum ada transaksi pada laporan ini.</div> : <div className="finance-table-wrap"><table className="finance-table"><thead><tr><th>Tanggal</th><th>Tipe</th><th>Kategori</th><th>Jumlah</th><th>Keterangan</th>{jenis !== 'global' && canWrite && <th>Aksi</th>}</tr></thead><tbody>{transaksi.map((item) => <tr key={`${item.sumber || jenis}-${item.id}`}><td>{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}</td><td><span className={`transaction-type ${item.tipe}`}>{item.tipe}</span></td><td>{item.kategori || '-'}</td><td className="amount">{currency(item.jumlah)}</td><td>{item.keterangan || '-'}</td>{jenis !== 'global' && canWrite && <td><div className="finance-actions"><button type="button" className="table-button table-button-edit" onClick={() => openEdit(item)}>Edit</button><button type="button" className="table-button table-button-delete" onClick={() => handleDelete(item)}>Hapus</button></div></td>}</tr>)}</tbody></table></div>}
        </section>
      </>}
    </div>
  );
}

function FinanceStat({ label, value, tone, isCount = false }) {
  return <article className={`finance-stat finance-stat-${tone}`}><span className="finance-stat-label">{label}</span><strong>{isCount ? Number(value || 0).toLocaleString('id-ID') : currency(value)}</strong></article>;
}
