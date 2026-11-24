-- Optional hardening: restrict content writes to an explicit admins list.
--
-- Run this AFTER schema.sql. IMPORTANT: add yourself first, or you will lose
-- access to the editor. Replace the email below with your Supabase login email.
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'you@example.com';
--
-- Also recommended in Supabase Dashboard -> Authentication -> Providers:
-- disable "Allow new users to sign up" unless you actually want public accounts.

CREATE TABLE IF NOT EXISTS public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Security-definer helper so RLS on `admins` can't recurse.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Authenticated users can manage articles" ON public.news_articles;
CREATE POLICY "Admins can manage articles"
  ON public.news_articles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can manage games" ON public.games;
CREATE POLICY "Admins can manage games"
  ON public.games FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Admins can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'uploads' AND public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can update uploads" ON storage.objects;
CREATE POLICY "Admins can update uploads"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'uploads' AND public.is_admin())
  WITH CHECK (bucket_id = 'uploads' AND public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can delete uploads" ON storage.objects;
CREATE POLICY "Admins can delete uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'uploads' AND public.is_admin());
