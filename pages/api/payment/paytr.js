import crypto from 'crypto';

const PAYTR_MERCHANT_ID = process.env.PAYTR_MERCHANT_ID;
const PAYTR_MERCHANT_KEY = process.env.PAYTR_MERCHANT_KEY;
const PAYTR_MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    const userIp =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket.remoteAddress;

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
  return hmac.digest('base64') === params.hash;
}
