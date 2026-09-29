import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { pool } from './db';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Initialize Stripe SDK safely
export const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY)
  : null;

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

export async function createCheckoutSession(userId: string, userEmail: string, planId: string): Promise<{ checkout_url: string; mode: string }> {
  const targetPlan = planId.toLowerCase() === 'enterprise' ? 'enterprise' : 'pro';
  const priceId = targetPlan === 'enterprise'
    ? (process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_mock')
    : (process.env.STRIPE_PRICE_PRO || 'price_pro_mock');

  const frontendUrl = process.env.FRONTEND_URL || 'https://lensgrowth.codovatesolutions.in';

  if (stripe && STRIPE_SECRET_KEY) {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: userEmail,
      client_reference_id: userId,
      metadata: { user_id: userId, plan_id: targetPlan },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/billing?canceled=true`,
    });
    return { checkout_url: session.url || `${frontendUrl}/billing?success=true`, mode: 'stripe' };
  }

  // Strict test-only bypass: requires BOTH NODE_ENV === 'test' AND ALLOW_TEST_BILLING_BYPASS === 'true'
  const isTestBypass = process.env.NODE_ENV === 'test' && process.env.ALLOW_TEST_BILLING_BYPASS === 'true';
  if (!isTestBypass) {
    throw new Error('Stripe billing is not configured in production. Please provide STRIPE_SECRET_KEY in environment variables.');
  }

  // Test-only provisioning bypass
  await pool.query(
    `INSERT INTO subscriptions (user_id, plan_id, status, current_period_end, updated_at)
     VALUES ($1, $2, 'active', NOW() + INTERVAL '30 days', NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET plan_id = $2, status = 'active', current_period_end = NOW() + INTERVAL '30 days', updated_at = NOW()`,
    [userId, targetPlan]
  );

  return {
    checkout_url: `/billing?success=true&plan=${targetPlan}`,
    mode: 'test_provision',
  };
}

export async function handleBillingWebhook(req: Request, res: Response) {
  // Fail-closed: reject requests if Stripe or Webhook Secret is not configured
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({
      detail: 'Stripe webhook is not configured',
    });
  }

  const signature = req.headers['stripe-signature'];

  if (!signature) {
    return res.status(400).json({
      detail: 'Missing stripe-signature header',
    });
  }

  let event: Stripe.Event;

  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body);
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature as string,
      STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return res.status(400).json({
      detail: 'Invalid Stripe webhook signature',
    });
  }

  const type = event.type;
  const data = event.data;

  if (type === 'checkout.session.completed') {
    const session = data?.object as any || {};
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
    const subscription = data?.object as any || {};
    const customerId = subscription.customer;
    const status = subscription.status === 'active' ? 'active' : 'canceled';

    await pool.query(
      'UPDATE subscriptions SET status = $1, current_period_end = to_timestamp($2), updated_at = NOW() WHERE stripe_customer_id = $3',
      [status, subscription.current_period_end || Math.floor(Date.now() / 1000) + 30 * 86400, customerId]
    );
  } else if (type === 'customer.subscription.deleted') {
    const subscription = data?.object as any || {};
    const customerId = subscription.customer;

    await pool.query(
      "UPDATE subscriptions SET plan_id = 'free', status = 'canceled', updated_at = NOW() WHERE stripe_customer_id = $1",
      [customerId]
    );
  }

  return res.json({ received: true });
}
