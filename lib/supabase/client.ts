import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// For web builds, check if we're in a browser environment
const isWebBrowser = Platform.OS === 'web' && typeof window !== 'undefined';
const isMobile = Platform.OS !== 'web';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Only use AsyncStorage when in browser (web) or mobile, not during SSR/build
    storage: (isWebBrowser || isMobile) ? AsyncStorage : undefined,
    autoRefreshToken: true,
    persistSession: isWebBrowser || isMobile,
    detectSessionInUrl: false,
  },
});
