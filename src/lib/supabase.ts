import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured: boolean =
  supabaseUrl.startsWith("http") && supabaseAnonKey.length > 20;

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : "https://placeholder.supabase.co",
  isSupabaseConfigured ? supabaseAnonKey : "public-anon-placeholder-key-000000000000",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export const AUDIO_BUCKET = "audios";
export const AVATAR_BUCKET = "avatars";
