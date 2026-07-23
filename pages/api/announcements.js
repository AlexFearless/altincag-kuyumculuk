import { getDbPublic } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let db;
  try { db = getDbPublic(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı.' }); }

  try {
    const { data } = await db
      .from('announcements')
      .select('id, title, message, bg_color, text_color')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    res.status(200).json({ announcement: data || null });
  } catch {
    res.status(200).json({ announcement: null });
  }
}
