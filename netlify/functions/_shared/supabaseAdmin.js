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

/** Standaard CORS-headers — harde whitelist, nooit open fallback */
const ALLOWED_ORIGINS = [
  process.env.URL,                        // Netlify prod URL (automatisch gezet)
  process.env.DEPLOY_PRIME_URL,           // Netlify preview deploys
  'http://localhost:5173',                // lokale dev
].filter(Boolean);

const getAllowedOrigin = (requestOrigin) => {
  if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) return requestOrigin;
  return ALLOWED_ORIGINS[0] || 'http://localhost:5173';
};

export const corsHeaders = {
  'Access-Control-Allow-Origin': getAllowedOrigin(undefined),
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

export const corsHeadersForRequest = (event) => ({
  ...corsHeaders,
  'Access-Control-Allow-Origin': getAllowedOrigin(event?.headers?.origin),
});

/**
 * Blokkeer SSRF: weiger interne/private IP-adressen en metadata-endpoints.
 * Gooit een Error als de URL naar een privé-adres wijst.
 */
export const assertPublicUrl = (urlString) => {
  const parsed = new URL(urlString);
  const hostname = parsed.hostname;

  // Blokkeer private/reserved IP-ranges en metadata services
  const blocked = [
    /^127\./,                        // loopback
    /^10\./,                         // class A private
    /^172\.(1[6-9]|2\d|3[01])\./,   // class B private
    /^192\.168\./,                   // class C private
    /^169\.254\./,                   // link-local / cloud metadata
    /^0\./,                          // "this" network
    /^::1$/,                         // IPv6 loopback
    /^fd[0-9a-f]{2}:/i,             // IPv6 ULA
    /^fe80:/i,                       // IPv6 link-local
    /^localhost$/i,
  ];

  if (blocked.some(re => re.test(hostname))) {
    throw new Error(`Geblokkeerd: URL wijst naar een intern adres (${hostname})`);
  }
};

/**
 * Simpele per-user rate limiter (in-memory, reset bij cold start).
 * Houdt een sliding window van requests bij per userId.
 */
const rateLimitStore = new Map();

export const rateLimit = (userId, { maxRequests = 10, windowMs = 60_000 } = {}) => {
  const now = Date.now();
  const key = userId;
  const timestamps = rateLimitStore.get(key) || [];
  const recent = timestamps.filter(t => now - t < windowMs);
  if (recent.length >= maxRequests) {
    throw new Error('Te veel verzoeken — probeer het later opnieuw');
  }
  recent.push(now);
  rateLimitStore.set(key, recent);
};

export const respond = (data, status = 200) => ({
  statusCode: status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

export const respondError = (message, status = 500) =>
  respond({ error: message }, status);
