import { getDb } from '@/lib/supabase';
import { rateLimit } from '@/lib/rateLimit';
import { sanitize } from '@/lib/sanitize';
import { withAuth } from '@/lib/auth';

const havaleLimiter = rateLimit({ windowMs: 60000, max: 10, message: 'Çok fazla istek. 1 dakika bekleyin.' });

async function handler(req, res) {
  if (!(await havaleLimiter(req, res))) return;

  if (req.method === 'GET') {
    const { BANK_ACCOUNTS } = await import('@/lib/constants');
    return res.status(200).json({ accounts: BANK_ACCOUNTS });
  }

  if (req.method === 'POST') {
    try {
      let db;
      try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı' }); }

      const { orderId, bankIban, amount, senderName, note } = req.body;

      if (!orderId || !bankIban || !amount) {
        return res.status(400).json({ error: 'Eksik bilgi: orderId, bankIban ve amount zorunludur' });
      }

      if (typeof amount !== 'number' || amount <= 0 || amount > 1000000) {
        return res.status(400).json({ error: 'Geçersiz tutar' });
      }

      const { data: order } = await db
        .from('orders')
        .select('id, order_status, payment_status')
        .eq('id', orderId)
        .eq('user_id', req.user.id)
        .single();

      if (!order) {
        return res.status(404).json({ error: 'Sipariş bulunamadı' });
      }

      if (order.payment_status === 'odendi') {
        return res.status(400).json({ error: 'Bu sipariş zaten ödenmiş' });
      }

      const { error: updateError } = await db
        .from('orders')
        .update({
          payment_status: 'havale_bekliyor',
          payment_method: 'havale',
          notes: sanitize(`Havale bilgileri: IBAN=****${String(bankIban).slice(-4)}, Gönderen=${senderName || ''}, Not=${note || ''}`),
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      res.status(200).json({
        success: true,
        message: 'Havale bilgileriniz kaydedildi. Ödeme onayı bekleniyor.',
      });
    } catch (error) {
      console.error('Havale payment error:', error);
      res.status(500).json({ error: 'Havale bilgisi kaydedilirken hata oluştu' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);
