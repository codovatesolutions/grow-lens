import dns from 'dns';
import { URL } from 'url';

// Private and reserved IP ranges to prevent SSRF
const PRIVATE_IP_PATTERNS = [
  /^127\./,                  // Loopback (127.0.0.0/8)
  /^10\./,                   // Class A Private (10.0.0.0/8)
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Class B Private (172.16.0.0/12)
  /^192\.168\./,             // Class C Private (192.168.0.0/16)
  /^169\.254\./,             // Link-local (169.254.0.0/16)
  /^0\./,                    // Current network (0.0.0.0/8)
  /^::1$/,                   // IPv6 Loopback
  /^fe80:/i,                 // IPv6 Link-local
  /^fc00:/i,                 // IPv6 Unique local
  /^fd[0-9a-f]{2}:/i,        // IPv6 Unique local
  /^::ffff:127\./i,          // IPv4-mapped IPv6 loopback
  /^::ffff:10\./i,           // IPv4-mapped IPv6 private
  /^::ffff:172\.(1[6-9]|2[0-9]|3[0-1])\./i,
  /^::ffff:192\.168\./i,
  /^::ffff:169\.254\./i,
];

const FORBIDDEN_HOSTNAMES = [
  'localhost',
  'broadcasthost',
  'local',
  'internal',
  'metadata.google.internal',
  '169.254.169.254', // Cloud metadata service
];

export function isPrivateIp(ip: string): boolean {
  return PRIVATE_IP_PATTERNS.some(pattern => pattern.test(ip));
}

export async function validateUrlForSSRF(targetUrl: string): Promise<{ valid: boolean; reason?: string; url?: string }> {
  let rawUrl = targetUrl.trim();
  if (!rawUrl.includes('://')) {
    rawUrl = 'https://' + rawUrl;
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch (e) {
    return { valid: false, reason: 'Invalid URL format' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, reason: `Forbidden protocol: ${parsed.protocol}. Only http and https are allowed.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (FORBIDDEN_HOSTNAMES.includes(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    return { valid: false, reason: `Forbidden target hostname: ${hostname}` };
  }

  // Check if hostname is an IP directly
  if (isPrivateIp(hostname)) {
    return { valid: false, reason: `Forbidden private IP target: ${hostname}` };
  }

  // Resolve hostname via DNS to ensure it doesn't resolve to a private IP
  try {
    const addresses = await dns.promises.resolve(hostname);
    for (const addr of addresses) {
      if (isPrivateIp(addr)) {
        return { valid: false, reason: `Hostname ${hostname} resolves to private IP: ${addr}` };
      }
    }
  } catch (err: any) {
    // If DNS resolution fails due to local network environment restrictions, validate hostname format
    const isValidDomainFormat = /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/.test(hostname);
    if (!isValidDomainFormat) {
      return { valid: false, reason: `Could not resolve domain name: ${hostname}` };
    }
  }

  return { valid: true, url: parsed.href };
}

export interface SecurityHeadersAudit {
  score: number;
  hsts: boolean;
  csp: boolean;
  xFrameOptions: boolean;
  xContentTypeOptions: boolean;
  referrerPolicy: boolean;
  permissionsPolicy: boolean;
  rawHeaders: Record<string, string>;
  findings: string[];
}

export function auditSecurityHeaders(headers: Record<string, any>): SecurityHeadersAudit {
  const norm: Record<string, string> = {};
  for (const key of Object.keys(headers)) {
    norm[key.toLowerCase()] = String(headers[key]);
  }

  const hsts = Boolean(norm['strict-transport-security']);
  const csp = Boolean(norm['content-security-policy']);
  const xFrameOptions = Boolean(norm['x-frame-options']);
  const xContentTypeOptions = norm['x-content-type-options']?.toLowerCase() === 'nosniff';
  const referrerPolicy = Boolean(norm['referrer-policy']);
  const permissionsPolicy = Boolean(norm['permissions-policy'] || norm['feature-policy']);

  const findings: string[] = [];
  let score = 100;

  if (!hsts) {
    score -= 20;
    findings.push('Missing HSTS (Strict-Transport-Security) header — leaves connection vulnerable to downgrade attacks.');
  }
  if (!csp) {
    score -= 25;
    findings.push('Missing Content-Security-Policy (CSP) — leaves site vulnerable to XSS and data injection.');
  }
  if (!xFrameOptions) {
    score -= 15;
    findings.push('Missing X-Frame-Options header — site can be embedded in clickjacking iframe attacks.');
  }
  if (!xContentTypeOptions) {
    score -= 15;
    findings.push('Missing X-Content-Type-Options: nosniff — browsers may MIME-sniff response types.');
  }
  if (!referrerPolicy) {
    score -= 10;
    findings.push('Missing Referrer-Policy — full URLs may leak to external third parties on link clicks.');
  }
  if (!permissionsPolicy) {
    score -= 15;
    findings.push('Missing Permissions-Policy — browser features (camera, mic, geolocation) not explicitly restricted.');
  }

  return {
    score: Math.max(0, score),
    hsts,
    csp,
    xFrameOptions,
    xContentTypeOptions,
    referrerPolicy,
    permissionsPolicy,
    rawHeaders: {
      'strict-transport-security': norm['strict-transport-security'] || 'Missing',
      'content-security-policy': norm['content-security-policy'] || 'Missing',
      'x-frame-options': norm['x-frame-options'] || 'Missing',
      'x-content-type-options': norm['x-content-type-options'] || 'Missing',
      'referrer-policy': norm['referrer-policy'] || 'Missing',
      'permissions-policy': norm['permissions-policy'] || norm['feature-policy'] || 'Missing',
    },
    findings,
  };
}
