import crypto from 'crypto';
import { withAuth } from '@/lib/auth';
import { getClientIp } from '@/lib/getClientIp';
import { getConfig } from '@/lib/config';

async function handler(req, res) {
  try {
    const cfg = getConfig();
    const { merchantOid, email, paymentAmount, userBasket, noInstallment, maxInstallment, currency, testMode } = req.body;
    const userIp = getClientIp(req);

    const hashStr = [cfg.paytrMerchantId, userIp, merchantOid, email, paymentAmount, JSON.stringify(userBasket), noInstallment || 1, maxInstallment || 0, currency || 'TL', testMode || 1].join('');

    const hmac = crypto.createHmac('sha256', cfg.paytrMerchantKey);
    hmac.update(hashStr + cfg.paytrMerchantSalt);
    const paytrToken = hmac.digest('base64');

    res.status(200).json({ success: true, token: paytrToken, merchantId: cfg.paytrMerchantId });
  } catch {
    res.status(500).json({ error: 'Ödeme token oluşturulamadı' });
  }
}

export default withAuth(handler);
