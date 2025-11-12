import { supabase } from '../supabase/client';

export async function testSupabaseConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Supabase connection test failed:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Supabase connection successful!');
    return { success: true, data };
  } catch (err: any) {
    console.error('Supabase connection test error:', err);
    return { success: false, error: err.message };
  }
}

export async function testSupabaseAuth() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth test failed:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Auth session:', session ? 'Active' : 'No session');
    return { success: true, session };
  } catch (err: any) {
    console.error('Auth test error:', err);
    return { success: false, error: err.message };
  }
}
