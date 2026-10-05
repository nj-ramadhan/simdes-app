import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ path: '.env.local', override: true });

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL;
    const isLocalDb = /localhost|127\.0\.0\.1/.test(connectionString || '');
    pool = new Pool({
      connectionString,
      ssl: isLocalDb ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

function toTableName(name) {
  return name.toLowerCase();
}

export async function getRows(tableName, filterFn = null) {
  const { rows } = await getPool().query(`SELECT * FROM ${toTableName(tableName)}`);
  return filterFn ? rows.filter(filterFn) : rows;
}

export async function addRow(tableName, rowData) {
  const keys = Object.keys(rowData);
  const values = Object.values(rowData);
  const columns = keys.join(', ');
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
  const { rows } = await getPool().query(
    `INSERT INTO ${toTableName(tableName)} (${columns}) VALUES (${placeholders}) RETURNING *`,
    values
  );
  return rows[0];
}

export async function addRows(batch) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const createdRows = [];
    for (const { tableName, rowData } of batch) {
      const keys = Object.keys(rowData);
      const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
      const { rows } = await client.query(
        `INSERT INTO ${toTableName(tableName)} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        Object.values(rowData)
      );
      createdRows.push(rows[0]);
    }
    await client.query('COMMIT');
    return createdRows;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateRowById(tableName, idField, idValue, newData) {
  const keys = Object.keys(newData);
  if (keys.length === 0) throw new Error('Tidak ada data untuk diupdate');
  const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
  const { rows } = await getPool().query(
    `UPDATE ${toTableName(tableName)} SET ${setClause} WHERE ${idField} = $${keys.length + 1} RETURNING *`,
    [...Object.values(newData), idValue]
  );
  if (rows.length === 0) throw new Error('Data tidak ditemukan');
  return rows[0];
}

export async function deleteRowById(tableName, idField, idValue) {
  const result = await getPool().query(
    `DELETE FROM ${toTableName(tableName)} WHERE ${idField} = $1`,
    [idValue]
  );
  if (result.rowCount === 0) throw new Error('Data tidak ditemukan');
  return true;
}
