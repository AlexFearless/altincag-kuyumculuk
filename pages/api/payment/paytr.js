import crypto from 'crypto';
import { withAuth } from '@/lib/auth';
import { getClientIp } from '@/lib/getClientIp';

async function handler(req, res) {
  try {
    const PAYTR_MERCHANT_ID = process.env.PAYTR_MERCHANT_ID || '';
    const PAYTR_MERCHANT_KEY = process.env.PAYTR_MERCHANT_KEY || '';
    const PAYTR_MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT || '';

    const { merchantOid, email, paymentAmount, userBasket, noInstallment, maxInstallment, currency, testMode } = req.body;
    const userIp = getClientIp(req);

    const hashStr = [PAYTR_MERCHANT_ID, userIp, merchantOid, email, paymentAmount, JSON.stringify(userBasket), noInstallment || 1, maxInstallment || 0, currency || 'TL', testMode || 1].join('');

    const hmac = crypto.createHmac('sha256', PAYTR_MERCHANT_KEY);
    hmac.update(hashStr + PAYTR_MERCHANT_SALT);
    const paytrToken = hmac.digest('base64');

    res.status(200).json({ success: true, token: paytrToken, merchantId: PAYTR_MERCHANT_ID });
  } catch {
    res.status(500).json({ error: 'Ödeme token oluşturulamadı' });
  }
}

export default withAuth(handler);
