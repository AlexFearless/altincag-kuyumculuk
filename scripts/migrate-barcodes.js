const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mjyghchbqlwqxorfgkvj.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_qU1cUequqxCCLRZChd-UDA_m81hZc8b';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function migrateBarcodes() {
  console.log('Ürünler yükleniyor...');

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, description, barcode');

  if (error) {
    console.error('Hata:', error);
    return;
  }

  console.log(`${products.length} ürün bulundu.\n`);

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const desc = (product.description || '').trim();

    if (!desc) {
      skipped++;
      continue;
    }

    const barcodePattern = /^(KP|kp|Kp|kP)\s*\d+$/i;
    const isBarcode = barcodePattern.test(desc);

    if (isBarcode && !product.barcode) {
      const newBarcode = desc.replace(/\s+/g, '').toUpperCase();

      const { error: updateError } = await supabase
        .from('products')
        .update({
          barcode: newBarcode,
          description: '',
        })
        .eq('id', product.id);

      if (updateError) {
        console.error(`❌ ${product.name} güncellenemedi:`, updateError.message);
      } else {
        console.log(`✓ ${product.name} → Barkod: ${newBarcode} (açıklama silindi)`);
        updated++;
      }
    } else if (isBarcode && product.barcode) {
      console.log(`- ${product.name} → Zaten barkod var: ${product.barcode}, atlandı`);
      skipped++;
    } else {
      skipped++;
    }
  }

  console.log(`\nTamamlandı: ${updated} ürün güncellendi, ${skipped} ürün atlandı.`);
}

migrateBarcodes();
