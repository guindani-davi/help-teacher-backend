CREATE TYPE status AS ENUM ('active', 'inactive', 'deleted');

ALTER TABLE organizations
  ADD COLUMN created_by UUID NOT NULL REFERENCES users(id),
  ADD COLUMN updated_by UUID REFERENCES users(id),
  ADD COLUMN status status NOT NULL DEFAULT 'active';

ALTER TABLE organizations_users
  ADD COLUMN created_by UUID NOT NULL REFERENCES users(id),
  ADD COLUMN updated_by UUID REFERENCES users(id),
  ADD COLUMN status status NOT NULL DEFAULT 'active';
