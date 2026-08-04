import { BrevoClient } from '@getbrevo/brevo';

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || 'info@altincagkuyumculuk.com';
const FROM_NAME = process.env.BREVO_FROM_NAME || 'AltınÇağ Kuyumculuk';

let client = null;

function getClient() {
  if (!BREVO_API_KEY) return null;
  if (!client) {
    client = new BrevoClient({ apiKey: BREVO_API_KEY });
  }
  return client;
}

export async function sendEmail({ to, subject, html, text }) {
  const brevo = getClient();
  if (!brevo) {
    console.error('[email] Brevo API key not configured');
    return { success: false, error: 'Email servisi yapılandırılmamış' };
  }

  try {
    const toArr = Array.isArray(to) ? to.map(r => typeof r === 'string' ? { email: r } : r) : [typeof to === 'string' ? { email: to } : to];
    console.log('[email] Sending to:', toArr, 'subject:', subject);
    const result = await brevo.transactionalEmails.sendTransacEmail({
      subject,
      htmlContent: html,
      textContent: text || '',
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: toArr,
    });
    console.log('[email] Success:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('[email] Send error:', error?.message || error);
    console.error('[email] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    if (error?.rawResponse) console.error('[email] Raw response:', JSON.stringify(error.rawResponse));
    return { success: false, error: error?.message || 'Email gönderilemedi' };
  }
}

export function isEmailConfigured() {
  return !!BREVO_API_KEY;
}
