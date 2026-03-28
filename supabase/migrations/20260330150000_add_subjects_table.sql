-- Create subjects table
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX idx_subjects_organization_id ON subjects(organization_id);

-- Replace grade_level_id with subject_id on topics
ALTER TABLE topics DROP CONSTRAINT topics_grade_level_id_fkey;
ALTER TABLE topics DROP COLUMN grade_level_id;

ALTER TABLE topics ADD COLUMN subject_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE topics ALTER COLUMN subject_id DROP DEFAULT;
ALTER TABLE topics ADD CONSTRAINT topics_subject_id_fkey
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT;

CREATE INDEX idx_topics_subject_id ON topics(subject_id);
