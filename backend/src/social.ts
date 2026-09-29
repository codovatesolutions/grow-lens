import crypto from 'crypto';
import { pool } from './db';
import axios from 'axios';

export interface SocialNetworkStatus {
  id: string;
  name: string;
  certified: boolean;
  status: 'certified' | 'experimental' | 'coming_soon';
  capabilities: string[];
}

export const NETWORKS: SocialNetworkStatus[] = [
  {
    id: 'x',
    name: 'X (formerly Twitter)',
    certified: true,
    status: 'certified',
    capabilities: ['OAuth 2.0 PKCE', 'Post Tweet', 'Profile Metrics'],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    certified: true,
    status: 'certified',
    capabilities: ['Posts API', 'Share Article', 'Company Page Insights'],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    certified: true,
    status: 'certified',
    capabilities: ['Profile GET API', 'Video Analytics'],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    certified: false,
    status: 'experimental',
    capabilities: ['Processing Polling (Beta)', 'Reel Drafts'],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    certified: false,
    status: 'coming_soon',
    capabilities: ['Shorts Analytics (Planned)'],
  },
  {
    id: 'facebook',
    name: 'Facebook',
    certified: false,
    status: 'coming_soon',
    capabilities: ['Page Insights (Planned)'],
  },
];

// Durable PKCE State Generator for X
export async function createXPKCEState(userId: string): Promise<{ state: string; codeVerifier: string; url: string }> {
  const state = crypto.randomBytes(16).toString('hex');
  const codeVerifier = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  await pool.query(
    'INSERT INTO oauth_states (user_id, provider, state, code_verifier, expires_at) VALUES ($1, $2, $3, $4, $5)',
    [userId, 'x', state, codeVerifier, expiresAt]
  );

  const clientId = process.env.X_CLIENT_ID || 'DEMO_X_CLIENT_ID';
  const redirectUri = encodeURIComponent(process.env.X_REDIRECT_URI || 'https://growthlens.ai/api/social/x/callback');
  const url = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=tweet.read%20tweet.write%20users.read&state=${state}&code_challenge=${codeVerifier}&code_challenge_method=plain`;

  return { state, codeVerifier, url };
}

export async function consumeOAuthState(state: string, provider: string): Promise<{ valid: boolean; userId?: string; codeVerifier?: string; error?: string }> {
  const res = await pool.query(
    'SELECT * FROM oauth_states WHERE state = $1 AND provider = $2',
    [state, provider]
  );

  if (res.rows.length === 0) {
    return { valid: false, error: 'Invalid or expired state parameter' };
  }

  const record = res.rows[0];
  await pool.query('DELETE FROM oauth_states WHERE id = $1', [record.id]);

  if (new Date(record.expires_at) < new Date()) {
    return { valid: false, error: 'OAuth state parameter has expired' };
  }

  return {
    valid: true,
    userId: record.user_id,
    codeVerifier: record.code_verifier,
  };
}

// TikTok GET Profile Endpoint
export async function getTikTokProfile(handle: string) {
  const cleanHandle = handle.replace('@', '').trim();
  try {
    const res = await axios.get(`https://www.tiktok.com/@${cleanHandle}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      timeout: 8000,
    });
    
    return {
      handle: cleanHandle,
      url: `https://www.tiktok.com/@${cleanHandle}`,
      status: 'active',
      public_read: true,
      scraped_at: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      handle: cleanHandle,
      url: `https://www.tiktok.com/@${cleanHandle}`,
      status: 'unavailable_or_restricted',
      public_read: false,
      error: err.message,
    };
  }
}

// LinkedIn Posts API Helper
export async function createLinkedInPost(userId: string, text: string, title?: string) {
  if (!text || text.trim().length === 0) {
    throw new Error('Post content text is required');
  }

  const postPayload = {
    author: `urn:li:person:${userId}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: text.trim(),
        },
        shareMediaCategory: title ? 'ARTICLE' : 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
    created_at: new Date().toISOString(),
  };

  return postPayload;
}
