CREATE TYPE public.app_role AS ENUM ('admin', 'student');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own roles" ON public.user_roles FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE TABLE public.clubs (
  slug text PRIMARY KEY,
  name text NOT NULL,
  tag text NOT NULL,
  short text NOT NULL DEFAULT '',
  about text NOT NULL DEFAULT '',
  meets text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  members integer NOT NULL DEFAULT 0,
  founded integer,
  president text NOT NULL DEFAULT '',
  activities jsonb NOT NULL DEFAULT '[]'::jsonb,
  capacity integer NOT NULL DEFAULT 35 CHECK (capacity > 0),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clubs TO anon, authenticated;
GRANT ALL ON public.clubs TO service_role;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can browse clubs" ON public.clubs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can add clubs" ON public.clubs FOR INSERT TO authenticated WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));
CREATE POLICY "Admins can update clubs" ON public.clubs FOR UPDATE TO authenticated USING (public.has_role((SELECT auth.uid()), 'admin')) WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));
CREATE POLICY "Admins can remove clubs" ON public.clubs FOR DELETE TO authenticated USING (public.has_role((SELECT auth.uid()), 'admin'));

INSERT INTO public.clubs (slug, name, tag, short, about, meets, location, members, founded, president, activities, capacity) VALUES
('ai', 'AI', 'Tech', 'Machine learning, LLMs, and intelligent systems.', 'The AI Club brings together students who build with machine learning and large language models. Members share papers, run experiments together, and ship small AI projects each semester.', 'Every Wednesday, 17:00', 'Room 301, Building A', 120, 2019, 'K. Somchai', '["Weekly paper reading group", "Hands-on workshops with LLMs and Python", "Semester hackathon and demo day"]'::jsonb, 35),
('dev', 'Dev', 'Tech', 'Build web, mobile, and open-source projects together.', 'The Dev Club is a hands-on software community. Members work on real web and mobile projects, contribute to open source, and review each other''s code in weekly build sessions.', 'Every Thursday, 18:00', 'Room 205, Building A', 180, 2017, 'K. Napat', '["Team-based web and mobile builds", "Open-source contribution nights", "Code review and pair programming"]'::jsonb, 35),
('iot', 'IoT', 'Tech', 'Sensors, microcontrollers, and connected devices.', 'The IoT Club explores the physical side of computing. Members wire sensors, program microcontrollers, and connect devices to dashboards in a shared hardware lab.', 'Every Friday, 13:00', 'Hardware Lab, Building B', 75, 2020, 'K. Anong', '["Microcontroller and sensor basics", "Connected device builds", "Smart campus mini-projects"]'::jsonb, 35),
('cyber', 'Cyber', 'Tech', 'Security, CTF challenges, and ethical hacking.', 'The Cyber Club teaches practical security skills. Members solve capture-the-flag challenges, learn ethical hacking fundamentals, and compete in national CTF events as a team.', 'Every Saturday, 09:00', 'Room 402, Building A', 90, 2018, 'K. Thiti', '["Weekly CTF practice range", "Ethical hacking fundamentals", "Team entries to national competitions"]'::jsonb, 35),
('badminton', 'Badminton', 'Sports', 'Weekly practice and friendly tournaments.', 'The Badminton Club keeps courts open for casual play, coached practice, and friendly matches. Beginners are welcome and can borrow rackets at the hall.', 'Every Tuesday, 19:00', 'Sports Hall', 150, 2015, 'K. Wicha', '["Coached practice sessions", "Monthly friendly tournaments", "Inter-faculty league"]'::jsonb, 35),
('table-tennis', 'Table Tennis', 'Sports', 'Fast rallies, casual games, and competitions.', 'The Table Tennis Club runs open tables for quick games and organized practice. Members also host an internal ladder and an end-of-year competition.', 'Every Monday, 18:00', 'Sports Hall, Table Area', 60, 2016, 'K. Pim', '["Open table sessions", "Internal ranking ladder", "End-of-year competition"]'::jsonb, 35),
('japanese-society', 'Japanese Society', 'Culture', 'Language, anime, food, and Japanese culture.', 'The Japanese Society celebrates Japanese language and culture through casual meetups, conversation practice, film nights, and food events.', 'Every Wednesday, 18:30', 'Room 108, Building C', 110, 2014, 'K. Mint', '["Japanese conversation practice", "Film and anime nights", "Cultural food events"]'::jsonb, 35),
('board-game', 'Board Game', 'Leisure', 'Strategy, party, and tabletop game nights.', 'The Board Game Club hosts game nights with a library of strategy, party, and card games. New players get a short rules walkthrough before every session.', 'Every Sunday, 17:00', 'Student Lounge', 130, 2016, 'K. Bank', '["Weekly open game nights", "Strategy and party game library", "Game design mini-workshops"]'::jsonb, 35),
('media-and-entertainment', 'Media and Entertainment', 'Creative', 'Photo, video, and event production.', 'The Media and Entertainment Club covers photography, video, and live event production. Members shoot and edit for campus events and build a shared portfolio.', 'Every Thursday, 17:00', 'Media Studio, Building D', 95, 2018, 'K. Beam', '["Photography and video shoots", "Editing and post-production", "Live coverage of campus events"]'::jsonb, 35),
('speakers', 'Speakers', 'Skills', 'Public speaking, debate, and presentation.', 'The Speakers Club helps members speak with confidence. Weekly sessions mix short speeches, structured debate, and friendly feedback in a supportive setting.', 'Every Tuesday, 12:00', 'Room 101, Building A', 70, 2019, 'K. Earn', '["Weekly speech practice", "Structured debates", "Presentation skills clinics"]'::jsonb, 35);

