import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Baca konfigurasi dari environment variables atau localStorage jika disimpan via Settings UI
const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const envAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

const savedUrl = typeof window !== 'undefined' ? localStorage.getItem('tourcost_supabase_url') || '' : '';
const savedKey = typeof window !== 'undefined' ? localStorage.getItem('tourcost_supabase_key') || '' : '';

export const SUPABASE_URL = savedUrl || envUrl;
export const SUPABASE_ANON_KEY = savedKey || envAnonKey;

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL.startsWith('https://') &&
  !SUPABASE_URL.includes('your-project')
);

export let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.error('Gagal menginisialisasi Supabase client:', err);
    supabase = null;
  }
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!url || !key) {
      return { success: false, message: 'URL Supabase dan Anon Key wajib diisi.' };
    }
    const testClient = createClient(url, key);
    const { error } = await testClient.from('profiles').select('id').limit(1);

    if (error) {
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Koneksi ke Supabase berhasil! Namun tabel belum dimigrasi. Silakan jalankan script migrasi SQL di Supabase SQL Editor.',
        };
      }
      return { success: false, message: `Error koneksi Supabase: ${error.message}` };
    }

    return { success: true, message: 'Koneksi ke Supabase PostgreSQL & Auth berhasil terverifikasi!' };
  } catch (err: any) {
    return { success: false, message: `Gagal menghubungi Supabase: ${err.message || 'Network error'}` };
  }
}
