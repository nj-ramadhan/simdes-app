import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatDateInput } from '../../utils/formatters';

const LABEL = {
  global: 'Kas Global', sampah: 'Dana Kebersihan', keamanan: 'Dana Keamanan',
  'dana-sosial': 'Dana Sosial', 'dana-kematian': 'Dana Kematian', kompensasi: 'Dana Kompensasi',
};
const EMPTY_FORM = { tanggal: '', tipe: 'masuk', kategori: '', jumlah: '', keterangan: '' };
const currency = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sept', 'Okt', 'Nov', 'Des'];
const DESCRIPTION_LIMIT = 10;

function parseFinanceDate(value) {
  if (!value) return '-';
  const rawValue = String(value).trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawValue)
    ? new Date(`${rawValue}T00:00:00`)
    : new Date(rawValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatFinanceDate(value) {
  const date = parseFinanceDate(value);
  if (!date) return '-';
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function summarizeDescription(value) {
  const description = String(value || '-').trim().replace(/\s+/g, ' ');
  if (description.length <= DESCRIPTION_LIMIT) return description;
  return `${description.slice(0, DESCRIPTION_LIMIT - 1).trimEnd()}…`;
}

function getFinanceDateKey(value) {
  const date = parseFinanceDate(value);
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const OTHER_FEE_TYPES = [
  { key: 'dana-sosial', label: 'Dana Sosial' },
  { key: 'dana-kematian', label: 'Dana Kematian' },
  { key: 'kompensasi', label: 'Kompensasi' },
];

function createPaymentForm() {
  const date = new Date();
  return {
    tanggal: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    tipe: 'masuk',
    id_warga: '',
    dana_lain_jenis: 'dana-sosial',
    iuran: { sampah: '', keamanan: '', dana_lain: '' },
    keterangan: '',
  };
}

export default function LaporanKeuangan() {
  const { jenis } = useParams();
  const { user } = useAuth();
  const [transaksi, setTransaksi] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [residents, setResidents] = useState([]);
  const [paymentForm, setPaymentForm] = useState(createPaymentForm);
  const [form, setForm] = useState({ ...EMPTY_FORM, id_rw: user.id_rw ?? '', id_rt: user.id_rt ?? '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const canWrite = user.role === 'rt_admin' || user.role === 'rw_admin';
  const reportRows = jenis === 'global' ? combineFeeTransactions(transaksi) : transaksi;
  const monthGroups = groupTransactionsByMonth(reportRows);
  const paymentTotal = Number(paymentForm.iuran.sampah || 0)
    + Number(paymentForm.iuran.keamanan || 0)
    + Number(paymentForm.iuran.dana_lain || 0);

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

  useEffect(() => {
    if (!canWrite || jenis !== 'global') return;
    client.get('/warga')
      .then((response) => setResidents(response.data))
      .catch((err) => setError(err.response?.data?.error || 'Gagal memuat daftar warga'));
  }, [canWrite, jenis]);

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
      tanggal: formatDateInput(transaction.tanggal),
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

  async function handlePaymentSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await client.post('/keuangan/global/iuran-bulanan', paymentForm);
      setPaymentForm(createPaymentForm());
      setShowPaymentForm(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan iuran bulanan');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="finance-page">
      <header className="finance-header">
        <div><span className="section-kicker">Transparansi Keuangan</span><h1>{LABEL[jenis] || 'Laporan Keuangan'}</h1><p>Ringkasan transaksi yang tersimpan di database untuk wilayah Anda.</p></div>
        {canWrite && <div className="finance-header-actions">{jenis === 'global' ? <button type="button" className="primary-button" onClick={() => setShowPaymentForm((visible) => !visible)}>{showPaymentForm ? 'Tutup Form' : '+ Catat Pembayaran'}</button> : <button type="button" className="primary-button" onClick={() => showForm ? setShowForm(false) : openCreate()}>{showForm ? 'Tutup Form' : '+ Catat Transaksi'}</button>}</div>}
      </header>
      {error && <p className="finance-error">{error}</p>}
      {showPaymentForm && jenis === 'global' && <form onSubmit={handlePaymentSubmit} className="finance-form">
        <div className="panel-header"><div><span className="panel-kicker">Pencatatan Pembayaran</span><h2 className="panel-title">Iuran warga</h2></div></div>
        <div className="finance-form-grid">
          <label>Tanggal<input required type="date" value={paymentForm.tanggal} onChange={(event) => setPaymentForm({ ...paymentForm, tanggal: event.target.value })} /></label>
          <label>Tipe<select value={paymentForm.tipe} onChange={(event) => setPaymentForm({ ...paymentForm, tipe: event.target.value })}><option value="masuk">Masuk</option><option value="keluar">Keluar</option></select></label>
          <label className="finance-form-wide">Nama warga<select required value={paymentForm.id_warga} onChange={(event) => setPaymentForm({ ...paymentForm, id_warga: event.target.value })}><option value="">Pilih warga terdaftar</option>{residents.map((resident) => <option key={resident.id_warga} value={resident.id_warga}>{resident.nama}</option>)}</select></label>
        </div>
        <div className="finance-table-wrap finance-entry-table-wrap"><table className="finance-table finance-entry-table"><thead><tr><th>Jenis Iuran</th><th>Kategori Dana Lain</th><th>Nominal</th></tr></thead><tbody>
          <tr><td>Kebersihan</td><td>-</td><td><input aria-label="Iuran Kebersihan" min="0" step="1" type="number" value={paymentForm.iuran.sampah} onChange={(event) => setPaymentForm({ ...paymentForm, iuran: { ...paymentForm.iuran, sampah: event.target.value } })} /></td></tr>
          <tr><td>Keamanan</td><td>-</td><td><input aria-label="Iuran Keamanan" min="0" step="1" type="number" value={paymentForm.iuran.keamanan} onChange={(event) => setPaymentForm({ ...paymentForm, iuran: { ...paymentForm.iuran, keamanan: event.target.value } })} /></td></tr>
          <tr><td>Dana Lain</td><td><select aria-label="Kategori Dana Lain" value={paymentForm.dana_lain_jenis} onChange={(event) => setPaymentForm({ ...paymentForm, dana_lain_jenis: event.target.value })}>{OTHER_FEE_TYPES.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}</select></td><td><input aria-label="Dana Lain" min="0" step="1" type="number" value={paymentForm.iuran.dana_lain} onChange={(event) => setPaymentForm({ ...paymentForm, iuran: { ...paymentForm.iuran, dana_lain: event.target.value } })} /></td></tr>
          <tr><th colSpan="2">Total</th><th className="amount">{currency(paymentTotal)}</th></tr>
        </tbody></table></div>
        <label className="finance-form-wide">Keterangan<input value={paymentForm.keterangan} onChange={(event) => setPaymentForm({ ...paymentForm, keterangan: event.target.value })} /></label>
        <button type="submit" className="submit-button" disabled={saving || residents.length === 0}>{saving ? 'Menyimpan...' : 'Simpan Pembayaran'}</button>
        {residents.length === 0 && <p className="finance-form-note">Belum ada warga terdaftar dalam wilayah Anda.</p>}
      </form>}
      {showForm && jenis !== 'global' && <form onSubmit={handleSubmit} className="finance-form"><div className="finance-form-grid">
        <label>Tanggal<input required type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} /></label>
        <label>Tipe<select value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value })}><option value="masuk">Masuk</option><option value="keluar">Keluar</option></select></label>
        <label>Kategori<input required value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} /></label>
        <label>Jumlah<input required min="0" type="number" value={form.jumlah} onChange={(e) => setForm({ ...form, jumlah: e.target.value })} /></label>
        <label className="finance-form-wide">Keterangan<input value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} /></label>
      </div><button type="submit" className="submit-button" disabled={saving}>{saving ? 'Menyimpan...' : editingTransaction ? 'Simpan Perubahan' : 'Simpan Transaksi'}</button></form>}
      {loading ? <div className="finance-empty">Memuat data keuangan...</div> : <>
        <section className="finance-summary-grid"><FinanceStat label="Total Masuk" value={summary?.total_masuk} tone="income" /><FinanceStat label="Total Keluar" value={summary?.total_keluar} tone="expense" /><FinanceStat label="Saldo Berjalan" value={summary?.saldo} tone="balance" /><FinanceStat label="Jumlah Transaksi" value={summary?.jumlah_transaksi || 0} tone="count" isCount /></section>
        <section className="finance-table-panel">
          <div className="panel-header"><div><span className="panel-kicker">Data Database</span><h2 className="panel-title">Riwayat Transaksi</h2></div><span className="badge badge-info">{reportRows.length} {jenis === 'global' ? 'pembayaran' : 'transaksi'}</span></div>
          {reportRows.length === 0 ? <div className="finance-empty">Belum ada transaksi pada laporan ini.</div> : <div className="finance-month-groups">{monthGroups.map((group) => <section className="finance-month-group" key={group.key}>
            <h3 className="finance-period-title">{group.label}<span>{group.rows.length} {jenis === 'global' ? 'pembayaran' : 'transaksi'}</span></h3>
            <div className="finance-table-wrap"><table className="finance-table">
              <thead>{jenis === 'global' ? <tr><th>Tanggal</th><th className="finance-text-left">Tipe</th><th className="finance-text-left">Nama Warga</th><th className="finance-money">Kebersihan</th><th className="finance-money">Keamanan</th><th className="finance-money">Dana Lain</th><th className="finance-money">Total</th><th className="finance-text-left">Keterangan</th></tr> : <tr><th>Tanggal</th><th>Tipe</th><th>Kategori</th><th>Warga</th><th>Jumlah</th><th>Keterangan</th>{canWrite && <th>Aksi</th>}</tr>}</thead>
              <tbody>{group.rows.map((item) => jenis === 'global' ? <tr key={item.id}>
                <td>{formatFinanceDate(item.tanggal)}</td><td className="finance-text-left"><span className={`transaction-type ${item.tipe}`}>{item.tipe}</span></td><td className="finance-text-left">{item.nama_warga}</td>
                <td className="amount">{currency(item.kebersihan)}</td><td className="amount">{currency(item.keamanan)}</td><td className="amount">{currency(item.dana_lain)}</td><td className="amount">{currency(item.total)}</td>
                <td className="finance-description" title={item.keterangan}>{summarizeDescription(item.keterangan)}</td>
              </tr> : <tr key={`${item.sumber || jenis}-${item.id}`}>
                <td>{formatFinanceDate(item.tanggal)}</td><td><span className={`transaction-type ${item.tipe}`}>{item.tipe}</span></td><td>{item.kategori || '-'}</td><td>{item.nama_warga || '-'}</td><td className="amount">{currency(item.jumlah)}</td>
                <td className="finance-description" title={item.keterangan || ''}>{summarizeDescription(item.keterangan)}</td>
                {canWrite && <td><div className="finance-actions"><button type="button" className="table-button table-button-edit" onClick={() => openEdit(item)}>Edit</button><button type="button" className="table-button table-button-delete" onClick={() => handleDelete(item)}>Hapus</button></div></td>}
              </tr>)}</tbody>
            </table></div>
          </section>)}</div>}
        </section>
      </>}
    </div>
  );
}

