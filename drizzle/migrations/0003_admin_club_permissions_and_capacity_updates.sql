GRANT SELECT, INSERT, UPDATE, DELETE ON public.clubs TO authenticated;
GRANT SELECT ON public.clubs TO anon;
GRANT ALL ON public.clubs TO service_role;
GRANT DELETE ON public.club_registrations TO authenticated;
CREATE OR REPLACE FUNCTION public.guard_club_capacity_update() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(OLD.slug, 0));
 IF NEW.slug IS DISTINCT FROM OLD.slug THEN
  RAISE EXCEPTION 'Club ID cannot be changed' USING ERRCODE = '23514';
 END IF;
 IF NEW.capacity < COALESCE((SELECT max(seat_number) FROM public.club_registrations WHERE club_slug = OLD.slug), 0) THEN
  RAISE EXCEPTION 'Seat limit cannot be lower than an occupied seat. Remove registrations first.' USING ERRCODE = '23514';
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER guard_club_capacity_update BEFORE UPDATE ON public.clubs FOR EACH ROW EXECUTE FUNCTION public.guard_club_capacity_update();