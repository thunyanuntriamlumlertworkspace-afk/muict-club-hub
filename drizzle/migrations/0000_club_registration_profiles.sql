CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 display_name text NOT NULL DEFAULT '' CHECK (char_length(display_name) <= 100),
 student_id text NOT NULL DEFAULT '' CHECK (char_length(student_id) <= 30),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own profile" ON public.profiles FOR SELECT TO authenticated USING ((SELECT auth.uid()) = id);
CREATE POLICY "Insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = id);
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);
CREATE FUNCTION public.create_student_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 INSERT INTO public.profiles (id, display_name) VALUES (NEW.id, left(coalesce(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', ''), 100));
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.create_student_profile() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER create_student_profile_on_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_student_profile();
CREATE TABLE public.club_registrations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 club_slug text NOT NULL CHECK (club_slug IN ('ai','dev','iot','cyber','badminton','table-tennis','japanese-society','board-game','media-and-entertainment','speakers')),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (user_id, club_slug)
);
GRANT SELECT, INSERT ON public.club_registrations TO authenticated;
GRANT ALL ON public.club_registrations TO service_role;
ALTER TABLE public.club_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own registrations" ON public.club_registrations FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Register self" ON public.club_registrations FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND length(trim(display_name)) > 0 AND student_id ~ '^[A-Za-z0-9-]{1,30}$'));
CREATE INDEX registrations_user_idx ON public.club_registrations(user_id);