function FinanceStat({ label, value, tone, isCount = false }) {
  return <article className={`finance-stat finance-stat-${tone}`}><span className="finance-stat-label">{label}</span><strong>{isCount ? Number(value || 0).toLocaleString('id-ID') : currency(value)}</strong></article>;
}

function combineFeeTransactions(items) {
  const payments = new Map();
  items.forEach((item) => {
    const date = getFinanceDateKey(item.tanggal) || 'unknown';
    const resident = item.id_warga || item.nama_warga;
    const batch = item.created_at || item.keterangan || '';
    const key = resident
      ? [date, item.tipe, resident, batch].join('|')
      : `${item.sumber || 'global'}:${item.id}`;
    const payment = payments.get(key) || {
      id: key,
      tanggal: item.tanggal,
      tipe: item.tipe,
      nama_warga: item.nama_warga || '-',
      kebersihan: 0,
      keamanan: 0,
      dana_lain: 0,
      total: 0,
      keterangan: item.keterangan || '-',
    };
    const fee = item.sumber === 'sampah' ? 'kebersihan' : item.sumber === 'keamanan' ? 'keamanan' : 'dana_lain';
    const amount = Number(item.jumlah || 0);
    payment[fee] += amount;
    payment.total += amount;
    payments.set(key, payment);
  });
  return Array.from(payments.values()).sort((a, b) => String(b.tanggal || '').localeCompare(String(a.tanggal || '')));
}

function groupTransactionsByMonth(items) {
  const groups = new Map();
  items.forEach((item) => {
    const dateKey = getFinanceDateKey(item.tanggal);
    const key = dateKey ? dateKey.slice(0, 7) : 'unknown';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  return Array.from(groups, ([key, rows]) => ({
    key,
    rows,
    label: key === 'unknown'
      ? 'Periode tidak diketahui'
      : new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(`${key}-01T12:00:00`)),
  })).sort((a, b) => b.key.localeCompare(a.key));
}
