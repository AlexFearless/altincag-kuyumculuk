import { getDbPublic } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let db;
  try { db = getDbPublic(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı.' }); }

  try {
    const today = new Date().toISOString().split('T')[0];

    let announcement = null;

    const { data: activeAnnouncement } = await db
      .from('announcements')
      .select('id, title, message, bg_color, text_color')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeAnnouncement) {
      announcement = activeAnnouncement;
    }

    if (!announcement) {
      const { data: campaign } = await db
        .from('campaigns')
        .select('id, name, discount_type, discount_value, start_date, end_date, applies_to, target_category')
        .eq('is_active', true)
        .lte('start_date', today)
        .gte('end_date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (campaign) {
        const discountText = campaign.discount_type === 'percent' ? `%${campaign.discount_value}` : `${campaign.discount_value} TL`;
        let categoryText = '';
        if (campaign.applies_to === 'category' && campaign.target_category) {
          const catNames = { yuzuk: 'Yüzük', kolye: 'Kolye', bileklik: 'Bileklik', kelepce: 'Kelepçe', kupe: 'Küpe', zincir: 'Zincir', set: 'Set' };
          categoryText = ` - ${catNames[campaign.target_category] || campaign.target_category}`;
        }
        announcement = {
          id: campaign.id,
          title: `Kampanya: ${campaign.name}`,
          message: `${discountText} indirim${categoryText} ${new Date(campaign.end_date).toLocaleDateString('tr-TR')}\'a kadar geçerli!`,
          bg_color: '#C8A96E',
          text_color: '#FFFFFF',
        };
      }
    }

    res.status(200).json({ announcement: announcement || null });
  } catch {
    res.status(200).json({ announcement: null });
  }
}
