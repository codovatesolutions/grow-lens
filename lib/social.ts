import { api } from './api';

// ── Types ─────────────────────────────────────────────────────

export type Platform =
  | 'facebook' | 'instagram' | 'linkedin' | 'twitter'
  | 'pinterest' | 'tiktok' | 'youtube';

export const ALL_PLATFORMS: Platform[] = [
  'facebook', 'instagram', 'linkedin', 'twitter', 'pinterest', 'tiktok', 'youtube',
];

export interface PlatformConfig {
  name:         string;
  color:        string;
  bgGradient:   string;
  textColor:    string;
  charLimit:    number;
  mediaTypes:   string[];
  supportsText: boolean;
  supportsImage: boolean;
  supportsVideo: boolean;
}

export const PLATFORM_CONFIG: Record<Platform, PlatformConfig> = {
  facebook:  { name: 'Facebook',    color: '#1877F2', bgGradient: 'from-[#1877F2] to-[#0d5dbf]',              textColor: '#fff', charLimit: 63206, mediaTypes: ['image/jpeg','image/png','image/webp','video/mp4'], supportsText: true,  supportsImage: true, supportsVideo: true  },
  instagram: { name: 'Instagram',   color: '#E4405F', bgGradient: 'from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]', textColor: '#fff', charLimit: 2200,  mediaTypes: ['image/jpeg','image/png','video/mp4'],             supportsText: false, supportsImage: true, supportsVideo: true  },
  linkedin:  { name: 'LinkedIn',    color: '#0A66C2', bgGradient: 'from-[#0A66C2] to-[#004182]',              textColor: '#fff', charLimit: 3000,  mediaTypes: ['image/jpeg','image/png','video/mp4'],             supportsText: true,  supportsImage: true, supportsVideo: true  },
  twitter:   { name: 'X (Twitter)', color: '#000000', bgGradient: 'from-[#1a1a1a] to-[#000]',                 textColor: '#fff', charLimit: 280,   mediaTypes: ['image/jpeg','image/png','image/webp','video/mp4'], supportsText: true,  supportsImage: true, supportsVideo: true  },
  pinterest: { name: 'Pinterest',   color: '#E60023', bgGradient: 'from-[#E60023] to-[#ad081b]',              textColor: '#fff', charLimit: 500,   mediaTypes: ['image/jpeg','image/png','video/mp4'],             supportsText: false, supportsImage: true, supportsVideo: true  },
  tiktok:    { name: 'TikTok',      color: '#010101', bgGradient: 'from-[#010101] to-[#1a1a1a]',              textColor: '#fff', charLimit: 2200,  mediaTypes: ['video/mp4','video/webm'],                         supportsText: false, supportsImage: false,supportsVideo: true  },
  youtube:   { name: 'YouTube',     color: '#FF0000', bgGradient: 'from-[#FF0000] to-[#cc0000]',              textColor: '#fff', charLimit: 5000,  mediaTypes: ['video/mp4','video/mov','video/avi'],              supportsText: false, supportsImage: false,supportsVideo: true  },
};

export interface SocialAccount {
  id:           string;
  platform:     Platform;
  account_name: string | null;
  account_id:   string | null;
  avatar_url:   string | null;
  is_connected: boolean;
  expires_at:   string | null;
  created_at:   string;
}

export interface MediaItem {
  url:          string;
  type:         'image' | 'video';
  thumbnailUrl?: string;
  publicId?:    string;
}

export interface CreatePostPayload {
  caption:   string;
  mediaUrls: MediaItem[];
  hashtags:  string[];
  platforms: Platform[];
  link?:     string;
}

export interface SchedulePostPayload extends CreatePostPayload {
  scheduledAt: string;
}

export interface PublishResult {
  postId:   string;
  status:   string;
  results:  Record<Platform, { success: boolean; error?: string }>;
}

export interface PublishHistoryItem {
  id:            string;
  platform:      Platform;
  caption:       string;
  media_url?:    string;
  thumbnail_url?: string;
  status:        'published' | 'failed' | 'scheduled' | 'pending' | 'cancelled';
  error_message?: string;
  published_at?: string;
  created_at:    string;
}

export interface ScheduledPost {
  job_id:       string;
  scheduled_at: string;
  job_status:   string;
  id:           string;
  caption:      string;
  platforms:    Platform[];
  media_urls:   MediaItem[];
}

export interface SocialAnalytics {
  totalPosts:      number;
  publishedPosts:  number;
  platformBreakdown: Record<string, { posts: number; published: number; failed: number }>;
}

// ── API functions ─────────────────────────────────────────────

export const socialApi = {
  getAccounts: (): Promise<SocialAccount[]> =>
    api.get('/social/accounts').then(r => r.data),

  getOAuthUrl: (platform: Platform): Promise<{ authUrl: string }> =>
    api.get(`/social/oauth-url/${platform}`).then(r => r.data),

  connectDemo: (platform: Platform): Promise<{ success: boolean; accountName: string }> =>
    api.post(`/social/connect-demo/${platform}`).then(r => r.data),

  connectAllDemo: (): Promise<{ success: boolean }> =>
    api.post('/social/connect-all-demo').then(r => r.data),

  disconnect: (platform: Platform): Promise<void> =>
    api.delete(`/social/disconnect/${platform}`).then(r => r.data),

  publish: (payload: CreatePostPayload): Promise<PublishResult> =>
    api.post('/social/publish', payload).then(r => r.data),

  schedule: (payload: SchedulePostPayload): Promise<{ jobId: string; scheduledAt: string }> =>
    api.post('/social/schedule', payload).then(r => r.data),

  reschedule: (jobId: string, scheduledAt: string): Promise<void> =>
    api.patch(`/social/schedule/${jobId}`, { scheduledAt }).then(r => r.data),

  cancelSchedule: (jobId: string): Promise<void> =>
    api.delete(`/social/schedule/${jobId}`).then(r => r.data),

  getHistory: (filters?: { platform?: string; status?: string; dateRange?: string }): Promise<PublishHistoryItem[]> =>
    api.get('/social/history', { params: filters }).then(r => r.data),

  getScheduled: (): Promise<ScheduledPost[]> =>
    api.get('/social/scheduled').then(r => r.data),

  getAnalytics: (): Promise<SocialAnalytics> =>
    api.get('/social/analytics').then(r => r.data),

  uploadMedia: async (file: File): Promise<MediaItem> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/social/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  generateCaption: (prompt: string, tone: string, platform: Platform): Promise<{ caption: string }> =>
    api.post('/social/ai/caption', { prompt, tone, platform }).then(r => r.data),

  generateHashtags: (caption: string, platform: Platform): Promise<{ hashtags: string[] }> =>
    api.post('/social/ai/hashtags', { caption, platform }).then(r => r.data),

  getBestTime: (platform: Platform): Promise<{ time: string; reason: string }> =>
    api.get(`/social/ai/best-time/${platform}`).then(r => r.data),

  rewrite: (caption: string, platform: Platform): Promise<{ caption: string }> =>
    api.post('/social/ai/rewrite', { caption, platform }).then(r => r.data),
};
