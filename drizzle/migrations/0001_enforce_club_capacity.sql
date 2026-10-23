ALTER TABLE public.club_registrations ADD COLUMN seat_number integer;
WITH numbered AS (SELECT id, row_number() OVER (PARTITION BY club_slug ORDER BY created_at, id)::integer AS seat FROM public.club_registrations)
UPDATE public.club_registrations AS r SET seat_number = numbered.seat FROM numbered WHERE r.id = numbered.id;
ALTER TABLE public.club_registrations ADD CONSTRAINT registration_seat_range CHECK (seat_number IS NOT NULL AND seat_number BETWEEN 1 AND 35);
ALTER TABLE public.club_registrations ADD CONSTRAINT registration_unique_seat UNIQUE (club_slug, seat_number);
CREATE FUNCTION public.enforce_club_capacity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE next_seat integer;
BEGIN
 IF TG_OP = 'UPDATE' THEN
  IF NEW.club_slug IS DISTINCT FROM OLD.club_slug OR NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.seat_number IS DISTINCT FROM OLD.seat_number THEN
   RAISE EXCEPTION 'Registration identity and seat cannot be changed' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.club_slug, 0));
 IF EXISTS (SELECT 1 FROM public.club_registrations WHERE club_slug = NEW.club_slug AND user_id = NEW.user_id) THEN
  RAISE EXCEPTION 'Already registered for this club' USING ERRCODE = '23505';
 END IF;
 SELECT seat INTO next_seat FROM generate_series(1, 35) AS seat WHERE NOT EXISTS (SELECT 1 FROM public.club_registrations AS r WHERE r.club_slug = NEW.club_slug AND r.seat_number = seat) ORDER BY seat LIMIT 1;
 IF next_seat IS NULL THEN
  RAISE EXCEPTION 'Club is full (35 students)' USING ERRCODE = 'P0001';
 END IF;
 NEW.seat_number := next_seat;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_club_capacity() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER enforce_club_capacity BEFORE INSERT OR UPDATE ON public.club_registrations FOR EACH ROW EXECUTE FUNCTION public.enforce_club_capacity();
CREATE FUNCTION public.get_club_availability() RETURNS TABLE (club_slug text, registered_count integer, capacity integer) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT r.club_slug, count(*)::integer, 35 FROM public.club_registrations AS r GROUP BY r.club_slug;
$$;
REVOKE ALL ON FUNCTION public.get_club_availability() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_club_availability() TO authenticated, service_role;