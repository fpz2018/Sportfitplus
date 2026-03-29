/**
 * Gedeelde Supabase admin-client voor Netlify Functions.
 * Gebruikt de service_role key — NOOIT naar de browser sturen.
 */
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Maak een Supabase client op basis van de JWT uit de Authorization header.
 * Hiermee gelden de RLS policies van de ingelogde gebruiker.
 */
export const supabaseFromRequest = (event) => {
  const token = event.headers['authorization']?.replace('Bearer ', '');
  if (!token) return null;
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
};

/**
 * Haal de ingelogde user op uit de JWT.
 * Geeft null terug als de token ongeldig is.
 */
export const getUserFromRequest = async (event) => {
  const client = supabaseFromRequest(event);
  if (!client) return null;
  const { data: { user } } = await client.auth.getUser();
  return user ?? null;
};

/**
 * Check of de ingelogde user admin is.
 */
export const requireAdmin = async (event) => {
  const user = await getUserFromRequest(event);
  if (!user) throw new Error('Niet ingelogd');
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') throw new Error('Geen toegang — admin vereist');
  return user;
};

/** Standaard CORS-headers */
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.URL || 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

export const respond = (data, status = 200) => ({
  statusCode: status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

export const respondError = (message, status = 500) =>
  respond({ error: message }, status);
