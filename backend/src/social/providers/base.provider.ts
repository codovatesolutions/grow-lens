import axios from 'axios';

// ============================================================
// Base Types & Abstract Provider
// All platform providers must extend BaseSocialProvider.
// Adding a new platform = create one new file implementing this.
// ============================================================

export type Platform =
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'twitter'
  | 'pinterest'
  | 'tiktok'
  | 'youtube';

export const ALL_PLATFORMS: Platform[] = [
  'facebook', 'instagram', 'linkedin', 'twitter', 'pinterest', 'tiktok', 'youtube',
];

export interface TokenData {
  accessToken:  string;
  refreshToken?: string;
  expiresAt?:   Date;
  scope?:       string;
  accountId?:   string;
  accountName?: string;
  pageId?:      string;
  avatarUrl?:   string;
}

export interface MediaItem {
  url:          string;
  type:         'image' | 'video';
  thumbnailUrl?: string;
}

export interface PostData {
  caption:   string;
  media:     MediaItem[];
  hashtags:  string[];
  link?:     string;
}

export interface PublishResult {
  success:          boolean;
  platformPostId?:  string;
  url?:             string;
  errorMessage?:    string;
}

export interface ProfileData {
  accountId:   string;
  accountName: string;
  avatarUrl?:  string;
  pageId?:     string;
}

export abstract class BaseSocialProvider {
  abstract readonly platform: Platform;

  /** Returns the OAuth authorization URL for the platform. */
  abstract getOAuthUrl(state: string): string;

  /** Exchange an OAuth authorization code for tokens. */
  abstract exchangeCode(code: string, redirectUri: string, state?: string): Promise<TokenData>;

  /** Publish a post to the platform. Returns the platform post ID. */
  abstract publish(accessToken: string, post: PostData, pageId?: string): Promise<PublishResult>;

  /** Refresh an expired access token. */
  abstract refreshToken(refreshToken: string): Promise<TokenData>;

  /** Fetch the connected user/page profile. */
  abstract getProfile(accessToken: string): Promise<ProfileData>;

  // ── Shared helpers ──────────────────────────────────────────

  protected buildCaption(post: PostData): string {
    const tags = post.hashtags.map(h => (h.startsWith('#') ? h : `#${h}`)).join(' ');
    return [post.caption, tags, post.link].filter(Boolean).join('\n\n');
  }

  protected handleError(err: unknown, context: string): PublishResult {
    const msg = axios.isAxiosError(err)
      ? err.response?.data?.error?.message || err.response?.data?.message || err.message
      : (err instanceof Error ? err.message : String(err));
    console.error(`[${this.platform}] ${context}:`, msg);
    return { success: false, errorMessage: msg };
  }
}
