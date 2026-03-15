
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'pro');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled');

ALTER TABLE users ADD COLUMN asaas_customer_id TEXT UNIQUE;

CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tier subscription_tier NOT NULL,
  price_cents INTEGER NOT NULL,
  billing_cycle billing_cycle,
  asaas_description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  asaas_subscription_id TEXT UNIQUE,
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT unique_user_subscription UNIQUE (user_id)
);

CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscription_plans_tier ON subscription_plans(tier);
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_asaas_sub_id ON user_subscriptions(asaas_subscription_id);
CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id);

INSERT INTO subscription_plans (name, tier, price_cents, billing_cycle, asaas_description) VALUES
  ('Help Tutor Free Plan', 'free', 0, NULL, 'Help Tutor Free Plan'),
  ('Help Tutor Basic Monthly Plan', 'basic', 19800, 'monthly', 'Help Tutor Basic Monthly Plan'),
  ('Help Tutor Pro Monthly Plan', 'pro', 29800, 'monthly', 'Help Tutor Pro Monthly Plan');
