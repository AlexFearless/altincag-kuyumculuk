import { supabaseAdmin } from '../lib/supabase.js';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigration() {
  if (!supabaseAdmin) {
    console.error('SUPABASE_SERVICE_ROLE_KEY tanımlanmamış!');
    process.exit(1);
  }

  const sqlPath = join(process.cwd(), 'scripts', 'supabase-migration-v13-fix-constraints.sql');
  let sql;
  try {
    sql = readFileSync(sqlPath, 'utf8');
  } catch (e) {
    console.error('SQL dosyası okunamadı:', sqlPath);
    process.exit(1);
  }

  console.log('Migration SQL çalışıyor...');
  console.log('SQL:', sql.substring(0, 200) + '...');

  const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql_text: sql });

  if (error) {
    console.log('RPC başarısız, exec_sql fonksiyonu oluşturuluyor...');

    const createFuncSql = `
      CREATE OR REPLACE FUNCTION exec_sql(sql_text text) RETURNS void AS $$
      BEGIN
        EXECUTE sql_text;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    const { error: createErr } = await supabaseAdmin.rpc('exec_sql', { sql_text: createFuncSql });

    if (createErr) {
      console.log('');
      console.log('================================================');
      console.log('OTOMATIK MIGRATION ÇALIŞTIRILAMADI');
      console.log('================================================');
      console.log('');
      console.log('Lütfen şu SQL\'i Supabase Dashboard > SQL Editor\'da çalıştırın:');
      console.log('');
      console.log('--- BAŞLANGIÇ ---');
      console.log(sql);
      console.log('--- BİTİŞ ---');
      console.log('');
      console.log('Supabase Dashboard URL:', 'https://supabase.com/dashboard/project/mjyghchbqlwqxorfgkvj/sql');
      process.exit(1);
    }

    console.log('exec_sql fonksiyonu oluşturuldu, migration tekrar deneniyor...');
    const { error: retryErr } = await supabaseAdmin.rpc('exec_sql', { sql_text: sql });
    if (retryErr) {
      console.error('Migration tekrar başarısız:', retryErr.message);
      process.exit(1);
    }
  }

  console.log('Migration başarıyla uygulandı!');

  const checks = [
    { table: 'rate_limits', name: 'Rate Limits' },
    { table: 'token_blacklist', name: 'Token Blacklist' },
    { table: 'refresh_tokens', name: 'Refresh Tokens' },
  ];

  for (const check of checks) {
    const { error } = await supabaseAdmin.from(check.table).select('id').limit(1);
    console.log(`${check.name}: ${error ? 'TABLO YOK!' : 'MEVCUT'}`);
  }

  console.log('');
  console.log('Test: orders tablosuna deneme siparişi ekleniyor...');
  const testOrder = {
    order_number: 'TEST_MIGRATION_' + Date.now(),
    customer_first_name: 'Test',
    customer_last_name: 'Migration',
    customer_email: 'test@migration.com',
    customer_phone: '05550000000',
    customer_address: 'Test Adres',
    customer_city: 'Istanbul',
    customer_district: 'Test',
    subtotal: 0,
    total_amount: 0,
    payment_method: 'havale',
    payment_status: 'havale_bekliyor',
    order_status: 'pending',
  };

  const { data: testInsert, error: testErr } = await supabaseAdmin
    .from('orders')
    .insert(testOrder)
    .select('id')
    .single();

  if (testErr) {
    console.error('Test siparişi eklenemedi:', testErr.message, testErr.code);
    if (testErr.code === '23514') {
      console.error('CHECK constraint hala aktif! SQL\'i manuel çalıştırın.');
    }
  } else {
    console.log('Test siparişi başarılı! ID:', testInsert.id);
    await supabaseAdmin.from('orders').delete().eq('id', testInsert.id);
    console.log('Test siparişi temizlendi.');
  }
}

runMigration().catch(err => {
  console.error('Migration hatası:', err);
  process.exit(1);
});
