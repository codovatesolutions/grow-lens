import axios from 'axios';
import { BaseSocialProvider, Platform, TokenData, PostData, PublishResult, ProfileData } from './base.provider';

const CLIENT_ID     = process.env.YOUTUBE_CLIENT_ID     || '';
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || '';
const TOKEN_URL     = 'https://oauth2.googleapis.com/token';
const YT_BASE       = 'https://www.googleapis.com/youtube/v3';

export class YouTubeProvider extends BaseSocialProvider {
  readonly platform: Platform = 'youtube';

  getOAuthUrl(state: string): string {
    const redirectUri = `${process.env.BACKEND_URL}/api/social/callback/youtube`;
    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' ');
    return (
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code&scope=${encodeURIComponent(scopes)}` +
      `&access_type=offline&prompt=consent&state=${state}`
    );
  }

  async exchangeCode(code: string, redirectUri: string): Promise<TokenData> {
    const { data } = await axios.post(TOKEN_URL, new URLSearchParams({
      code, grant_type: 'authorization_code', client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET, redirect_uri: redirectUri,
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

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
      const media = post.media[0];
      if (!media || media.type !== 'video') {
        throw new Error('YouTube requires a video');
      }

      const caption = post.caption.slice(0, 5000);
      const tags    = post.hashtags.map(h => h.replace(/^#/, ''));

      // Initiate resumable upload
      const initResp = await axios.post(
        `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`,
        {
          snippet: { title: post.caption.slice(0, 100) || 'New Post', description: caption, tags },
          status:  { privacyStatus: 'public' },
        },
        {
          headers: {
            Authorization:   `Bearer ${accessToken}`,
            'Content-Type':  'application/json',
            'X-Upload-Content-Type': 'video/*',
          },
        }
      );

      const uploadUrl = initResp.headers['location'];
      if (!uploadUrl) throw new Error('Failed to get YouTube upload URL');

      // Download video from URL and stream to YouTube
      const videoResp = await axios.get(media.url, { responseType: 'arraybuffer' });
      const { data: ytData } = await axios.put(uploadUrl, videoResp.data, {
        headers: { 'Content-Type': 'video/*', Authorization: `Bearer ${accessToken}` },
      });

      return { success: true, platformPostId: ytData.id, url: `https://youtube.com/watch?v=${ytData.id}` };
    } catch (err) {
      return this.handleError(err, 'publish');
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenData> {
    const { data } = await axios.post(TOKEN_URL, new URLSearchParams({
      grant_type: 'refresh_token', refresh_token: refreshToken,
      client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    return {
      accessToken:  data.access_token,
      refreshToken: refreshToken,
      expiresAt:    data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  }

  async getProfile(accessToken: string): Promise<ProfileData> {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return {
      accountId:   data.id,
      accountName: data.name,
      avatarUrl:   data.picture,
    };
  }
}
