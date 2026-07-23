require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL ve Service Role Key gerekli');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const { data: existing } = await supabase
    .from('admins')
    .select('*')
    .eq('email', 'admin@altincag.com')
    .single();

  const hash = await bcrypt.hash('Admin123!', 12);

  if (existing) {
    const { error } = await supabase
      .from('admins')
      .update({ password: hash })
      .eq('email', 'admin@altincag.com');

    if (error) throw error;
    console.log('Admin sifresi guncellendi');
  } else {
    const { error } = await supabase
      .from('admins')
      .insert({
        email: 'admin@altincag.com',
        password: hash,
        name: 'Admin',
        role: 'admin',
        is_active: true,
      });

    if (error) throw error;
    console.log('Admin olusturuldu');
  }

  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
