import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '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');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email gerekli' });
    }

    const result = await sgMail.send({
      from: process.env.SENDGRID_FROM_EMAIL || 'kuyumculukaltincag@gmail.com',
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
