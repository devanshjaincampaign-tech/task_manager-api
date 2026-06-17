// src/config/db.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max:      10,
  idleTimeoutMillis:       30000,
  connectionTimeoutMillis: 2000
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    return;
  }
  console.log('PostgreSQL connected');
  release();
});

pool.on('error', (err) => {
  console.error('Pool error:', err.message);
});

module.exports = pool;