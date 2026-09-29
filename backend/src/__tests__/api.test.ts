import request from 'supertest';
import app from '../server';
import { validateUrlForSSRF, auditSecurityHeaders } from '../security';
import { validatePasswordStrength } from '../auth';
import { initDb } from '../db';
import { runMigrations } from '../migrations';

describe('GrowthLens Backend API Security & Functionality Test Suite', () => {
  beforeAll(async () => {
    await initDb();
    await runMigrations();
  }, 30000);

  describe('1. SSRF Protection Module', () => {
    it('should block localhost and loopback IPs', async () => {
      const res1 = await validateUrlForSSRF('http://localhost:5000');
      expect(res1.valid).toBe(false);
      expect(res1.reason).toContain('Forbidden target hostname');

      const res2 = await validateUrlForSSRF('http://127.0.0.1/admin');
      expect(res2.valid).toBe(false);
      expect(res2.reason).toContain('Forbidden private IP target');
    });

    it('should block AWS / Cloud metadata endpoint 169.254.169.254', async () => {
      const res = await validateUrlForSSRF('http://169.254.169.254/latest/meta-data/');
      expect(res.valid).toBe(false);
    });

    it('should block non-HTTP/HTTPS protocols like file:// or ftp://', async () => {
      const res = await validateUrlForSSRF('file:///etc/passwd');
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('Forbidden protocol');
    });

    it('should allow valid public HTTPS websites', async () => {
      const res = await validateUrlForSSRF('https://example.com');
      expect(res.valid).toBe(true);
      expect(res.url).toBe('https://example.com/');
    });
  });

  describe('2. Security Headers Detection Audit', () => {
    it('should calculate lower score and list findings when headers are missing', () => {
      const headers = {};
      const audit = auditSecurityHeaders(headers);
      expect(audit.score).toBeLessThan(100);
      expect(audit.hsts).toBe(false);
      expect(audit.csp).toBe(false);
      expect(audit.findings.length).toBeGreaterThan(0);
    });

    it('should give 100 score when all security headers are present', () => {
      const headers = {
        'strict-transport-security': 'max-age=31536000; includeSubDomains',
        'content-security-policy': "default-src 'self'",
        'x-frame-options': 'DENY',
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'strict-origin-when-cross-origin',
        'permissions-policy': 'geolocation=()',
      };
      const audit = auditSecurityHeaders(headers);
      expect(audit.score).toBe(100);
      expect(audit.hsts).toBe(true);
      expect(audit.csp).toBe(true);
    });
  });

  describe('3. Auth & Password Security', () => {
    it('should reject weak passwords', () => {
      expect(validatePasswordStrength('short').valid).toBe(false);
      expect(validatePasswordStrength('nocapitals123').valid).toBe(false);
      expect(validatePasswordStrength('NoNumbersHere').valid).toBe(false);
      expect(validatePasswordStrength('StrongPass123!').valid).toBe(true);
    });

    it('should return 401 on protected route without auth token', async () => {
      const res = await request(app).get('/scans');
      expect(res.status).toBe(401);
      expect(res.body.detail).toContain('Missing authentication token');
    });

    it('should return 401 on protected route with invalid token', async () => {
      const res = await request(app)
        .get('/scans')
        .set('Authorization', 'Bearer invalid-jwt-token-xyz');
      expect(res.status).toBe(401);
      expect(res.body.detail).toContain('Invalid or expired');
    });

    it('should disallow self-assigning admin role during public registration', async () => {
      const testEmail = `test_admin_attempt_${Date.now()}@example.com`;
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: testEmail,
          password: 'Password123!',
          name: 'Attacker User',
          role: 'admin', // Attempted role escalation
        });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('business'); // Must be strictly server-controlled
    });
  });

  describe('4. Social Certified Networks Registry', () => {
    it('should list certified social networks and capabilities', async () => {
      const res = await request(app).get('/social/networks');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      
      const xNet = res.body.find((n: any) => n.id === 'x');
      expect(xNet).toBeDefined();
      expect(xNet.certified).toBe(true);
    });
  });

  describe('5. Health Endpoint', () => {
    it('should return system health status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.database).toBe('connected');
    }, 20000);
  });
});
