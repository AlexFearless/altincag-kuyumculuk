import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

let _r2Client = null;

function getR2Client() {
  if (_r2Client) return _r2Client;

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  _r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  return _r2Client;
}

export function getR2PublicUrl(key) {
  const publicDomain = process.env.R2_PUBLIC_DOMAIN;
  if (!publicDomain) return null;
  return `https://${publicDomain}/${key}`;
}

export async function uploadToR2(key, buffer, contentType) {
  const client = getR2Client();
  if (!client) throw new Error('R2 not configured');

  const bucket = process.env.R2_BUCKET_NAME || 'altincag-images';

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  return getR2PublicUrl(key);
}

export async function deleteFromR2(key) {
  const client = getR2Client();
  if (!client) return;

  const bucket = process.env.R2_BUCKET_NAME || 'altincag-images';

  await client.send(new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  }));
}

export async function listR2Objects(prefix = '') {
  const client = getR2Client();
  if (!client) return [];

  const bucket = process.env.R2_BUCKET_NAME || 'altincag-images';

  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
  });

  const response = await client.send(command);
  return response.Contents || [];
}

export function isR2Configured() {
  return !!(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);
}
