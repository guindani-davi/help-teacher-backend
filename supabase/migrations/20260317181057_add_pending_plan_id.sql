-- Add pending_plan_id column for deferred downgrades
ALTER TABLE user_subscriptions
  ADD COLUMN pending_plan_id UUID REFERENCES subscription_plans(id);
