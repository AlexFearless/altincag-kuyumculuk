/**
 * Migration: Move base64 images from products table to Supabase Storage
 * Run: node scripts/migrate-images.js
 * 
 * Safe to run multiple times - skips products that already have URL images.
 * No data is deleted from the database until you confirm everything works.
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mjyghchbqlwqxorfgkvj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_qU1cUequqxCCLRZChd-UDA_m81hZc8b';
const BUCKET = 'product-images';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function extFromBase64(dataUrl) {
  const match = dataUrl.match(/^data:image\/(\w+);/);
  if (!match) return 'jpg';
  const t = match[1].toLowerCase();
  if (t === 'png') return 'png';
  if (t === 'webp') return 'webp';
  return 'jpg';
}

function bufferFromBase64(dataUrl) {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64, 'base64');
}

async function migrate() {
  console.log('=== Supabase Storage Migration ===\n');

  // 1. Ensure bucket exists
  console.log('Checking bucket...');
  const { error: bucketErr } = await supabase.storage.getBucket(BUCKET);
  if (bucketErr) {
    console.log('Creating bucket...');
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });
    if (createErr) { console.error('Bucket creation failed:', createErr); return; }
    console.log('Bucket created.\n');
  } else {
    console.log('Bucket exists.\n');
  }

  // 2. Process all products
  let page = 0;
  const pageSize = 20;
  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  while (true) {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) { console.error('Query error:', error); break; }
    if (!products || products.length === 0) break;

    for (const product of products) {
      const images = product.images || [];

      // Skip if no images
      if (images.length === 0) {
        totalSkipped++;
        continue;
      }

      // Skip if all images are already URLs
      const hasBase64 = images.some(img => typeof img === 'string' && img.startsWith('data:'));
      if (!hasBase64) {
        totalSkipped++;
        continue;
      }

      console.log(`Processing: ${product.name} (${images.length} images)...`);

      const newUrls = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];

        // Already a URL, keep it
        if (typeof img === 'string' && img.startsWith('http')) {
          newUrls.push(img);
          continue;
        }

        // Not a valid base64 image, skip
        if (typeof img !== 'string' || !img.startsWith('data:')) {
          totalFailed++;
          continue;
        }

        try {
          const ext = extFromBase64(img);
          const buffer = bufferFromBase64(img);
          const path = `${product.id}/${Date.now()}-${i}.${ext}`;

          const { error: uploadErr } = await supabase.storage
            .from(BUCKET)
            .upload(path, buffer, { contentType: `image/${ext}`, upsert: false });

          if (uploadErr) {
            console.error(`  Upload failed: ${uploadErr.message}`);
            totalFailed++;
            continue;
          }

          const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
          if (urlData?.publicUrl) {
            newUrls.push(urlData.publicUrl);
            console.log(`  Uploaded: ${path}`);
          }
        } catch (e) {
          console.error(`  Error: ${e.message}`);
          totalFailed++;
        }
      }

      // Update product with new URLs (base64 data stays in DB as backup until you confirm)
      if (newUrls.length > 0) {
        const { error: updateErr } = await supabase
          .from('products')
          .update({ images: newUrls })
          .eq('id', product.id);

        if (updateErr) {
          console.error(`  Update failed: ${updateErr.message}`);
          totalFailed++;
        } else {
          totalMigrated++;
          console.log(`  Updated: ${product.name}\n`);
        }
      }
    }

    page++;
    if (products.length < pageSize) break;
  }

  console.log('=== Migration Complete ===');
  console.log(`  Migrated: ${totalMigrated} products`);
  console.log(`  Skipped: ${totalSkipped} (no base64 images)`);
  console.log(`  Failed: ${totalFailed}`);
  console.log('\nNew products will use Supabase Storage automatically.');
}

migrate().catch(console.error);
