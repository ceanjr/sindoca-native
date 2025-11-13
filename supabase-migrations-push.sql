-- Migration: Add push_subscriptions_native table for mobile push notifications
-- Description: Creates table to store Expo push tokens for native mobile apps
-- Safe to run multiple times - uses IF NOT EXISTS

-- =====================================================
-- PUSH SUBSCRIPTIONS TABLE FOR NATIVE APPS
-- =====================================================

-- Drop table if exists to recreate cleanly
DROP TABLE IF EXISTS public.push_subscriptions_native CASCADE;

-- Create the table
CREATE TABLE public.push_subscriptions_native (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.push_subscriptions_native ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own push subscription" ON public.push_subscriptions_native;
DROP POLICY IF EXISTS "Users can insert own push subscription" ON public.push_subscriptions_native;
DROP POLICY IF EXISTS "Users can update own push subscription" ON public.push_subscriptions_native;
DROP POLICY IF EXISTS "Users can delete own push subscription" ON public.push_subscriptions_native;

-- Policies for push_subscriptions_native table
-- Users can view their own push subscription
CREATE POLICY "Users can view own push subscription"
  ON public.push_subscriptions_native
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own push subscription
CREATE POLICY "Users can insert own push subscription"
  ON public.push_subscriptions_native
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own push subscription
CREATE POLICY "Users can update own push subscription"
  ON public.push_subscriptions_native
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own push subscription
CREATE POLICY "Users can delete own push subscription"
  ON public.push_subscriptions_native
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS push_subscriptions_native_user_id_idx ON public.push_subscriptions_native(user_id);
CREATE INDEX IF NOT EXISTS push_subscriptions_native_platform_idx ON public.push_subscriptions_native(platform);

-- Trigger to update updated_at on push_subscriptions_native updates
DROP TRIGGER IF EXISTS update_push_subscriptions_native_updated_at ON public.push_subscriptions_native;
CREATE TRIGGER update_push_subscriptions_native_updated_at
  BEFORE UPDATE ON public.push_subscriptions_native
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.push_subscriptions_native IS 'Stores Expo push tokens for native mobile apps (iOS and Android)';
COMMENT ON COLUMN public.push_subscriptions_native.user_id IS 'User ID from auth.users';
COMMENT ON COLUMN public.push_subscriptions_native.expo_push_token IS 'Expo push token (ExponentPushToken[...])';
COMMENT ON COLUMN public.push_subscriptions_native.platform IS 'Mobile platform: ios or android';
