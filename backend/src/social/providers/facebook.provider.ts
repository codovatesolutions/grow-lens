import axios from 'axios';
import { BaseSocialProvider, Platform, TokenData, PostData, PublishResult, ProfileData } from './base.provider';

const APP_ID     = process.env.FACEBOOK_APP_ID     || '';
const APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';
const GRAPH      = 'https://graph.facebook.com/v19.0';

export class FacebookProvider extends BaseSocialProvider {
  readonly platform: Platform = 'facebook';

  getOAuthUrl(state: string): string {
    const redirectUri = this.getRedirectUri(this.platform);
    const scopes = [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'pages_manage_metadata',
      'publish_to_groups',
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

    // Exchange short-lived for long-lived token
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

  async publish(accessToken: string, post: PostData, pageId?: string): Promise<PublishResult> {
    try {
      const targetId = pageId || 'me';
      const caption  = this.buildCaption(post);
      let response: any;

      if (post.media.length > 0 && post.media[0].type === 'image') {
        // Photo post
        const { data } = await axios.post(`${GRAPH}/${targetId}/photos`, {
          url:          post.media[0].url,
          caption,
          access_token: accessToken,
        });
        response = data;
      } else if (post.media.length > 0 && post.media[0].type === 'video') {
        // Video post
        const { data } = await axios.post(`${GRAPH}/${targetId}/videos`, {
          file_url:     post.media[0].url,
          description:  caption,
          access_token: accessToken,
        });
        response = data;
      } else {
        // Text-only post
        const { data } = await axios.post(`${GRAPH}/${targetId}/feed`, {
          message:      caption,
          access_token: accessToken,
        });
        response = data;
      }

      return { success: true, platformPostId: response.id, url: `https://facebook.com/${response.id}` };
    } catch (err) {
      return this.handleError(err, 'publish');
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenData> {
    // Facebook long-lived tokens don't need refresh — they last 60 days
    // Re-exchange the existing token to extend expiry
    const { data } = await axios.get(`${GRAPH}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: APP_ID, client_secret: APP_SECRET,
        fb_exchange_token: refreshToken,
      },
    });
    return {
      accessToken: data.access_token,
      expiresAt:   data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  }

  async getProfile(accessToken: string): Promise<ProfileData> {
    // Get user info
    const { data: me } = await axios.get(`${GRAPH}/me`, {
      params: { fields: 'id,name,picture', access_token: accessToken },
    });

    // Try to get managed pages
    try {
      const { data: pages } = await axios.get(`${GRAPH}/me/accounts`, {
        params: { access_token: accessToken },
      });
      const page = pages.data?.[0];
      return {
        accountId:   me.id,
        accountName: page ? page.name : me.name,
        avatarUrl:   me.picture?.data?.url,
        pageId:      page?.id,
      };
    } catch {
      return { accountId: me.id, accountName: me.name, avatarUrl: me.picture?.data?.url };
    }
  }
}
