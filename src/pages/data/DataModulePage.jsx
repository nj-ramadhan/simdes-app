import { useEffect, useState } from 'react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';

// Komponen generic — dipakai ulang oleh semua halaman modul data
// (Sensus, Lingkungan, Infrastruktur, dan Aset).
// Perilaku baca/tulis otomatis menyesuaikan role user yang sedang login.
export default function DataModulePage({ config }) {
  const { title, apiPath, idField, columns, formFields } = config;
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [sort, setSort] = useState({ key: '', direction: 'asc' });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');

  const canWrite = user.role === 'rt_admin' || user.role === 'rw_admin';
  const sortedData = sort.key
    ? [...data].sort((left, right) => {
      const result = String(left[sort.key] ?? '').localeCompare(
        String(right[sort.key] ?? ''),
        'id',
        { numeric: true, sensitivity: 'base' },
      );
      return sort.direction === 'asc' ? result : -result;
    })
    : data;

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data: rows } = await client.get(`/${apiPath}`);
      setData(rows);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Data loading synchronizes this view with the selected API module.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPath]);

  function openCreate() {
    setEditing(null);
    setForm({
      ...(user.id_rw != null ? { id_rw: user.id_rw } : {}),
      ...(user.id_rt != null ? { id_rt: user.id_rt } : {}),
    });
    setShowModal(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm(row);
    setShowModal(true);
  }

  async function handleDelete(row) {
    if (!confirm('Hapus data ini?')) return;
    try {
      await client.delete(`/${apiPath}/${row[idField]}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus data');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await client.put(`/${apiPath}/${editing[idField]}`, form);
      } else {
        await client.post(`/${apiPath}`, form);
      }
      setShowModal(false);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menyimpan data');
    }
  }

  return (
    <div className="data-page">
      <div className="data-page-header">
        <div>
          <span className="section-kicker">Data Master</span>
          <h1>{title}</h1>
        </div>
        {canWrite && (
          <button onClick={openCreate} className="primary-button small-button">
            + Tambah Data
          </button>
        )}
      </div>

      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <div className="loader-wrap">
          <span className="loading-spinner"></span>
          <p>Memuat data...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={sortedData}
          canWrite={canWrite}
          onEdit={openEdit}
          onDelete={handleDelete}
          sort={sort}
          onSort={(key) => setSort((current) => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
          }))}
        />
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Data' : 'Tambah Data'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="data-form">
            {formFields.map((field) => (
              <FormField
                key={field.key}
                field={field}
                value={form[field.key]}
                onChange={(k, v) => setForm((prev) => ({ ...prev, [k]: v }))}
              />
            ))}
            <button type="submit" className="submit-button">
              Simpan
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
