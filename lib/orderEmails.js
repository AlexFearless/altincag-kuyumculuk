import { sendEmail, isEmailConfigured } from './email';

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const STORE_NAME = 'AltınÇağ Kuyumculuk';
const STORE_PHONE = '(0212) 232 22 12';

const STATUS_MESSAGES = {
  processing: { statusText: 'siparişiniz hazırlanmaya başlanmıştır', color: '#3B82F6', icon: '🔧' },
  shipped: { statusText: 'siparişiniz kargoya verilmiştir', color: '#8B5CF6', icon: '📦' },
  delivered: { statusText: 'siparişiniz başarıyla teslim edilmiştir', color: '#10B981', icon: '✅' },
  cancelled: { statusText: 'siparişiniz iptal edilmiştir', color: '#EF4444', icon: '❌' },
  refunded: { statusText: 'siparişiniz iade edilmiştir', color: '#F59E0B', icon: '💰' },
  pending: { statusText: 'siparişiniz onay bekliyor', color: '#EAB308', icon: '⏳' },
};

export async function sendOrderStatusEmail(order, newStatus) {
  if (!isEmailConfigured()) return;
  const statusInfo = STATUS_MESSAGES[newStatus];
  if (!statusInfo) return;

  const customerEmail = order.customer_email;
  const customerFirstName = escapeHtml(order.customer_first_name || '');
  const orderNumber = order.order_number;

  const subject = `Sayın ${customerFirstName}, siparişiniz (#${orderNumber}) hakkında bilgilendirme`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f9f7f3;font-family:Georgia,serif;"><div style="max-width:600px;margin:0 auto;background:#fff;"><div style="background:${statusInfo.color};padding:24px 32px;"><h1 style="color:#fff;margin:0;font-size:20px;">${STORE_NAME}</h1></div><div style="padding:32px;"><p style="color:#2D2418;font-size:15px;line-height:1.8;margin:0;">Sayın ${customerFirstName},</p><p style="color:#2D2418;font-size:15px;line-height:1.8;margin:16px 0;">Siparişiniz (#${orderNumber}) hakkında bilgilendirme: ${statusInfo.statusText}. ${STORE_NAME}.</p></div><div style="background:#F7F5F2;padding:24px 32px;text-align:center;"><p style="color:#6B5E50;font-size:12px;margin:0 0 8px;">${STORE_NAME} | ${STORE_PHONE}</p><p style="color:#A0968A;font-size:11px;margin:0;">Bu e-posta sipariş durumunuz değiştiği için gönderilmiştir.</p></div></div></body></html>`;

  try {
    await sendEmail({ to: customerEmail, subject, html });
  } catch {}
}
