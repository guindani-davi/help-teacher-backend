CREATE TYPE role AS ENUM ('admin', 'teacher', 'responsible');

CREATE TABLE IF NOT EXISTS organizations_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  roles role[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_organizations_users_user_id ON organizations_users(user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_users_organization_id ON organizations_users(organization_id);
