import { getDb } from '@/lib/supabase';
import { withAdminRole } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';
import crypto from 'crypto';

const uploadLimiter = rateLimit({ windowMs: 60000, max: 30, message: 'Çok fazla yükleme. 1 dakika bekleyin.' });

function genId() { return crypto.randomBytes(12).toString('hex'); }

function isValidImageBuffer(buffer) {
  if (buffer.length < 12) return false;
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return true;
  return false;
}

async function uploadToSupabaseStorage(db, buffer, path, ext) {
  const BUCKET = 'product-images';
  const contentType = `image/${ext}`;

  const bucketExists = await db.storage.getBucket(BUCKET).then(() => true).catch(() => false);
  if (!bucketExists) {
    await db.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });
  }

  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: false });

  if (uploadError) throw uploadError;

  const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(path);
  return urlData?.publicUrl;
}

async function handler(req, res) {
  if (!(await uploadLimiter(req, res))) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let db;
  try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı' }); }

  try {
    const { images, productId } = req.body;
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Görsel gerekli' });
    }
    if (images.length > 10) {
      return res.status(400).json({ error: 'En fazla 10 görsel yükleyebilirsiniz' });
    }

    const useCloudinary = isCloudinaryConfigured();
    const urls = [];

    for (const img of images) {
      if (typeof img !== 'string') continue;

      if (img.startsWith('http')) {
        urls.push(img);
        continue;
      }

      if (!img.startsWith('data:')) continue;

      const match = img.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!match) continue;

      const ext = match[1] === 'png' ? 'png' : match[1] === 'webp' ? 'webp' : 'jpeg';
      const buffer = Buffer.from(match[2], 'base64');

      if (buffer.length > 5 * 1024 * 1024) continue;
      if (!isValidImageBuffer(buffer)) continue;

      const filename = `${productId || 'temp'}/${genId()}`;

      try {
        if (useCloudinary) {
          const result = await uploadToCloudinary(buffer, 'altincag', filename);
          if (result?.secure_url) urls.push(result.secure_url);
        } else {
          const path = `${filename}.${ext}`;
          const url = await uploadToSupabaseStorage(db, buffer, path, ext);
          if (url) urls.push(url);
        }
      } catch (err) {
        console.error('Upload error:', err);
      }
    }

    res.status(200).json({ urls });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Görsel yüklenirken hata oluştu' });
  }
}

export default withAdminRole()(handler);
