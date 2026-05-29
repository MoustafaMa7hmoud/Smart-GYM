const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const createUploader = (folder, resourceType = 'auto', allowedFormats = []) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `smart-gym/${folder}`,
      resource_type: resourceType,
      allowed_formats: allowedFormats.length ? allowedFormats : undefined,
    },
  });

  return multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  });
};

const uploadImage  = createUploader('images', 'image', ['jpg', 'jpeg', 'png', 'webp']);
const uploadVideo  = createUploader('videos', 'video', ['mp4', 'mov', 'avi']);
const uploadAvatar = createUploader('avatars', 'image', ['jpg', 'jpeg', 'png', 'webp']);

module.exports = { uploadImage, uploadVideo, uploadAvatar };
