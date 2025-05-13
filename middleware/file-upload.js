const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

cloudinary.config({ 
  cloud_name: process.env.REACT_CLOUDINARY_NAME, 
  api_key: process.env.REACT_CLOUDINARY_API_KEY, 
  api_secret: process.env.REACT_CLOUDINARY_API_SECRET 
});

const HttpError = require('../models/http-error');

const MIME_TYPE_MAP = {
  // 'application/pdf': 'pdf',
  // 'application/msword': 'doc',
  // 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  // 'application/vnd.ms-excel': 'xls',
  // 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  // 'application/vnd.ms-powerpoint': 'ppt',
  // 'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  // 'text/plain': 'txt',
  'image/jpg': 'jpg',
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp'
};

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'bbx/parts', // Customize the folder where uploads will be stored in Cloudinary.
    format: async (req, file) => MIME_TYPE_MAP[file.mimetype], // Use MIME_TYPE_MAP to determine format.
    public_id: (req, file) => uuidv4(), // Generate a unique identifier for the file.
  },
  transformation: [{ width: 500, height: 500, crop: 'limit' }], // Optional: Apply transformations to the uploaded image.
});

const fileUpload = multer({
  limits: { fileSize: 50 * 1024 * 1024 },
  storage: storage,
  fileFilter: (req, file, cb) => {
    const isValid = !!MIME_TYPE_MAP[file.mimetype];
    let error = isValid ? null : new HttpError('Invalid file type!', 422);
    cb(error, isValid);
  }
});

module.exports = fileUpload;
