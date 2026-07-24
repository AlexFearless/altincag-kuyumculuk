import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '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';
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'info@altincagkuyumculuk.com';
const STORE_NAME = 'AltınÇağ Kuyumculuk';
const STORE_PHONE = '(0212) 232 22 12';

sgMail.setApiKey(SENDGRID_API_KEY);

const STATUS_MESSAGES = {
  processing: {
    subject: 'Siparişiniz İşleniyor',
    title: 'Siparişiniz İşleniyor',
    message: 'Siparişiniz başarıyla alındı ve processing başlamıştır. En kısa sürede hazırlanacaktır.',
    color: '#3B82F6',
    icon: '🔧',
  },
  shipped: {
    subject: 'Siparişiniz Kargoya Verildi',
    title: 'Siparişiniz Kargoya Verildi',
    message: 'Siparişiniz kargoya verilmiştir. Kargo takip numaranız sipariş detaylarınızda bulunmaktadır.',
    color: '#8B5CF6',
    icon: '📦',
  },
  delivered: {
    subject: 'Siparişiniz Teslim Edildi',
    title: 'Siparişiniz Teslim Edildi',
    message: 'Siparişiniz başarıyla teslim edilmiştir. Altınçag Kuyumculuk\'u tercih ettiğiniz için teşekkür ederiz.',
    color: '#10B981',
    icon: '✅',
  },
  cancelled: {
    subject: 'Siparişiniz İptal Edildi',
    title: 'Siparişiniz İptal Edildi',
    message: 'Siparişiniz iptal edilmiştir. Herhangi bir ödeme yapılmışsa iade işlemi başlatılacaktır.',
    color: '#EF4444',
    icon: '❌',
  },
  refunded: {
    subject: 'Siparişiniz İade Edildi',
    title: 'Siparişiniz İade Edildi',
    message: 'Siparişiniz iade edilmiştir. İade tutarı banka hesabınıza iade edilecektir.',
    color: '#F59E0B',
    icon: '💰',
  },
  pending: {
    subject: 'Siparişiniz Beklemede',
    title: 'Siparişiniz Beklemede',
    message: 'Siparişiniz onay bekliyor. En kısa sürede değerlendirilecektir.',
    color: '#EAB308',
    icon: '⏳',
  },
};

export async function sendOrderStatusEmail(order, newStatus) {
  const statusInfo = STATUS_MESSAGES[newStatus];
  if (!statusInfo) return;

  const customerEmail = order.customer_email;
  const customerName = `${order.customer_first_name} ${order.customer_last_name}`;
  const orderNumber = order.order_number;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f9f7f3;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;">
    <div style="background-color:${statusInfo.color};padding:24px 32px;">
      <h1 style="color:#ffffff;margin:0;font-size:20px;">${STORE_NAME}</h1>
    </div>
    <div style="padding:32px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:48px;">${statusInfo.icon}</span>
      </div>
      <h2 style="color:#2D2418;font-size:22px;text-align:center;margin-bottom:8px;">${statusInfo.title}</h2>
      <p style="color:#6B5E50;font-size:14px;text-align:center;margin-bottom:32px;">Sipariş No: <strong>${orderNumber}</strong></p>
      <div style="background-color:#F7F5F2;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="color:#2D2418;font-size:14px;line-height:1.6;margin:0;">${statusInfo.message}</p>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:8px 0;color:#6B5E50;font-size:13px;">Müşteri</td>
          <td style="padding:8px 0;color:#2D2418;font-size:13px;text-align:right;">${customerName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6B5E50;font-size:13px;">Sipariş No</td>
          <td style="padding:8px 0;color:#2D2418;font-size:13px;text-align:right;">${orderNumber}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6B5E50;font-size:13px;">Toplam</td>
          <td style="padding:8px 0;color:#C8A96E;font-size:13px;font-weight:bold;text-align:right;">${Number(order.total_amount).toLocaleString('tr-TR')} TL</td>
        </tr>
      </table>
      <div style="text-align:center;margin:32px 0;">
        <a href="https://altincagkuyumculuk.com/hesap" style="display:inline-block;background-color:#C8A96E;color:#ffffff;padding:12px 32px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:bold;">Siparişlerimi Görüntüle</a>
      </div>
    </div>
    <div style="background-color:#F7F5F2;padding:24px 32px;text-align:center;">
      <p style="color:#6B5E50;font-size:12px;margin:0 0 8px;">${STORE_NAME} | ${STORE_PHONE}</p>
      <p style="color:#A0968A;font-size:11px;margin:0;">Bu e-posta sipariş durumunuz değiştiği için gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await sgMail.send({
      from: { email: FROM_EMAIL, name: STORE_NAME },
      to: customerEmail,
      subject: `${statusInfo.subject} - Sipariş #${orderNumber}`,
      html,
    });
    console.log(`Order status email sent: ${orderNumber} → ${newStatus}`);
  } catch (error) {
    console.error(`Failed to send order status email for ${orderNumber}:`, error.message);
  }
}
