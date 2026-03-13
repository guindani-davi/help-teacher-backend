ALTER TABLE organizations
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE memberships
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE organizations SET is_active = FALSE WHERE status = 'deleted';
UPDATE memberships  SET is_active = FALSE WHERE status = 'deleted';

ALTER TABLE organizations DROP COLUMN status;
ALTER TABLE memberships  DROP COLUMN status;

DROP TYPE status;
