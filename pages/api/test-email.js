import sgMail from '@sendgrid/mail';
import { getSendgridApiKey, getSendgridFromEmail } from '@/lib/secrets';
import { rateLimit } from '@/lib/rateLimit';

const SENDGRID_API_KEY = getSendgridApiKey();
const FROM_EMAIL = getSendgridFromEmail();

if (SENDGRID_API_KEY) sgMail.setApiKey(SENDGRID_API_KEY);

const testLimiter = rateLimit({ windowMs: 300000, max: 3, message: 'Çok fazla test. 5 dakika bekleyin.' });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!testLimiter(req, res)) return;

  if (!SENDGRID_API_KEY) {
    return res.status(500).json({ error: 'SendGrid API key not configured' });
  }

  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email gerekli' });
    }

    const result = await sgMail.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'AltınÇağ Kuyumculuk - Test E-postası',
      html: '<h1>Test başarılı!</h1><p>SendGrid API doğru çalışıyor. E-posta doğrulama sistemi aktif.</p>',
    });

    res.status(200).json({ success: true, statusCode: result[0].statusCode });
  } catch (error) {
    console.error('SendGrid test error:', error.message);
    res.status(500).json({ error: error.message });
  }
}
