import { Request, Response, NextFunction } from 'express';
import { pool } from './db';
import { PLAN_LIMITS, getDailyUsage } from './quotas';

export async function getUserSubscription(userId: string) {
  const res = await pool.query('SELECT * FROM subscriptions WHERE user_id = $1', [userId]);
  if (res.rows.length === 0) {
    return {
      user_id: userId,
      plan_id: 'free',
      status: 'active',
      current_period_end: null,
    };
  }
  return res.rows[0];
}

export function requirePlan(minPlan: 'pro' | 'enterprise') {
  return async (req: any, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ detail: 'Authentication required' });
    }

    const sub = await getUserSubscription(req.user.id);
    const plan = sub.plan_id || 'free';

    const levels: Record<string, number> = { free: 1, pro: 2, enterprise: 3 };
    const userLevel = levels[plan] || 1;
    const requiredLevel = levels[minPlan] || 2;

    if (userLevel < requiredLevel || sub.status !== 'active') {
      return res.status(403).json({
        detail: `This feature requires an active '${minPlan.toUpperCase()}' subscription plan. Your current plan is '${plan.toUpperCase()}'.`,
        error_code: 'INSUFFICIENT_ENTITLEMENT',
        current_plan: plan,
        required_plan: minPlan,
      });
    }

    next();
  };
}

export async function handleBillingWebhook(event: any) {
  const { type, data } = event;

  if (type === 'checkout.session.completed') {
    const session = data.object;
    const userId = session.client_reference_id || session.metadata?.user_id;
    const planId = session.metadata?.plan_id || 'pro';
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    if (userId) {
      await pool.query(
        `INSERT INTO subscriptions (user_id, plan_id, status, stripe_customer_id, stripe_subscription_id, current_period_end, updated_at)
         VALUES ($1, $2, 'active', $3, $4, NOW() + INTERVAL '30 days', NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET plan_id = $2, status = 'active', stripe_customer_id = $3, stripe_subscription_id = $4, current_period_end = NOW() + INTERVAL '30 days', updated_at = NOW()`,
        [userId, planId, customerId, subscriptionId]
      );
    }
  } else if (type === 'customer.subscription.updated') {
    const subscription = data.object;
    const customerId = subscription.customer;
    const status = subscription.status === 'active' ? 'active' : 'canceled';

    await pool.query(
      'UPDATE subscriptions SET status = $1, current_period_end = to_timestamp($2), updated_at = NOW() WHERE stripe_customer_id = $3',
      [status, subscription.current_period_end, customerId]
    );
  } else if (type === 'customer.subscription.deleted') {
    const subscription = data.object;
    const customerId = subscription.customer;

    await pool.query(
      "UPDATE subscriptions SET plan_id = 'free', status = 'canceled', updated_at = NOW() WHERE stripe_customer_id = $1",
      [customerId]
    );
  }
}
