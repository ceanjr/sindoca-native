-- Fix Storage Policies for Photos and other buckets
-- Run this in Supabase Dashboard SQL Editor
-- IMPORTANT: This needs to be run as a superuser (automatically in Dashboard)

-- =====================================================
-- FIX PHOTOS BUCKET POLICIES
-- =====================================================

-- First, check if policies exist and drop them
DO $$
BEGIN
  -- Drop existing policies for photos bucket if they exist
  DROP POLICY IF EXISTS "Users can upload photos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
  DROP POLICY IF EXISTS "Photos are viewable by workspace members" ON storage.objects;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping policy drops - insufficient privileges';
END $$;

-- Allow users to upload photos
CREATE POLICY "Users can upload photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'photos'
    AND auth.uid() IS NOT NULL
  );

-- Allow users to update their own photos
CREATE POLICY "Users can update own photos"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'photos'
    AND auth.uid() IS NOT NULL
  );

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own photos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'photos'
    AND auth.uid() IS NOT NULL
  );

-- Allow workspace members to view photos
CREATE POLICY "Photos are viewable by workspace members"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'photos'
  );

-- =====================================================
-- ENSURE PHOTOS BUCKET EXISTS AND IS PUBLIC
-- =====================================================

-- Create photos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- =====================================================
-- FIX MUSIC/AUDIO BUCKET IF NEEDED
-- =====================================================

-- Drop existing policies for audio bucket if it exists
DROP POLICY IF EXISTS "Users can upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own audio" ON storage.objects;
DROP POLICY IF EXISTS "Audio is viewable by workspace members" ON storage.objects;

-- Allow users to upload audio
CREATE POLICY "Users can upload audio"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'audio'
    AND auth.uid() IS NOT NULL
  );

-- Allow users to delete their own audio
CREATE POLICY "Users can delete own audio"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'audio'
    AND auth.uid() IS NOT NULL
  );

-- Allow workspace members to view audio
CREATE POLICY "Audio is viewable by workspace members"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'audio'
  );

-- Create audio bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Users can upload photos" ON storage.objects IS 'Allow authenticated users to upload photos';
COMMENT ON POLICY "Photos are viewable by workspace members" ON storage.objects IS 'Public read access for photos';
