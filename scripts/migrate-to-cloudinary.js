/**
 * Supabase Storage → Cloudinary Migration Script
 *
 * Mevcut tüm ürün görsellerini Supabase Storage'dan
 * Cloudinary'ye taşır ve veritabanındaki URL'leri günceller.
 *
 * Kullanım: node scripts/migrate-to-cloudinary.js
 */

import 'dotenv/config';
import { config } from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET = 'product-images';

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!SUPABASE_SERVICE_KEY) { console.error('SUPABASE_SERVICE_ROLE_KEY gerekli'); process.exit(1); }
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('Cloudinary credential\'ları gerekli'); process.exit(1);
}

cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const stats = { total: 0, migrated: 0, skipped: 0, errors: 0, updated: 0 };

async function listFilesInFolder(folder) {
  const files = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).list(folder, { limit: 100, offset });
    if (error) break;
    if (!data || data.length === 0) break;
    for (const item of data) {
      if (item.id) files.push({ name: item.name, folder });
    }
    if (data.length < 100) break;
    offset += 100;
  }
  return files;
}

async function listAllFolders() {
  const folders = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).list('', { limit: 100, offset });
    if (error) break;
    if (!data || data.length === 0) break;
    for (const item of data) {
      if (!item.id && item.name) folders.push(item.name);
    }
    if (data.length < 100) break;
    offset += 100;
  }
  return folders;
}

function uploadToCloudinary(buffer, publicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'altincag', public_id: publicId, resource_type: 'image', format: 'jpg', quality: 'auto:good', fetch_format: 'auto', transformation: [{ width: 1200, crop: 'limit' }, { quality: 'auto:good' }] },
      (error, result) => { if (error) reject(error); else resolve(result); }
    ).end(buffer);
  });
}

async function migrate() {
  console.log('=== Supabase Storage → Cloudinary Migration ===\n');

  const folders = await listAllFolders();
  console.log(`${folders.length} klasör bulundu\n`);

  for (const folder of folders) {
    if (folder === '.' || folder === '..') continue;
    console.log(`Klasör: ${folder}`);
    const files = await listFilesInFolder(folder);
    console.log(`  ${files.length} dosya`);

    for (const file of files) {
      stats.total++;
      const filePath = `${file.folder}/${file.name}`;
      const publicId = filePath.replace(/\.[^.]+$/, '');

      try {
        const { data: blob, error: dlErr } = await supabase.storage.from(SUPABASE_BUCKET).download(filePath);
        if (dlErr) { stats.errors++; continue; }

        const buffer = Buffer.from(await blob.arrayBuffer());
        const result = await uploadToCloudinary(buffer, publicId);
        stats.migrated++;

        const oldUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${filePath}`;
        const newUrl = result.secure_url;

        const { data: products } = await supabase.from('products').select('id, images').contains('images', [oldUrl]);
        for (const product of (products || [])) {
          const newImages = (product.images || []).map(img => img === oldUrl ? newUrl : img);
          const { error } = await supabase.from('products').update({ images: newImages }).eq('id', product.id);
          if (!error) stats.updated++;
        }

        process.stdout.write(`  ✓ ${file.name} → Cloudinary\n`);
      } catch (err) {
        console.error(`  ✗ ${file.name}: ${err.message}`);
        stats.errors++;
      }
    }
  }

  console.log(`\n=== Tamamlandı ===`);
  console.log(`Toplam: ${stats.total} | Taşınan: ${stats.migrated} | URL Güncellenen: ${stats.updated} | Hatalı: ${stats.errors}`);

  fs.writeFileSync(path.join(process.cwd(), 'scripts', 'cloudinary-migration-log.json'), JSON.stringify(stats, null, 2));
}

migrate().catch(err => { console.error('Migration hatası:', err); process.exit(1); });
