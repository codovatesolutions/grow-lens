import axios from 'axios';
import { BaseSocialProvider, Platform, TokenData, PostData, PublishResult, ProfileData } from './base.provider';

const CLIENT_ID     = process.env.LINKEDIN_CLIENT_ID     || '';
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || '';
const BASE          = 'https://api.linkedin.com/v2';

export class LinkedInProvider extends BaseSocialProvider {
  readonly platform: Platform = 'linkedin';

  getOAuthUrl(state: string): string {
    const redirectUri = `${process.env.BACKEND_URL}/api/social/callback/linkedin`;
    const scopes = 'openid,profile,email,w_member_social';
    return (
      `https://www.linkedin.com/oauth/v2/authorization?response_type=code` +
      `&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopes)}&state=${state}`
    );
  }

  async exchangeCode(code: string, redirectUri: string): Promise<TokenData> {
    const { data } = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
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
      const caption = this.buildCaption(post);

      // Get the member URN
      const { data: me } = await axios.get(`${BASE}/userinfo`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const authorUrn = `urn:li:person:${me.sub}`;

      const body: any = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: caption },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      };

      if (post.media.length > 0) {
        const media = post.media[0];
        body.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = media.type === 'video' ? 'VIDEO' : 'IMAGE';
        body.specificContent['com.linkedin.ugc.ShareContent'].media = [{
          status: 'READY',
          originalUrl: media.url,
          description: { text: post.caption.slice(0, 200) },
        }];
      }

      const { data: result } = await axios.post(`${BASE}/ugcPosts`, body, {
        headers: { Authorization: `Bearer ${accessToken}`, 'X-Restli-Protocol-Version': '2.0.0' },
      });

      const postId = result.id;
      return { success: true, platformPostId: postId, url: `https://linkedin.com/feed/update/${postId}` };
    } catch (err) {
      return this.handleError(err, 'publish');
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenData> {
    const { data } = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return {
      accessToken:  data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt:    data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  }

  async getProfile(accessToken: string): Promise<ProfileData> {
    const { data } = await axios.get(`${BASE}/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return {
      accountId:   data.sub,
      accountName: data.name || `${data.given_name} ${data.family_name}`,
      avatarUrl:   data.picture,
    };
  }
}
