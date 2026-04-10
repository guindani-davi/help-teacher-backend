CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

ALTER TABLE schedules DROP COLUMN name;
ALTER TABLE schedules ADD COLUMN day_of_week day_of_week NOT NULL;
ALTER TABLE schedules ADD COLUMN start_time TIME NOT NULL;
ALTER TABLE schedules ADD COLUMN end_time TIME NOT NULL;
ALTER TABLE schedules ADD CONSTRAINT chk_schedules_end_after_start CHECK (end_time > start_time);