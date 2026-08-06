import axios from 'axios';
import { BaseSocialProvider, Platform, TokenData, PostData, PublishResult, ProfileData } from './base.provider';

const APP_ID     = process.env.PINTEREST_APP_ID     || '';
const APP_SECRET = process.env.PINTEREST_APP_SECRET || '';
const BASE       = 'https://api.pinterest.com/v5';

export class PinterestProvider extends BaseSocialProvider {
  readonly platform: Platform = 'pinterest';

  getOAuthUrl(state: string): string {
    const redirectUri = `${process.env.BACKEND_URL}/api/social/callback/pinterest`;
    return (
      `https://www.pinterest.com/oauth/?client_id=${APP_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code&scope=boards:read,pins:read,pins:write&state=${state}`
    );
  }

  async exchangeCode(code: string, redirectUri: string): Promise<TokenData> {
    const credentials = Buffer.from(`${APP_ID}:${APP_SECRET}`).toString('base64');
    const { data } = await axios.post(
      `${BASE}/oauth/token`,
      new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri }),
      { headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
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
      const description = this.buildCaption(post).slice(0, 500);
      const media = post.media[0];

      if (!media) throw new Error('Pinterest requires an image or video');

      const body: any = {
        title:       post.caption.slice(0, 100),
        description,
        link:        post.link || undefined,
        media_source: media.type === 'video'
          ? { source_type: 'video_url', url: media.url, cover_image_url: media.thumbnailUrl }
          : { source_type: 'image_url', url: media.url },
      };

      const { data } = await axios.post(`${BASE}/pins`, body, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return { success: true, platformPostId: data.id, url: `https://pinterest.com/pin/${data.id}` };
    } catch (err) {
      return this.handleError(err, 'publish');
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenData> {
    const credentials = Buffer.from(`${APP_ID}:${APP_SECRET}`).toString('base64');
    const { data } = await axios.post(
      `${BASE}/oauth/token`,
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
    const { data } = await axios.get(`${BASE}/user_account`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return {
      accountId:   data.username,
      accountName: data.username,
      avatarUrl:   data.profile_image,
    };
  }
}
