-- ============================================
-- Frauenweiler DorfApp - Supabase Schema
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (User profiles + admin flag)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, is_admin)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), FALSE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TEXT,
  location TEXT,
  category TEXT DEFAULT 'Allgemein',
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by everyone" ON events FOR SELECT USING (true);
CREATE POLICY "Only admins can insert events" ON events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Only admins can update/delete events" ON events FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- ============================================
-- NEWS
-- ============================================
CREATE TABLE IF NOT EXISTS news (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'Allgemein',
  important BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "News are viewable by everyone" ON news FOR SELECT USING (true);
CREATE POLICY "Only admins can manage news" ON news FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- ============================================
-- POLLS + OPTIONS + VOTES
-- ============================================
CREATE TABLE IF NOT EXISTS polls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poll_options (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  votes INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)  -- One vote per user per poll
);

-- Function to increment vote count
CREATE OR REPLACE FUNCTION increment_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE poll_options SET votes = votes + 1 WHERE id = NEW.option_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_vote_insert ON poll_votes;
CREATE TRIGGER on_vote_insert
  AFTER INSERT ON poll_votes
  FOR EACH ROW EXECUTE FUNCTION increment_vote_count();

ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Polls viewable by everyone" ON polls FOR SELECT USING (true);
CREATE POLICY "Poll options viewable by everyone" ON poll_options FOR SELECT USING (true);
CREATE POLICY "Anyone can vote once" ON poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can see own votes" ON poll_votes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Only admins can create polls" ON polls FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- ============================================
-- EVENT CONTRIBUTIONS (Mitbringen / Helfen)
-- ============================================
CREATE TABLE IF NOT EXISTS event_contributions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('mitbringen', 'helfen')) NOT NULL,
  description TEXT NOT NULL,
  needed INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contribution_signups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contribution_id UUID REFERENCES event_contributions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contribution_id, user_id)
);

ALTER TABLE event_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribution_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contributions viewable by everyone" ON event_contributions FOR SELECT USING (true);
CREATE POLICY "Signups viewable by everyone" ON contribution_signups FOR SELECT USING (true);

CREATE POLICY "Only admins can manage contributions" ON event_contributions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Users can signup for contributions" ON contribution_signups FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKET for event images (run manually in Supabase Dashboard)
-- ============================================
-- Go to Storage → Create bucket "event-images" (public)
-- Then add policy:
-- CREATE POLICY "Public can view event images" ON storage.objects FOR SELECT USING (bucket_id = 'event-images');
-- CREATE POLICY "Admins can upload event images" ON storage.objects FOR INSERT WITH CHECK (
--   bucket_id = 'event-images' AND 
--   EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
-- );

-- ============================================
-- REALTIME PUBLICATION (for live poll updates)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE poll_options;