ALTER TABLE public.club_registrations ADD CONSTRAINT club_registrations_club_slug_fkey FOREIGN KEY (club_slug) REFERENCES public.clubs(slug) ON DELETE CASCADE;
ALTER TABLE public.club_registrations DROP CONSTRAINT registration_seat_range;
ALTER TABLE public.club_registrations ADD CONSTRAINT registration_seat_positive CHECK (seat_number IS NOT NULL AND seat_number > 0);

CREATE POLICY "Admins can read all registrations" ON public.club_registrations FOR SELECT TO authenticated USING (public.has_role((SELECT auth.uid()), 'admin'));
CREATE POLICY "Admins can remove registrations" ON public.club_registrations FOR DELETE TO authenticated USING (public.has_role((SELECT auth.uid()), 'admin'));
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role((SELECT auth.uid()), 'admin'));

CREATE OR REPLACE FUNCTION public.enforce_club_capacity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE next_seat integer; club_capacity integer;
BEGIN
 IF TG_OP = 'UPDATE' THEN
  IF NEW.club_slug IS DISTINCT FROM OLD.club_slug OR NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.seat_number IS DISTINCT FROM OLD.seat_number THEN
   RAISE EXCEPTION 'Registration identity and seat cannot be changed' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.club_slug, 0));
 SELECT capacity INTO club_capacity FROM public.clubs WHERE slug = NEW.club_slug;
 IF club_capacity IS NULL THEN
  RAISE EXCEPTION 'Unknown club: %', NEW.club_slug USING ERRCODE = 'P0001';
 END IF;
 IF EXISTS (SELECT 1 FROM public.club_registrations WHERE club_slug = NEW.club_slug AND user_id = NEW.user_id) THEN
  RAISE EXCEPTION 'Already registered for this club' USING ERRCODE = '23505';
 END IF;
 SELECT seat INTO next_seat FROM generate_series(1, club_capacity) AS seat WHERE NOT EXISTS (SELECT 1 FROM public.club_registrations AS r WHERE r.club_slug = NEW.club_slug AND r.seat_number = seat) ORDER BY seat LIMIT 1;
 IF next_seat IS NULL THEN
  RAISE EXCEPTION 'Club is full (% students)', club_capacity USING ERRCODE = 'P0001';
 END IF;
 NEW.seat_number := next_seat;
 RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_club_availability() RETURNS TABLE (club_slug text, registered_count integer, capacity integer) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT c.slug, count(r.id)::integer, c.capacity FROM public.clubs AS c LEFT JOIN public.club_registrations AS r ON r.club_slug = c.slug GROUP BY c.slug, c.capacity;
$$;