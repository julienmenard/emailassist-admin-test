import { supabase } from './supabase';

export async function loginAdmin(email: string, password: string) {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error || !data) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.id);

    // Store admin session
    localStorage.setItem('adminSession', JSON.stringify(data));

    return data;
  } catch (error) {
    throw new Error('Invalid credentials');
  }
}

export async function checkAdminSession() {
  try {
    const sessionData = localStorage.getItem('adminSession');
    
    if (!sessionData) {
      return null;
    }

    const admin = JSON.parse(sessionData);
    
    // Verify the admin still exists and is valid
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', admin.id)
      .eq('email', admin.email)
      .single();

    return data;
  } catch (error) {
    localStorage.removeItem('adminSession');
    return null;
  }
}

export function logoutAdmin() {
  localStorage.removeItem('adminSession');
  window.location.href = '/login';
}