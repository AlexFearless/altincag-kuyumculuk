import crypto from 'crypto';

const PAYTR_MERCHANT_ID = process.env.PAYTR_MERCHANT_ID;
const PAYTR_MERCHANT_KEY = process.env.PAYTR_MERCHANT_KEY;
const PAYTR_MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT;

export function generatePaytrToken(params) {
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
  const expectedHash = hmac.digest('base64');

  return expectedHash === params.hash;
}

export function createPaytrBasket(items) {
  return items.map((item) => [
    item.name,
    (item.price * 100).toString(),
    item.quantity.toString(),
  ]);
}
