import sgMail from '@sendgrid/mail';
import { getSendgridApiKey, getSendgridFromEmail } from '@/lib/secrets';
import { rateLimit } from '@/lib/rateLimit';
import { withAdminRole } from '@/lib/auth';

const testLimiter = rateLimit({ windowMs: 300000, max: 3, message: 'Çok fazla test. 5 dakika bekleyin.' });

async function handler(req, res) {
  if (!(await testLimiter(req, res))) return;

  const SENDGRID_API_KEY = getSendgridApiKey();
  const FROM_EMAIL = getSendgridFromEmail();

  if (!SENDGRID_API_KEY) return res.status(500).json({ error: 'SendGrid API key not configured' });

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email gerekli' });

    sgMail.setApiKey(SENDGRID_API_KEY);
    const result = await sgMail.send({
      from: FROM_EMAIL, to: email,
      subject: 'AltınÇağ Kuyumculuk - Test E-postası',
      html: '<h1>Test başarılı!</h1><p>SendGrid API doğru çalışıyor.</p>',
    });

    res.status(200).json({ success: true, statusCode: result[0].statusCode });
  } catch {
    res.status(500).json({ error: 'E-posta gönderilemedi' });
  }
}

export default withAdminRole()(handler);
