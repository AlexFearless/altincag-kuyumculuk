import { v2 as cloudinary } from 'cloudinary';

let _configured = false;

function configureCloudinary() {
  if (_configured) return;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return;
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  _configured = true;
}

export function isCloudinaryConfigured() {
  configureCloudinary();
  return _configured;
}

export async function uploadToCloudinary(buffer, folder = 'altincag', filename) {
  configureCloudinary();
  if (!_configured) throw new Error('Cloudinary not configured');

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename,
        resource_type: 'image',
        format: 'jpg',
        quality: 'auto:good',
        fetch_format: 'auto',
        transformation: [
          { width: 1200, crop: 'limit' },
          { quality: 'auto:good' },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId) {
  configureCloudinary();
  if (!_configured) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {}
}

export function getCloudinaryUrl(publicId, options = {}) {
  configureCloudinary();
  if (!_configured) return null;
  return cloudinary.url(publicId, {
    secure: true,
    quality: 'auto:good',
    fetch_format: 'auto',
    ...options,
  });
}
