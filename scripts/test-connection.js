require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', url ? 'SET' : 'MISSING');
console.log('Anon Key:', anonKey ? 'SET' : 'MISSING');
console.log('Service Key:', serviceKey ? 'SET' : 'MISSING');

if (!url || !anonKey || !serviceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabaseAdmin = createClient(url, serviceKey);

async function check() {
  const tables = ['users', 'admins', 'products', 'orders', 'order_items', 'coupons', 'announcements', 'campaigns', 'messages', 'logs', 'settings'];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`  ${table}: ERROR - ${error.message}`);
      } else {
        console.log(`  ${table}: ${count} rows`);
      }
    } catch (e) {
      console.log(`  ${table}: EXCEPTION - ${e.message}`);
    }
  }
}

check().catch(console.error);
