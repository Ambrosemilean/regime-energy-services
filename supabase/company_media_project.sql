-- Add gallery metadata to company_media:
--   project — the project name an image belongs to, shown as a chip on the
--             Projects & Gallery page and editable from the admin media
--             manager. Safe to re-run: only adds the column when missing.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'company_media'
      AND column_name = 'project'
  ) THEN
    ALTER TABLE public.company_media
      ADD COLUMN project text;
  END IF;
END $$;
