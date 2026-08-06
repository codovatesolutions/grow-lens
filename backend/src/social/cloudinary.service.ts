import axios from 'axios';
import crypto from 'crypto';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const API_KEY    = process.env.CLOUDINARY_API_KEY    || '';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

const CONFIGURED = !!(CLOUD_NAME && API_KEY && API_SECRET);

export interface UploadResult {
  url:           string;
  secureUrl:     string;
  publicId:      string;
  resourceType:  'image' | 'video';
  width?:        number;
  height?:       number;
  duration?:     number;
  thumbnailUrl?: string;
  format?:       string;
  bytes?:        number;
}

function sign(params: Record<string, string>): string {
  const str = Object.keys(params).sort()
    .map(k => `${k}=${params[k]}`)
    .join('&') + API_SECRET;
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Upload a file buffer to Cloudinary.
 * Falls back to a base64 data URL if CLOUDINARY_* env vars are not set
 * (useful for local dev — NOT suitable for production with large media).
 */
export async function uploadMedia(
  buffer:   Buffer,
  mimeType: string,
  folder:   string = 'growthlens/social'
): Promise<UploadResult> {
  const resourceType: 'image' | 'video' = mimeType.startsWith('video/') ? 'video' : 'image';

  if (!CONFIGURED) {
    // Local fallback — stores as data URL (dev only)
    const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    return { url: dataUrl, secureUrl: dataUrl, publicId: `local_${Date.now()}`, resourceType };
  }

  const timestamp = Math.round(Date.now() / 1000).toString();
  const signature = sign({ folder, timestamp });

  // Build multipart/form-data manually using Buffer
  const boundary = `----FormBoundary${crypto.randomBytes(8).toString('hex')}`;
  const ext      = mimeType.split('/')[1]?.split(';')[0] || 'bin';

  const parts: Buffer[] = [];
  const field = (name: string, value: string) =>
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`);

  parts.push(field('api_key',   API_KEY));
  parts.push(field('timestamp', timestamp));
  parts.push(field('folder',    folder));
  parts.push(field('signature', signature));
  parts.push(
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="upload.${ext}"\r\nContent-Type: ${mimeType}\r\n\r\n`),
    buffer,
    Buffer.from('\r\n')
  );
  parts.push(Buffer.from(`--${boundary}--\r\n`));

  const body = Buffer.concat(parts);

  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    body,
    { headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` } }
  );

  const d = response.data;
  const thumbnailUrl = resourceType === 'video'
    ? `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/so_0,f_jpg/${d.public_id}.jpg`
    : undefined;

  return {
    url:          d.url,
    secureUrl:    d.secure_url,
    publicId:     d.public_id,
    resourceType,
    width:        d.width,
    height:       d.height,
    duration:     d.duration,
    thumbnailUrl,
    format:       d.format,
    bytes:        d.bytes,
  };
}

export const cloudinaryConfigured = CONFIGURED;
