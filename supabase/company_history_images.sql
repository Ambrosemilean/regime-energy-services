-- Add image support to company_history milestones:
--   image_url — public URL of the milestone photo, uploaded to the
--               `history-images` storage bucket from the admin history
--               manager. Shown on the left of each milestone card on the
--               company history page.
--   alt_text  — accessibility description for the milestone image.
-- Safe to re-run: each column is only added when missing.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'company_history'
      AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.company_history
      ADD COLUMN image_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'company_history'
      AND column_name = 'alt_text'
  ) THEN
    ALTER TABLE public.company_history
      ADD COLUMN alt_text text;
  END IF;
END $$;
