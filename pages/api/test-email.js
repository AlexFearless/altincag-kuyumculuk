import { sendEmail, isEmailConfigured } from '@/lib/email';
import { rateLimit } from '@/lib/rateLimit';
import { withAdminRole } from '@/lib/auth';

const testLimiter = rateLimit({ windowMs: 300000, max: 3, message: 'Çok fazla test. 5 dakika bekleyin.' });

async function handler(req, res) {
  if (!(await testLimiter(req, res))) return;

  if (!isEmailConfigured()) return res.status(500).json({ error: 'Brevo API key not configured' });

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email gerekli' });

    const result = await sendEmail({
      to: email,
      subject: 'AltınÇağ Kuyumculuk - Test E-postası',
      html: '<h1>Test başarılı!</h1><p>Brevo API doğru çalışıyor.</p>',
    });

    if (result.success) {
      res.status(200).json({ success: true, messageId: result.messageId });
    } else {
      res.status(500).json({ error: result.error || 'E-posta gönderilemedi' });
    }
  } catch {
    res.status(500).json({ error: 'E-posta gönderilemedi' });
  }
}

export default withAdminRole()(handler);
