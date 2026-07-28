import crypto from 'crypto';
import { withAuth } from '@/lib/auth';
import { getClientIp } from '@/lib/getClientIp';

const PAYTR_MERCHANT_ID = process.env.PAYTR_MERCHANT_ID;
const PAYTR_MERCHANT_KEY = process.env.PAYTR_MERCHANT_KEY;
const PAYTR_MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT;

async function handler(req, res) {
  try {
    const {
      merchantOid,
      email,
      paymentAmount,
      userBasket,
      noInstallment,
      maxInstallment,
      currency,
      testMode,
    } = req.body;

    const userIp = getClientIp(req);

    const paytrToken = generatePaytrToken({
      user_ip: userIp,
      merchant_oid: merchantOid,
      email,
      payment_amount: paymentAmount,
      user_basket: JSON.stringify(userBasket),
      no_installment: noInstallment || 1,
      max_installment: maxInstallment || 0,
      currency: currency || 'TL',
      test_mode: testMode || 1,
    });

    res.status(200).json({
      success: true,
      token: paytrToken,
      merchantId: PAYTR_MERCHANT_ID,
    });
  } catch (error) {
    console.error('PayTR token error:', error);
    res.status(500).json({ error: 'Ödeme token oluşturulamadı' });
  }
}

export default withAuth(handler);

function generatePaytrToken(params) {
  const hashStr = [
    PAYTR_MERCHANT_ID,
    params.user_ip,
    params.merchant_oid,
    params.email,
    params.payment_amount,
    params.user_basket,
    params.no_installment,
    params.max_installment,
    params.currency,
    params.test_mode,
  ].join('');

  const hmac = crypto.createHmac('sha256', PAYTR_MERCHANT_KEY);
  hmac.update(hashStr + PAYTR_MERCHANT_SALT);
  return hmac.digest('base64');
}

export function verifyPaytrCallback(params) {
  const hashStr = [
    PAYTR_MERCHANT_ID,
    params.user_ip,
    params.merchant_oid,
    params.status,
    params.total_amount,
  ].join('');

  const hmac = crypto.createHmac('sha256', PAYTR_MERCHANT_KEY);
  hmac.update(hashStr + PAYTR_MERCHANT_SALT);
  const expected = hmac.digest('base64');
  if (!params.hash || typeof params.hash !== 'string') return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(params.hash);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
