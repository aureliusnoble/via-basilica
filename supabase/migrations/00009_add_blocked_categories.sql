-- Add blocked_categories column to daily_challenges
ALTER TABLE daily_challenges
ADD COLUMN blocked_categories TEXT[] DEFAULT '{}';
