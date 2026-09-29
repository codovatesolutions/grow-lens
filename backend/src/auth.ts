import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { pool } from './db';

const JWT_SECRET = process.env.JWT_SECRET || '';

export function validateJwtSecretConfig(): string {
  const secret = process.env.JWT_SECRET;
  const isProd = process.env.NODE_ENV === 'production';

  if (!secret || secret === 'dev-secret' || secret.length < 32) {
    if (isProd) {
      throw new Error(
        'FATAL: JWT_SECRET environment variable must be explicitly defined and at least 32 characters long in production.'
      );
    }
    console.warn(
      '[SECURITY WARNING] JWT_SECRET is unset, default, or too short (<32 chars). Generating dynamic strong fallback secret for session runtime.'
    );
    return crypto.randomBytes(32).toString('hex');
  }
  return secret;
}

export const EFFECTIVE_JWT_SECRET = validateJwtSecretConfig();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    created_at: string;
  };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Missing authentication token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, EFFECTIVE_JWT_SECRET) as { sub: string };
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
      [payload.sub]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ detail: 'User account no longer exists' });
    }

    const user = result.rows[0];
    req.user = {
      ...user,
      created_at: user.created_at.toISOString(),
    };
    next();
  } catch (err: any) {
    return res.status(401).json({ detail: 'Invalid or expired authentication token' });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ detail: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        detail: `Access denied. Action requires one of roles: [${allowedRoles.join(', ')}]. Your role is '${req.user.role}'.`,
      });
    }

    next();
  };
}

// Password Policy Enforcement Helper
export function validatePasswordStrength(password: string): { valid: boolean; reason?: string } {
  if (!password || password.length < 8) {
    return { valid: false, reason: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one number.' };
  }
  return { valid: true };
}

// User Registration Handler (Disallows Public Admin Signup)
export async function registerUser(req: Request, res: Response) {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ detail: 'Email, name, and password are required' });
  }

  const pwdCheck = validatePasswordStrength(password);
  if (!pwdCheck.valid) {
    return res.status(400).json({ detail: pwdCheck.reason });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ detail: 'Email is already registered' });
    }

    // Role is strictly server-controlled. Public signups MUST be assigned 'business'
    const role = 'business';
    const salt = bcrypt.genSaltSync(12);
    const password_hash = bcrypt.hashSync(password, salt);
    const id = uuidv4();
    const now = new Date();
    const verificationToken = crypto.randomBytes(32).toString('hex');

    await pool.query(
      `INSERT INTO users (id, email, name, role, password_hash, email_verified, verification_token, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, email.toLowerCase().trim(), name.trim(), role, password_hash, false, verificationToken, now]
    );

    const token = jwt.sign({ sub: id }, EFFECTIVE_JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      token,
      user: {
        id,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        role,
        email_verified: false,
        created_at: now.toISOString(),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
}

// Change Password Handler
export async function changePassword(req: AuthenticatedRequest, res: Response) {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ detail: 'Both current_password and new_password are required' });
  }

  const pwdCheck = validatePasswordStrength(new_password);
  if (!pwdCheck.valid) {
    return res.status(400).json({ detail: pwdCheck.reason });
  }

  try {
    const userRes = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user!.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const currentHash = userRes.rows[0].password_hash;
    if (!bcrypt.compareSync(current_password, currentHash)) {
      return res.status(400).json({ detail: 'Current password is incorrect' });
    }

    const salt = bcrypt.genSaltSync(12);
    const newHash = bcrypt.hashSync(new_password, salt);

    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.user!.id]);
    return res.json({ ok: true, detail: 'Password updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
}

function createEmailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  const transporter = createEmailTransporter();
  const from = process.env.SMTP_FROM || '"GrowthLens Support" <noreply@lensgrowth.codovatesolutions.in>';

  if (transporter) {
    await transporter.sendMail({
      from,
      to: email,
      subject: 'Reset your GrowthLens password',
      text: `Hello,\n\nYou requested to reset your password. Click the link below to set a new password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.\n\nThanks,\nGrowthLens Team`,
      html: `<p>Hello,</p><p>You requested to reset your password. Click the link below to set a new password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request this, please ignore this email.</p><br/><p>Thanks,<br/>GrowthLens Team</p>`,
    });
  } else {
    // Non-production fallback logging without exposing raw secret details in production logs
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[PASSWORD RESET DEV] Dispatching password reset link to ${email}`);
    } else {
      console.error(`[PASSWORD RESET ERROR] SMTP credentials not configured (SMTP_HOST, SMTP_USER, SMTP_PASS missing). Email not sent to ${email}.`);
    }
  }
}

// Request Password Reset
export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ detail: 'Email is required' });
  }

  try {
    const userRes = await pool.query('SELECT id, email, name FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userRes.rows.length === 0) {
      // Return generic message to prevent account enumeration
      return res.json({ ok: true, detail: 'If that email exists in our system, a password reset link has been dispatched.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_expires = $2 WHERE email = $3',
      [resetToken, resetExpires, email.toLowerCase().trim()]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'https://lensgrowth.codovatesolutions.in';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    await sendPasswordResetEmail(email.toLowerCase().trim(), resetLink);

    return res.json({
      ok: true,
      detail: 'If that email exists in our system, a password reset link has been dispatched.',
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
}

// Reset Password Handler
export async function resetPassword(req: Request, res: Response) {
  const { token, new_password } = req.body;
  if (!token || !new_password) {
    return res.status(400).json({ detail: 'Token and new_password are required' });
  }

  const pwdCheck = validatePasswordStrength(new_password);
  if (!pwdCheck.valid) {
    return res.status(400).json({ detail: pwdCheck.reason });
  }

  try {
    const userRes = await pool.query(
      'SELECT id, reset_expires FROM users WHERE reset_token = $1',
      [token]
    );

    if (userRes.rows.length === 0) {
      return res.status(400).json({ detail: 'Invalid or expired password reset token' });
    }

    const user = userRes.rows[0];
    if (new Date(user.reset_expires) < new Date()) {
      return res.status(400).json({ detail: 'Password reset token has expired' });
    }

    const salt = bcrypt.genSaltSync(12);
    const newHash = bcrypt.hashSync(new_password, salt);

    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_expires = NULL, updated_at = NOW() WHERE id = $2',
      [newHash, user.id]
    );

    return res.json({ ok: true, detail: 'Password has been reset successfully. You may now log in.' });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
}

// Verify Email Handler
export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ detail: 'Verification token is required' });
  }

  try {
    const resUser = await pool.query(
      'UPDATE users SET email_verified = true, verification_token = NULL WHERE verification_token = $1 RETURNING id, email',
      [token]
    );

    if (resUser.rows.length === 0) {
      return res.status(400).json({ detail: 'Invalid or expired verification token' });
    }

    return res.json({ ok: true, detail: 'Email successfully verified' });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
}
