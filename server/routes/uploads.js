const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// store uploads in ./uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Allow all file types for now, but you can add restrictions here
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// single file upload - returns public URL
router.post('/avatar', upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/api/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});

// resume upload - returns public URL
router.post('/resume', upload.single('resume'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  // Validate file type
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Only PDF and Word documents are allowed' });
  }
  
  const url = `/api/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});

module.exports = router;
