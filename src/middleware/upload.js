// src/middleware/upload.js
// Handles file upload configuration using Multer
//
// Multer processes multipart/form-data requests
// which is the format used for file uploads
//
// It reads the file from the request, saves it to disk,
// and adds file info to req.file so the controller can use it

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Make sure the uploads folder exists
const uploadDir = process.env.UPLOAD_PATH || 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure where and how files are stored
const storage = multer.diskStorage({

  // Set destination folder
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  // Generate unique filename to prevent collisions
  // Format: timestamp-randomnumber-originalname
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext          = path.extname(file.originalname);
    const baseName     = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '-') // replace special chars with dash
      .toLowerCase();
    cb(null, `${uniqueSuffix}-${baseName}${ext}`);
  }
});

// Only allow these file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);  // accept file
  } else {
    cb(new Error('File type not allowed. Accepted types: images, PDF, text, Word documents'), false);
  }
};

const upload = multer({
  storage:   storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  }
});

module.exports = upload;