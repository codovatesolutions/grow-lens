import axios from 'axios';
import crypto from 'crypto';
import { BaseSocialProvider, Platform, TokenData, PostData, PublishResult, ProfileData } from './base.provider';

const CLIENT_ID     = process.env.TWITTER_CLIENT_ID     || '';
const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET || '';
const BASE          = 'https://api.twitter.com/2';

// PKCE helpers
function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}
function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// In-memory PKCE store (use Redis/DB in production for multi-instance)
const pkceStore = new Map<string, string>();

export class TwitterProvider extends BaseSocialProvider {
  readonly platform: Platform = 'twitter';

  getOAuthUrl(state: string): string {
    const redirectUri   = `${process.env.BACKEND_URL}/api/social/callback/twitter`;
    const verifier      = generateCodeVerifier();
    const challenge     = generateCodeChallenge(verifier);
    pkceStore.set(state, verifier);
    // Clean up after 10 min
    setTimeout(() => pkceStore.delete(state), 600_000);

    return (
      `https://twitter.com/i/oauth2/authorize?response_type=code` +
      `&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent('tweet.read tweet.write users.read offline.access')}` +
      `&state=${state}&code_challenge=${challenge}&code_challenge_method=S256`
    );
  }

  async exchangeCode(code: string, redirectUri: string, state?: string): Promise<TokenData> {
    const verifier = state ? pkceStore.get(state) : undefined;
    pkceStore.delete(state || '');

    const params = new URLSearchParams({
      code,
      grant_type:    'authorization_code',
      redirect_uri:  redirectUri,
      code_verifier: verifier || '',
    });

    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const { data } = await axios.post('https://api.twitter.com/2/oauth2/token', params, {
      headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const profile = await this.getProfile(data.access_token);
    return {
      accessToken:  data.access_token,
      refreshToken: data.refresh_token,
      expiresAt:    data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
      scope:        data.scope,
      accountId:    profile.accountId,
      accountName:  profile.accountName,
      avatarUrl:    profile.avatarUrl,
    };
  }

  async publish(accessToken: string, post: PostData): Promise<PublishResult> {
    try {
      const text = this.buildCaption(post).slice(0, 280);
      const body: any = { text };

      if (post.media.length > 0) {
        // Twitter requires media to be uploaded via v1.1 media upload first
        // For simplicity we include the URL as part of the text if needed
        if (!text.includes(post.media[0].url)) {
          body.text = `${text} ${post.media[0].url}`.slice(0, 280);
        }
      }

      const { data } = await axios.post(`${BASE}/tweets`, body, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const tweetId = data.data?.id;
      return { success: true, platformPostId: tweetId, url: `https://twitter.com/i/web/status/${tweetId}` };
    } catch (err) {
      return this.handleError(err, 'publish');
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenData> {
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const { data } = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
      { headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return {
      accessToken:  data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt:    data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  }

  async getProfile(accessToken: string): Promise<ProfileData> {
    const { data } = await axios.get(`${BASE}/users/me`, {
      params: { 'user.fields': 'id,name,username,profile_image_url' },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return {
      accountId:   data.data.id,
      accountName: `@${data.data.username}`,
      avatarUrl:   data.data.profile_image_url,
    };
  }
}
