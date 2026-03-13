ALTER TABLE organizations
  ADD COLUMN slug TEXT NOT NULL UNIQUE;

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
