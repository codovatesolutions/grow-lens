import { Request, Response, NextFunction } from 'express';
import { pool } from './db';

export interface PlanLimits {
  scansPerDay: number;
  growthTeamPerDay: number;
  creatorScansPerDay: number;
  tokensPerDay: number;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    scansPerDay: 5,
    growthTeamPerDay: 1,
    creatorScansPerDay: 3,
    tokensPerDay: 100000,
  },
  pro: {
    scansPerDay: 50,
    growthTeamPerDay: 10,
    creatorScansPerDay: 30,
    tokensPerDay: 1000000,
  },
  enterprise: {
    scansPerDay: 500,
    growthTeamPerDay: 100,
    creatorScansPerDay: 300,
    tokensPerDay: 10000000,
  },
};

export async function getUserPlan(userId: string): Promise<string> {
  try {
    const res = await pool.query('SELECT plan_id, status FROM subscriptions WHERE user_id = $1', [userId]);
    if (res.rows.length === 0 || res.rows[0].status !== 'active') {
      return 'free';
    }
    return res.rows[0].plan_id || 'free';
  } catch (err) {
    return 'free';
  }
}

export async function getDailyUsage(userId: string) {
  const today = new Date().toISOString().substring(0, 10);
  const res = await pool.query(
    'SELECT * FROM usage_records WHERE user_id = $1 AND usage_date = $2',
    [userId, today]
  );
  if (res.rows.length === 0) {
    return {
      scans_count: 0,
      llm_tokens_est: 0,
      growth_team_calls: 0,
      creator_scans_count: 0,
    };
  }
  return res.rows[0];
}

export async function incrementUsage(
  userId: string,
  metric: 'scans_count' | 'growth_team_calls' | 'creator_scans_count',
  tokensEst: number = 0
) {
  const today = new Date().toISOString().substring(0, 10);
  await pool.query(
    `INSERT INTO usage_records (user_id, usage_date, ${metric}, llm_tokens_est, updated_at)
     VALUES ($1, $2, 1, $3, NOW())
     ON CONFLICT (user_id, usage_date)
     DO UPDATE SET ${metric} = usage_records.${metric} + 1,
                   llm_tokens_est = usage_records.llm_tokens_est + $3,
                   updated_at = NOW()`,
    [userId, today, tokensEst]
  );
}

export function enforceQuota(action: 'scan' | 'growth_team' | 'creator') {
  return async (req: any, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ detail: 'Authentication required' });
    }

    const userId = req.user.id;
    const planId = await getUserPlan(userId);
    const limits = PLAN_LIMITS[planId] || PLAN_LIMITS.free;
    const usage = await getDailyUsage(userId);

    if (action === 'scan' && usage.scans_count >= limits.scansPerDay) {
      return res.status(429).json({
        detail: `Daily scan limit reached (${usage.scans_count}/${limits.scansPerDay}) for plan '${planId.toUpperCase()}'. Upgrade your subscription for higher limits.`,
        error_code: 'QUOTA_EXCEEDED',
        limit: limits.scansPerDay,
        used: usage.scans_count,
        plan: planId,
      });
    }

    if (action === 'growth_team' && usage.growth_team_calls >= limits.growthTeamPerDay) {
      return res.status(429).json({
        detail: `Daily AI Growth Team limit reached (${usage.growth_team_calls}/${limits.growthTeamPerDay}) for plan '${planId.toUpperCase()}'. The 13-expert panel requires high LLM throughput — upgrade to Pro or Enterprise for additional calls.`,
        error_code: 'QUOTA_EXCEEDED',
        limit: limits.growthTeamPerDay,
        used: usage.growth_team_calls,
        plan: planId,
      });
    }

    if (action === 'creator' && usage.creator_scans_count >= limits.creatorScansPerDay) {
      return res.status(429).json({
        detail: `Daily Creator analysis limit reached (${usage.creator_scans_count}/${limits.creatorScansPerDay}) for plan '${planId.toUpperCase()}'.`,
        error_code: 'QUOTA_EXCEEDED',
        limit: limits.creatorScansPerDay,
        used: usage.creator_scans_count,
        plan: planId,
      });
    }

    next();
  };
}
