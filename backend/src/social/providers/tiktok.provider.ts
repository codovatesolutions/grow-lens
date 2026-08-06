import axios from 'axios';
import { BaseSocialProvider, Platform, TokenData, PostData, PublishResult, ProfileData } from './base.provider';

const CLIENT_KEY    = process.env.TIKTOK_CLIENT_KEY    || '';
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || '';
const BASE          = 'https://open.tiktokapis.com/v2';

export class TikTokProvider extends BaseSocialProvider {
  readonly platform: Platform = 'tiktok';

  getOAuthUrl(state: string): string {
    const redirectUri = `${process.env.BACKEND_URL}/api/social/callback/tiktok`;
    const scopes = 'user.info.basic,video.publish,video.upload';
    return (
      `https://www.tiktok.com/v2/auth/authorize/?client_key=${CLIENT_KEY}` +
      `&response_type=code&scope=${encodeURIComponent(scopes)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
    );
  }

  async exchangeCode(code: string, redirectUri: string): Promise<TokenData> {
    const { data } = await axios.post(
      `${BASE}/oauth/token/`,
      new URLSearchParams({ code, grant_type: 'authorization_code', client_key: CLIENT_KEY, client_secret: CLIENT_SECRET, redirect_uri: redirectUri }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const profile = await this.getProfile(data.data.access_token);
    return {
      accessToken:  data.data.access_token,
      refreshToken: data.data.refresh_token,
      expiresAt:    new Date(Date.now() + (data.data.expires_in || 86400) * 1000),
      scope:        data.data.scope,
      accountId:    profile.accountId,
      accountName:  profile.accountName,
      avatarUrl:    profile.avatarUrl,
    };
  }

  async publish(accessToken: string, post: PostData): Promise<PublishResult> {
    try {
      const media = post.media[0];
      if (!media || media.type !== 'video') {
        throw new Error('TikTok requires a video');
      }

      const caption = this.buildCaption(post).slice(0, 2200);

      // Step 1: Initialize video upload
      const { data: init } = await axios.post(
        `${BASE}/post/publish/video/init/`,
        {
          post_info: {
            title: caption,
            privacy_level: 'PUBLIC_TO_EVERYONE',
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
          },
          source_info: {
            source: 'PULL_FROM_URL',
            video_url: media.url,
          },
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const publishId = init.data?.publish_id;
      return { success: true, platformPostId: publishId, url: 'https://tiktok.com/@me' };
    } catch (err) {
      return this.handleError(err, 'publish');
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenData> {
    const { data } = await axios.post(
      `${BASE}/oauth/token/`,
      new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken, client_key: CLIENT_KEY, client_secret: CLIENT_SECRET }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return {
      accessToken:  data.data.access_token,
      refreshToken: data.data.refresh_token || refreshToken,
      expiresAt:    new Date(Date.now() + (data.data.expires_in || 86400) * 1000),
    };
  }

  async getProfile(accessToken: string): Promise<ProfileData> {
    const { data } = await axios.post(
      `${BASE}/user/info/`,
      {},
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { fields: 'open_id,union_id,avatar_url,display_name' },
      }
    );
    const u = data.data?.user;
    return {
      accountId:   u?.open_id || 'unknown',
      accountName: u?.display_name || 'TikTok User',
      avatarUrl:   u?.avatar_url,
    };
  }
}
