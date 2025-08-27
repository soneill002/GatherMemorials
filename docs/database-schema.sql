-- GatherMemorials Database Schema
-- PostgreSQL schema for Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- =====================================================
-- USER PROFILES (extends Supabase Auth)
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  display_name TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  
  -- Preferences
  email_notifications BOOLEAN DEFAULT true,
  prayer_reminders BOOLEAN DEFAULT true,
  guestbook_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  
  -- Account
  account_type TEXT DEFAULT 'free' CHECK (account_type IN ('free', 'premium', 'admin')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MEMORIALS
-- =====================================================
CREATE TABLE memorials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Basic Info (Step 1)
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  nickname TEXT,
  date_of_birth DATE NOT NULL,
  date_of_death DATE NOT NULL,
  featured_image_url TEXT,
  cover_photo_url TEXT,
  
  -- Content (Steps 2-3)
  headline TEXT NOT NULL,
  obituary TEXT,
  
  -- Settings (Steps 7-8)
  guestbook_enabled BOOLEAN DEFAULT true,
  guestbook_moderation BOOLEAN DEFAULT false,
  gallery_enabled BOOLEAN DEFAULT true,
  
  -- Privacy (Step 8)
  privacy_setting TEXT DEFAULT 'public' CHECK (privacy_setting IN ('public', 'private', 'password')),
  password_hash TEXT,
  custom_url TEXT UNIQUE,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  payment_id TEXT,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  
  -- Metadata
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for search
  CONSTRAINT valid_dates CHECK (date_of_death >= date_of_birth)
);

-- Create indexes for performance
CREATE INDEX idx_memorials_user_id ON memorials(user_id);
CREATE INDEX idx_memorials_status ON memorials(status);
CREATE INDEX idx_memorials_custom_url ON memorials(custom_url);
CREATE INDEX idx_memorials_privacy ON memorials(privacy_setting);

-- =====================================================
-- SERVICE EVENTS (Step 4)
-- =====================================================
CREATE TABLE memorial_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memorial_id UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN ('visitation', 'funeral', 'burial', 'celebration')),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location_name TEXT NOT NULL,
  location_address TEXT NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  additional_info TEXT,
  order_index INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_memorial_id ON memorial_services(memorial_id);
CREATE INDEX idx_services_date ON memorial_services(date);

-- =====================================================
-- DONATION LINKS (Step 5)
-- =====================================================
CREATE TABLE memorial_donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memorial_id UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN ('charity', 'gofundme', 'parish', 'other')),
  organization_name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_donations_memorial_id ON memorial_donations(memorial_id);

-- =====================================================
-- GALLERY ITEMS (Step 6)
-- =====================================================
CREATE TABLE memorial_gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memorial_id UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN ('photo', 'video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  order_index INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gallery_memorial_id ON memorial_gallery(memorial_id);

-- =====================================================
-- GUESTBOOK ENTRIES (Step 7)
-- =====================================================
CREATE TABLE guestbook_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memorial_id UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  message TEXT NOT NULL,
  photo_url TEXT,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderated_by UUID REFERENCES profiles(id),
  moderated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_guestbook_memorial_id ON guestbook_entries(memorial_id);
CREATE INDEX idx_guestbook_status ON guestbook_entries(status);
CREATE INDEX idx_guestbook_user_id ON guestbook_entries(user_id);

-- =====================================================
-- PRAYER LISTS
-- =====================================================
CREATE TABLE prayer_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  memorial_id UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  
  personal_notes TEXT,
  last_prayed TIMESTAMPTZ,
  
  -- Reminder preferences
  remind_on_birthday BOOLEAN DEFAULT true,
  remind_on_death_anniversary BOOLEAN DEFAULT true,
  remind_on_holy_days BOOLEAN DEFAULT true,
  
  added_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique entries per user
  UNIQUE(user_id, memorial_id)
);

CREATE INDEX idx_prayer_lists_user_id ON prayer_lists(user_id);
CREATE INDEX idx_prayer_lists_memorial_id ON prayer_lists(memorial_id);

-- =====================================================
-- PRAYER REMINDER SETTINGS
-- =====================================================
CREATE TABLE prayer_reminder_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  enabled BOOLEAN DEFAULT true,
  frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'anniversary_only')),
  time_of_day TIME DEFAULT '09:00',
  
  -- Holy days
  remind_all_souls_day BOOLEAN DEFAULT true,
  remind_all_saints_day BOOLEAN DEFAULT true,
  remind_easter BOOLEAN DEFAULT true,
  remind_christmas BOOLEAN DEFAULT true,
  remind_good_friday BOOLEAN DEFAULT true,
  
  -- Email preferences
  email_format TEXT DEFAULT 'simple' CHECK (email_format IN ('simple', 'detailed')),
  include_prayer_suggestions BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PAYMENTS
-- =====================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  memorial_id UUID REFERENCES memorials(id),
  
  stripe_payment_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  
  amount INTEGER NOT NULL, -- In cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'pending', 'failed', 'refunded')),
  
  description TEXT,
  receipt_url TEXT,
  
  refunded_at TIMESTAMPTZ,
  refund_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_memorial_id ON payments(memorial_id);
CREATE INDEX idx_payments_status ON payments(status);

-- =====================================================
-- MEMORIAL COLLABORATORS
-- =====================================================
CREATE TABLE memorial_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memorial_id UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  
  -- Permissions
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_moderate_guestbook BOOLEAN DEFAULT false,
  can_view_analytics BOOLEAN DEFAULT false,
  
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  
  UNIQUE(memorial_id, user_id)
);

CREATE INDEX idx_collaborators_memorial_id ON memorial_collaborators(memorial_id);
CREATE INDEX idx_collaborators_user_id ON memorial_collaborators(user_id);

-- =====================================================
-- USER ACTIVITY TRACKING
-- =====================================================
CREATE TABLE user_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB,
  
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_activities_action ON user_activities(action);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE memorial_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE memorial_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memorial_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE memorial_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Memorials policies
CREATE POLICY "Users can create memorials" ON memorials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own memorials" ON memorials
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (status = 'published' AND privacy_setting = 'public')
  );

CREATE POLICY "Users can update own memorials" ON memorials
  FOR UPDATE USING (auth.uid() = user_id);

-- Add more RLS policies as needed...

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memorials_updated_at BEFORE UPDATE ON memorials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guestbook_entries_updated_at BEFORE UPDATE ON guestbook_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();