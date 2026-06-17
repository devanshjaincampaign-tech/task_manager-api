// app.js
require('dotenv').config();

const express    = require('express');
const path       = require('path');
const pool       = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const teamRoutes = require('./src/routes/teamRoutes');
const taskRoutes = require('./src/routes/taskRoutes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────
// GLOBAL MIDDLEWARE
// ─────────────────────────────────────────

app.use(express.json());

// Serve uploaded files as static files
// Files at /uploads/filename.jpg are publicly accessible
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logger
app.use((req, res, next) => {
  const time = new Date().toISOString().slice(11, 19);
  console.log(`[${time}] ${req.method} ${req.url}`);
  next();
});

// ─────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status:      'ok',
      environment: process.env.NODE_ENV,
      database:    'connected',
      timestamp:   new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// ─────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────

app.use('/api/auth',  authRoutes);
app.use('/api/teams', teamRoutes);

// Task routes are nested under teams
// /api/teams/:teamId/tasks
app.use('/api/teams/:teamId/tasks', taskRoutes);

// ─────────────────────────────────────────
// 404 HANDLER
// ─────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    error:   'Route Not Found',
    message: `${req.method} ${req.url} does not exist`,
    routes: {
      public:    ['GET /health', 'POST /api/auth/register', 'POST /api/auth/login'],
      protected: [
        'GET  /api/auth/me',
        'POST /api/teams',
        'GET  /api/teams',
        'GET  /api/teams/:teamId',
        'POST /api/teams/:teamId/members',
        'POST /api/teams/:teamId/tasks',
        'GET  /api/teams/:teamId/tasks',
        'PATCH /api/teams/:teamId/tasks/:taskId/status'
      ]
    }
  });
});

// ─────────────────────────────────────────
// ERROR HANDLER
// ─────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  // Handle multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error:   'File Too Large',
      message: 'File size must be under 5MB'
    });
  }

  // Handle multer file type error
  if (err.message && err.message.includes('File type not allowed')) {
    return res.status(400).json({
      error:   'Invalid File Type',
      message: err.message
    });
  }

  res.status(500).json({
    error:   'Server Error',
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Something went wrong'
  });
});

// ─────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────

app.listen(PORT, () => {
  console.log('');
  console.log(`Task Manager API → http://localhost:${PORT}`);
  console.log(`Environment      → ${process.env.NODE_ENV}`);
  console.log('');
});