-- Fix Storage Policies for Photos and other buckets
-- Run this in Supabase Dashboard SQL Editor
-- IMPORTANT: This needs to be run as a superuser (automatically in Dashboard)

-- =====================================================
-- FIX GALLERY BUCKET POLICIES
-- =====================================================

-- First, check if policies exist and drop them
DO $$
BEGIN
  -- Drop existing policies for gallery bucket if they exist
  DROP POLICY IF EXISTS "Users can upload to gallery" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update gallery" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete from gallery" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can view gallery" ON storage.objects;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping policy drops - insufficient privileges';
END $$;

-- Allow users to upload to gallery
CREATE POLICY "Users can upload to gallery"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'gallery'
    AND auth.uid() IS NOT NULL
  );

-- Allow users to update their own gallery items
CREATE POLICY "Users can update gallery"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'gallery'
    AND auth.uid() IS NOT NULL
  );

-- Allow users to delete their own gallery items
CREATE POLICY "Users can delete from gallery"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'gallery'
    AND auth.uid() IS NOT NULL
  );

-- Allow everyone to view gallery
CREATE POLICY "Anyone can view gallery"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'gallery'
  );

-- =====================================================
-- ENSURE GALLERY BUCKET EXISTS AND IS PUBLIC
-- =====================================================

-- Create gallery bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- =====================================================
-- FIX PROFILES BUCKET POLICIES
-- =====================================================

-- Drop existing policies for profiles bucket if they exist
DROP POLICY IF EXISTS "Users can upload own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Public profile images are viewable by everyone" ON storage.objects;

-- Ensure profiles bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Users can upload to gallery" ON storage.objects IS 'Allow authenticated users to upload to gallery';
COMMENT ON POLICY "Anyone can view gallery" ON storage.objects IS 'Public read access for gallery photos';
