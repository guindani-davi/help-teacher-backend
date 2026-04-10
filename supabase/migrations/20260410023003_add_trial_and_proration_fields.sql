-- Add has_used_trial flag to users table
ALTER TABLE users ADD COLUMN has_used_trial BOOLEAN NOT NULL DEFAULT false;

-- Add proration_asaas_payment_id to user_subscriptions table
ALTER TABLE user_subscriptions ADD COLUMN proration_asaas_payment_id TEXT DEFAULT NULL;
