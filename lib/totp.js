import crypto from 'crypto';

const ALGORITHM = 'sha1';
const DIGITS = 6;
const PERIOD = 30;
const WINDOW = 1;

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer) {
  let bits = '';
  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, '0');
  }
  let result = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0');
    result += BASE32_CHARS[parseInt(chunk, 2)];
  }
  return result;
}

function base32Decode(str) {
  const clean = str.replace(/[= ]/g, '').toUpperCase();
  let bits = '';
  for (const char of clean) {
    const val = BASE32_CHARS.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }
  return Buffer.from(bytes);
}

function generateSecret() {
  return base32Encode(crypto.randomBytes(20));
}

function generateTOTP(secret, timestamp = Date.now()) {
  const counter = Math.floor(timestamp / 1000 / PERIOD);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  counterBuffer.writeUInt32BE(counter & 0xffffffff, 4);

  const hmac = crypto.createHmac(ALGORITHM, base32Decode(secret));
  hmac.update(counterBuffer);
  const hash = hmac.digest();

  const offset = hash[hash.length - 1] & 0x0f;
  const code = ((hash[offset] & 0x7f) << 24) |
               ((hash[offset + 1] & 0xff) << 16) |
               ((hash[offset + 2] & 0xff) << 8) |
               (hash[offset + 3] & 0xff);

  return String(code % Math.pow(10, DIGITS)).padStart(DIGITS, '0');
}

function verifyTOTP(secret, token) {
  const now = Date.now();
  for (let i = -WINDOW; i <= WINDOW; i++) {
    const timestamp = now + (i * PERIOD * 1000);
    const expected = generateTOTP(secret, timestamp);
    if (expected.length === token.length) {
      const expectedBuf = Buffer.from(expected);
      const tokenBuf = Buffer.from(token);
      if (crypto.timingSafeEqual(expectedBuf, tokenBuf)) {
        return true;
      }
    }
  }
  return false;
}

function getProvisioningURI(secret, email, issuer = 'AltınÇağ Kuyumculuk') {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${DIGITS}&period=${PERIOD}`;
}

export { generateSecret, generateTOTP, verifyTOTP, getProvisioningURI };
