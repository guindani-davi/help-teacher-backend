-- Remove ON DELETE CASCADE from all FK constraints and replace with RESTRICT.
-- The application layer now handles cascading soft-deletes.

-- memberships
ALTER TABLE memberships DROP CONSTRAINT memberships_user_id_fkey;
ALTER TABLE memberships ADD CONSTRAINT memberships_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE memberships DROP CONSTRAINT memberships_organization_id_fkey;
ALTER TABLE memberships ADD CONSTRAINT memberships_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;

-- password_reset_tokens
ALTER TABLE password_reset_tokens DROP CONSTRAINT password_reset_tokens_user_id_fkey;
ALTER TABLE password_reset_tokens ADD CONSTRAINT password_reset_tokens_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

-- refresh_tokens
ALTER TABLE refresh_tokens DROP CONSTRAINT refresh_tokens_user_id_fkey;
ALTER TABLE refresh_tokens ADD CONSTRAINT refresh_tokens_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

-- invites
ALTER TABLE invites DROP CONSTRAINT invites_organization_id_fkey;
ALTER TABLE invites ADD CONSTRAINT invites_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;

-- user_subscriptions
ALTER TABLE user_subscriptions DROP CONSTRAINT user_subscriptions_user_id_fkey;
ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

-- education_levels
ALTER TABLE education_levels DROP CONSTRAINT education_levels_organization_id_fkey;
ALTER TABLE education_levels ADD CONSTRAINT education_levels_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;

-- grade_levels
ALTER TABLE grade_levels DROP CONSTRAINT grade_levels_education_level_id_fkey;
ALTER TABLE grade_levels ADD CONSTRAINT grade_levels_education_level_id_fkey
  FOREIGN KEY (education_level_id) REFERENCES education_levels(id) ON DELETE RESTRICT;

ALTER TABLE grade_levels DROP CONSTRAINT grade_levels_organization_id_fkey;
ALTER TABLE grade_levels ADD CONSTRAINT grade_levels_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;

-- schools
ALTER TABLE schools DROP CONSTRAINT schools_organization_id_fkey;
ALTER TABLE schools ADD CONSTRAINT schools_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;

-- students
ALTER TABLE students DROP CONSTRAINT students_organization_id_fkey;
ALTER TABLE students ADD CONSTRAINT students_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;

-- student_users
ALTER TABLE student_users DROP CONSTRAINT student_users_student_id_fkey;
ALTER TABLE student_users ADD CONSTRAINT student_users_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT;

ALTER TABLE student_users DROP CONSTRAINT student_users_user_id_fkey;
ALTER TABLE student_users ADD CONSTRAINT student_users_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

-- registrations
ALTER TABLE registrations DROP CONSTRAINT registrations_student_id_fkey;
ALTER TABLE registrations ADD CONSTRAINT registrations_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT;

ALTER TABLE registrations DROP CONSTRAINT registrations_school_id_fkey;
ALTER TABLE registrations ADD CONSTRAINT registrations_school_id_fkey
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

ALTER TABLE registrations DROP CONSTRAINT registrations_grade_level_id_fkey;
ALTER TABLE registrations ADD CONSTRAINT registrations_grade_level_id_fkey
  FOREIGN KEY (grade_level_id) REFERENCES grade_levels(id) ON DELETE RESTRICT;

ALTER TABLE registrations DROP CONSTRAINT registrations_organization_id_fkey;
ALTER TABLE registrations ADD CONSTRAINT registrations_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;

-- schedules
ALTER TABLE schedules DROP CONSTRAINT schedules_organization_id_fkey;
ALTER TABLE schedules ADD CONSTRAINT schedules_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;

-- classes
ALTER TABLE classes DROP CONSTRAINT classes_schedule_id_fkey;
ALTER TABLE classes ADD CONSTRAINT classes_schedule_id_fkey
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE RESTRICT;

ALTER TABLE classes DROP CONSTRAINT classes_student_id_fkey;
ALTER TABLE classes ADD CONSTRAINT classes_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT;

ALTER TABLE classes DROP CONSTRAINT classes_organization_id_fkey;
ALTER TABLE classes ADD CONSTRAINT classes_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;

-- topics
ALTER TABLE topics DROP CONSTRAINT topics_grade_level_id_fkey;
ALTER TABLE topics ADD CONSTRAINT topics_grade_level_id_fkey
  FOREIGN KEY (grade_level_id) REFERENCES grade_levels(id) ON DELETE RESTRICT;

ALTER TABLE topics DROP CONSTRAINT topics_organization_id_fkey;
ALTER TABLE topics ADD CONSTRAINT topics_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;

-- class_topics
ALTER TABLE class_topics DROP CONSTRAINT class_topics_class_id_fkey;
ALTER TABLE class_topics ADD CONSTRAINT class_topics_class_id_fkey
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE RESTRICT;

ALTER TABLE class_topics DROP CONSTRAINT class_topics_topic_id_fkey;
ALTER TABLE class_topics ADD CONSTRAINT class_topics_topic_id_fkey
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE RESTRICT;
