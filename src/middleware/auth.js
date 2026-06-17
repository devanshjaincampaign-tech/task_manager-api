// src/middleware/auth.js
require('dotenv').config();
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      error:   'Unauthorized',
      message: 'No token provided. Please log in.'
    });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error:   'Unauthorized',
      message: 'Token must be in format: Bearer <token>'
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error:   'Unauthorized',
      message: 'Token is empty'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { userId: decoded.userId, email: decoded.email };
    next();

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error:   'Token Expired',
        message: 'Your session has expired. Please log in again.'
      });
    }

    return res.status(401).json({
      error:   'Invalid Token',
      message: 'Token is invalid or has been tampered with'
    });
  }
};

module.exports = auth;