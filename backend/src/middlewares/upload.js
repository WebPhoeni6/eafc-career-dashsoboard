const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { AppError } = require('./error');

const uploadsRoot = path.resolve(process.cwd(), 'uploads', 'matches');
fs.mkdirSync(uploadsRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsRoot),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.mimetype)) {
    cb(new AppError('Only JPG, PNG, or WEBP images are allowed', 400, 'BAD_REQUEST'));
    return;
  }
  cb(null, true);
}

const matchImageUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const matchAnalysisUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 4 },
});

module.exports = {
  matchImageUpload,
  matchAnalysisUpload,
};
