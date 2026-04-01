import { createClient } from '@supabase/supabase-js';

// No Vite, acessamos variáveis de ambiente usando import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Erro: As chaves do Supabase não foram encontradas no arquivo .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);