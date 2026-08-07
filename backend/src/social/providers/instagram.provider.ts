import axios from 'axios';
import { BaseSocialProvider, Platform, TokenData, PostData, PublishResult, ProfileData } from './base.provider';

// Instagram uses the Meta Graph API — same app credentials as Facebook
const APP_ID     = process.env.FACEBOOK_APP_ID     || '';
const APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';
const GRAPH      = 'https://graph.facebook.com/v19.0';

export class InstagramProvider extends BaseSocialProvider {
  readonly platform: Platform = 'instagram';

  getOAuthUrl(state: string): string {
    const redirectUri = this.getRedirectUri(this.platform);
    const scopes = [
      'instagram_basic',
      'instagram_content_publish',
      'pages_show_list',
      'pages_read_engagement',
    ].join(',');
    return (
      `https://www.facebook.com/v19.0/dialog/oauth?` +
      `client_id=${APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${scopes}&state=${state}&response_type=code`
    );
  }

  async exchangeCode(code: string, redirectUri: string): Promise<TokenData> {
    const { data } = await axios.get(`${GRAPH}/oauth/access_token`, {
      params: { client_id: APP_ID, client_secret: APP_SECRET, redirect_uri: redirectUri, code },
    });
    const { data: longLived } = await axios.get(`${GRAPH}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: APP_ID, client_secret: APP_SECRET,
        fb_exchange_token: data.access_token,
      },
    });
    const profile = await this.getProfile(longLived.access_token);
    return {
      accessToken: longLived.access_token,
      expiresAt:   longLived.expires_in ? new Date(Date.now() + longLived.expires_in * 1000) : undefined,
      accountId:   profile.accountId,
      accountName: profile.accountName,
      avatarUrl:   profile.avatarUrl,
      pageId:      profile.pageId,
    };
  }

  async publish(accessToken: string, post: PostData, igAccountId?: string): Promise<PublishResult> {
    try {
      if (!igAccountId) throw new Error('Instagram Business Account ID required');
      const caption = this.buildCaption(post);

      if (post.media.length === 0) {
        throw new Error('Instagram requires at least one image or video');
      }

      const media = post.media[0];

      if (media.type === 'image') {
        // Step 1: Create media container
        const { data: container } = await axios.post(`${GRAPH}/${igAccountId}/media`, {
          image_url:    media.url,
          caption,
          access_token: accessToken,
        });

        // Step 2: Publish the container
        const { data: published } = await axios.post(`${GRAPH}/${igAccountId}/media_publish`, {
          creation_id: container.id,
          access_token: accessToken,
        });

        return { success: true, platformPostId: published.id };
      } else if (media.type === 'video') {
        // Reels publish flow
        const { data: container } = await axios.post(`${GRAPH}/${igAccountId}/media`, {
          media_type:   'REELS',
          video_url:    media.url,
          caption,
          access_token: accessToken,
        });

        // Poll for upload completion (simplified — wait 10s)
        await new Promise(r => setTimeout(r, 10000));

        const { data: published } = await axios.post(`${GRAPH}/${igAccountId}/media_publish`, {
          creation_id: container.id,
          access_token: accessToken,
        });
        return { success: true, platformPostId: published.id };
      }

      throw new Error('Unsupported media type for Instagram');
    } catch (err) {
      return this.handleError(err, 'publish');
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenData> {
    const { data } = await axios.get(`${GRAPH}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: APP_ID, client_secret: APP_SECRET,
        fb_exchange_token: refreshToken,
      },
    });
    return { accessToken: data.access_token, expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined };
  }

  async getProfile(accessToken: string): Promise<ProfileData> {
    // Get Facebook pages, then find the linked IG Business account
    const { data: pages } = await axios.get(`${GRAPH}/me/accounts`, {
      params: { access_token: accessToken },
    });
    for (const page of (pages.data || [])) {
      try {
        const { data: ig } = await axios.get(`${GRAPH}/${page.id}`, {
          params: { fields: 'instagram_business_account', access_token: accessToken },
        });
        const igId = ig.instagram_business_account?.id;
        if (igId) {
          const { data: profile } = await axios.get(`${GRAPH}/${igId}`, {
            params: { fields: 'id,name,username,profile_picture_url', access_token: accessToken },
          });
          return {
            accountId:   igId,
            accountName: profile.username || profile.name,
            avatarUrl:   profile.profile_picture_url,
            pageId:      igId,
          };
        }
      } catch { /* continue */ }
    }
    // Fallback — return FB user
    const { data: me } = await axios.get(`${GRAPH}/me`, { params: { fields: 'id,name', access_token: accessToken } });
    return { accountId: me.id, accountName: me.name };
  }
}
