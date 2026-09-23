import { formatDate } from '../../utils/formatters';

function displayValue(column, value) {
  if (value == null || value === '') return '-';
  if (/^(tanggal|tgl_|created_at|updated_at)/.test(column.key)) return formatDate(value);
  return value;
}

export default function DataTable({ columns, data, onEdit, onDelete, canWrite }) {
  return (
    <div className="table-shell">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(col => <th key={col.key}>{col.label}</th>)}
            {canWrite && <th className="text-center">Aksi</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id || i}>
              {columns.map(col => <td key={col.key}>{displayValue(col, row[col.key])}</td>)}
              {canWrite && (
                <td className="action-cell">
                  <button onClick={() => onEdit(row)} className="table-button table-button-edit">Edit</button>
                  <button onClick={() => onDelete(row)} className="table-button table-button-delete">Hapus</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}