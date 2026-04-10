-- Add 'trialing' to the subscription_status enum
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'trialing';

-- Add trial_ends_at column to user_subscriptions
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT NULL;

-- Delete any existing free-tier subscriptions
DELETE FROM user_subscriptions
WHERE plan_id IN (
  SELECT id FROM subscription_plans WHERE tier = 'free'
);

-- Delete the FREE plan
DELETE FROM subscription_plans WHERE tier = 'free';
