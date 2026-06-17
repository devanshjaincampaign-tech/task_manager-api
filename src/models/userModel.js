// src/models/userModel.js
// All database queries for users and auth tokens
const pool = require('../config/db');

const findByEmail = async (email) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
};

const findById = async (id) => {
  const result = await pool.query(
    'SELECT id, name, email, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

const emailExists = async (email) => {
  const result = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );
  return result.rows.length > 0;
};

const create = async (name, email, hashedPassword) => {
  const result = await pool.query(
    `INSERT INTO users (name, email, password)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name, email, hashedPassword]
  );
  return result.rows[0];
};

const saveRefreshToken = async (userId, token) => {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, token, expires]
  );
};

const findRefreshToken = async (token, userId) => {
  const result = await pool.query(
    `SELECT * FROM refresh_tokens
     WHERE token = $1 AND user_id = $2 AND expires_at > NOW()`,
    [token, userId]
  );
  return result.rows[0] || null;
};

const deleteRefreshToken = async (token) => {
  await pool.query(
    'DELETE FROM refresh_tokens WHERE token = $1',
    [token]
  );
};

module.exports = {
  findByEmail, findById, emailExists, create,
  saveRefreshToken, findRefreshToken, deleteRefreshToken
};