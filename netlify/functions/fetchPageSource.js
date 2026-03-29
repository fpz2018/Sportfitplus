/**
 * fetchPageSource — Haalt de HTML-bron van een URL op
 * Vervangt: base44/functions/fetchPageSource/entry.ts
 */
import { getUserFromRequest, corsHeaders, respond, respondError } from './_shared/supabaseAdmin.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };

  try {
    const user = await getUserFromRequest(event);
    if (!user) return respondError('Niet ingelogd', 401);

    const { url } = JSON.parse(event.body || '{}');
    if (!url) return respondError('URL verplicht', 400);

    // Valideer URL
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return respondError('Ongeldige URL', 400);
    }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return respondError('Alleen HTTP/HTTPS URLs toegestaan', 400);
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': 'SportfitPlus/1.0' },
      signal: AbortSignal.timeout(10000),
    });

    const html = await res.text();
    const truncated = html.substring(0, 30000);

    // Extraheer preview-afbeelding
    const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1]
      || html.match(/<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"/i)?.[1]
      || null;

    return respond({ html: truncated, image_url: ogImage, status: res.status });
  } catch (err) {
    console.error('fetchPageSource error:', err);
    return respondError(err.message);
  }
};
