ALTER TABLE classes ADD COLUMN teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
