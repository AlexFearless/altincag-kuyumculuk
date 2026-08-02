/**
 * Debug: Check what format product images are stored in
 * Run: node scripts/debug-images.js
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mjyghchbqlwqxorfgkvj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_qU1cUequqxCCLRZChd-UDA_m81hZc8b';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function debug() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, images')
    .limit(5);

  if (error) { console.error('Query error:', error); return; }

  console.log(`Found ${products.length} products\n`);

  for (const p of products) {
    console.log(`--- ${p.name} ---`);
    console.log(`  images type: ${typeof p.images}`);
    console.log(`  images is array: ${Array.isArray(p.images)}`);
    console.log(`  images count: ${p.images?.length || 0}`);
    if (p.images && p.images.length > 0) {
      const first = p.images[0];
      console.log(`  first image type: ${typeof first}`);
      console.log(`  first image length: ${typeof first === 'string' ? first.length : 'N/A'}`);
      console.log(`  first image preview: ${typeof first === 'string' ? first.substring(0, 100) + '...' : first}`);
      console.log(`  starts with data:: ${typeof first === 'string' && first.startsWith('data:')}`);
      console.log(`  starts with http: ${typeof first === 'string' && first.startsWith('http')}`);
    }
    console.log('');
  }
}

debug().catch(console.error);
