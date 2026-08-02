/**
 * Migration: Move base64 images to Supabase Storage
 * Run: node scripts/migrate-images.js
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mjyghchbqlwqxorfgkvj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_qU1cUequqxCCLRZChd-UDA_m81hZc8b';
const BUCKET = 'product-images';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function extFromBase64(dataUrl) {
  const match = dataUrl.match(/^data:image\/(\w+);/);
  if (!match) return 'jpeg';
  const t = match[1].toLowerCase();
  if (t === 'png') return 'png';
  if (t === 'webp') return 'webp';
  return 'jpeg';
}

function bufferFromBase64(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  return Buffer.from(base64, 'base64');
}

async function migrate() {
  console.log('=== Storage Migration ===\n');

  // 1. Bucket kontrol
  console.log('1. Bucket kontrol...');
  const { data: bucket, error: bucketErr } = await supabase.storage.getBucket(BUCKET);
  if (bucketErr) {
    console.log('   Bucket bulunamadı, oluşturuluyor...');
    const { data, error: createErr } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });
    if (createErr) {
      console.error('   BUCKET OLUSTURULAMADI:', createErr.message);
      console.error('   Supabase Dashboard > Storage > New bucket ile olusturun:', BUCKET);
      return;
    }
    console.log('   Bucket olusturuldu.\n');
  } else {
    console.log('   Bucket mevcut.\n');
  }

  // 2. Ürünleri çek
  console.log('2. Urunler cekiliyor...');
  const { data: products, error: queryErr } = await supabase
    .from('products')
    .select('id, name, images');

  if (queryErr) {
    console.error('   SORGU HATASI:', queryErr.message);
    return;
  }

  console.log(`   ${products.length} urun bulundu.\n`);

  let migrated = 0, skipped = 0, failed = 0;

  // 3. Her ürünü işle
  for (const product of products) {
    const images = product.images || [];

    if (images.length === 0) {
      skipped++;
      continue;
    }

    const hasBase64 = images.some(img => typeof img === 'string' && img.startsWith('data:'));
    if (!hasBase64) {
      skipped++;
      continue;
    }

    process.stdout.write(`   ${product.name}... `);

    const newUrls = [];
    let hasError = false;

    for (let i = 0; i < images.length; i++) {
      const img = images[i];

      if (typeof img === 'string' && img.startsWith('http')) {
        newUrls.push(img);
        continue;
      }

      if (typeof img !== 'string' || !img.startsWith('data:')) {
        console.log(`[gorsel ${i+1}: format uyumsuz]`);
        hasError = true;
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
          console.log(`[gorsel ${i+1}: upload hatasi - ${uploadErr.message}]`);
          hasError = true;
          continue;
        }

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
        if (urlData?.publicUrl) {
          newUrls.push(urlData.publicUrl);
        } else {
          console.log(`[gorsel ${i+1}: URL alinamadi]`);
          hasError = true;
        }
      } catch (e) {
        console.log(`[gorsel ${i+1}: ${e.message}]`);
        hasError = true;
      }
    }

    if (newUrls.length > 0) {
      const { error: updateErr } = await supabase
        .from('products')
        .update({ images: newUrls })
        .eq('id', product.id);

      if (updateErr) {
        console.log(`[DB guncelleme hatasi: ${updateErr.message}]`);
        failed++;
      } else {
        migrated++;
        console.log(hasError ? 'tamamlandi (kismi)' : 'tamam');
      }
    } else {
      console.log('atlandi (gorsel yok)');
      skipped++;
    }
  }

  console.log('\n=== Tamamlandi ===');
  console.log(`   Tasinan: ${migrated}`);
  console.log(`   Atlanan: ${skipped}`);
  console.log(`   Basarisiz: ${failed}`);
}

migrate().catch(e => console.error('GENEL HATA:', e.message));
