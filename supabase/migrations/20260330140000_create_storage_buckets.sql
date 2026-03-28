INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('organization-logos', 'organization-logos', true, 2097152, ARRAY['image/png', 'image/jpeg']),
  ('reports', 'reports', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;
