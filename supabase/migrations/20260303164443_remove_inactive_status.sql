ALTER TYPE status RENAME TO status_old;

CREATE TYPE status AS ENUM ('active', 'deleted');

ALTER TABLE organizations
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE organizations
  ALTER COLUMN status TYPE status USING status::text::status;

ALTER TABLE organizations
  ALTER COLUMN status SET DEFAULT 'active'::status;

ALTER TABLE memberships
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE memberships
  ALTER COLUMN status TYPE status USING status::text::status;

ALTER TABLE memberships
  ALTER COLUMN status SET DEFAULT 'active'::status;

DROP TYPE status_old;
