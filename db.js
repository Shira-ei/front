const mysql = require('mysql2/promise');

const CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};
const DB_NAME = process.env.DB_NAME || 'clientes_db';

if (!/^[A-Za-z0-9_]{1,64}$/.test(DB_NAME)) {
  throw new Error('DB_NAME solo puede tener letras, números y guion bajo (máximo 64).');
}

let pool = null;

async function iniciar() {
  const conexion = await mysql.createConnection(CONFIG);
  try {
    await conexion.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await conexion.end();
  }

  pool = mysql.createPool({ ...CONFIG, database: DB_NAME, waitForConnections: true, connectionLimit: 10 });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clientes (
      id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      nombre     VARCHAR(100) NOT NULL,
      email      VARCHAR(150) NOT NULL,
      telefono   VARCHAR(20)  NULL,
      ciudad     VARCHAR(80)  NULL,
      creado_en  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_clientes_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function cerrar() {
  if (pool) await pool.end();
  pool = null;
}

const COLUMNAS = 'id, nombre, email, telefono, ciudad, creado_en';

async function listarClientes() {
  const [filas] = await pool.query(`SELECT ${COLUMNAS} FROM clientes ORDER BY id DESC`);
  return filas;
}

async function obtenerCliente(id) {
  const [filas] = await pool.query(`SELECT ${COLUMNAS} FROM clientes WHERE id = ?`, [id]);
  return filas[0] || null;
}

async function crearCliente({ nombre, email, telefono, ciudad }) {
  const [res] = await pool.query(
    'INSERT INTO clientes (nombre, email, telefono, ciudad) VALUES (?, ?, ?, ?)',
    [nombre, email, telefono || null, ciudad || null]
  );
  return obtenerCliente(res.insertId);
}

async function actualizarCliente(id, { nombre, email, telefono, ciudad }) {
  await pool.query(
    'UPDATE clientes SET nombre = ?, email = ?, telefono = ?, ciudad = ? WHERE id = ?',
    [nombre, email, telefono || null, ciudad || null, id]
  );
  return obtenerCliente(id);
}

async function eliminarCliente(id) {
  const [res] = await pool.query('DELETE FROM clientes WHERE id = ?', [id]);
  return res.affectedRows > 0;
}

module.exports = {
  iniciar,
  cerrar,
  listarClientes,
  obtenerCliente,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
  nombreBD: DB_NAME,
  destino: `${CONFIG.host}:${CONFIG.port}`,
};
