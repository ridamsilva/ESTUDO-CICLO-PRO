
import { createClient } from '@supabase/supabase-js';

// Configurações de segurança para a base de dados
const SUPABASE_URL = 'https://hrxocgbwboptjvlszlhg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rxuRQ9ZsNWIGMhA7PDfDTQ_yPDTDQ2n';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
