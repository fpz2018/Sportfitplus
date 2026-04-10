/**
 * importRecepten — Importeer recepten via AI-extractie van URL-lijst
 * Haalt de HTML op, extraheert de afbeelding-URL uit og:image / structured data,
 * en laat AI het recept parsen.
 */
import Anthropic from '@anthropic-ai/sdk';
import { requireAdmin, supabaseAdmin, corsHeaders, corsHeadersForRequest, respond, respondError, assertPublicUrl } from './_shared/supabaseAdmin.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Zoekt de beste afbeeldings-URL uit de HTML-bron.
 * Probeert: og:image, twitter:image, JSON-LD image, eerste grote <img>.
 */
function extractImageUrl(html, pageUrl) {
  // 1. Open Graph
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogMatch?.[1]) return resolveUrl(ogMatch[1], pageUrl);

  // 2. Twitter Card
  const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
  if (twMatch?.[1]) return resolveUrl(twMatch[1], pageUrl);

  // 3. JSON-LD (schema.org Recipe)
  const ldMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of ldMatches) {
    try {
      const ld = JSON.parse(m[1]);
      const recipes = Array.isArray(ld) ? ld : (ld['@graph'] || [ld]);
      for (const item of recipes) {
        if (item['@type'] === 'Recipe' && item.image) {
          const img = Array.isArray(item.image) ? item.image[0] : item.image;
          const imgUrl = typeof img === 'string' ? img : img?.url;
          if (imgUrl) return resolveUrl(imgUrl, pageUrl);
        }
      }
    } catch { /* skip invalid JSON-LD */ }
  }

  // 4. Eerste grote afbeelding in de content (heuristiek)
  const imgMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*/gi)];
  for (const img of imgMatches) {
    const src = img[1];
    // Skip tracking pixels, icons, avatars, logos
    if (/\.(svg|gif|ico)(\?|$)/i.test(src)) continue;
    if (/logo|icon|avatar|pixel|badge|button|banner-ad/i.test(src)) continue;
    if (src.length < 10) continue;
    // Prefer images with recipe-related attributes
    const fullTag = img[0];
    if (/width=["']?[1-3]\d["']/i.test(fullTag)) continue; // skip small images
    return resolveUrl(src, pageUrl);
  }

  return null;
}

function resolveUrl(imgUrl, pageUrl) {
  if (!imgUrl) return null;
  if (imgUrl.startsWith('//')) return 'https:' + imgUrl;
  if (imgUrl.startsWith('/')) {
    try {
      const base = new URL(pageUrl);
      return base.origin + imgUrl;
    } catch { return imgUrl; }
  }
  return imgUrl;
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeadersForRequest(event) };
  }

  try {
    const user = await requireAdmin(event);
    const { urls, recipes: recipeEntries } = JSON.parse(event.body || '{}');

    // Support both formats: simple url array or [{url, category}]
    const entries = recipeEntries || (urls || []).map(u => typeof u === 'string' ? { url: u } : u);
    if (!entries?.length) return respondError('Lijst van URLs verplicht', 400);

    const imported = [];
    const errors = [];
    const skipped = [];

    // Check which URLs already exist in the database
    const urlList = entries.map(e => e.url);
    const { data: existing } = await supabaseAdmin
      .from('recipes')
      .select('source_url')
      .in('source_url', urlList);
    const existingUrls = new Set((existing || []).map(r => r.source_url));

    for (const entry of entries.slice(0, 20)) { // Max 20 per keer
      const url = entry.url;

      // Skip already imported URLs
      if (existingUrls.has(url)) {
        skipped.push({ url, reason: 'Al geïmporteerd' });
        continue;
      }

      try {
        assertPublicUrl(url);

        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SportfitPlus/1.0)',
            'Accept': 'text/html,application/xhtml+xml',
          },
          signal: AbortSignal.timeout(10000),
        });
        const html = await res.text();

        // Extract image URL from the raw HTML before stripping tags
        const imageUrl = extractImageUrl(html, url);

        // Clean HTML for AI processing
        const cleanText = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .substring(0, 6000);

        const systemPrompt = `Je bent een recepten-extractor. Analyseer webpagina's en extraheer receptinformatie als gestructureerde JSON. Antwoord ALLEEN met een JSON-object, geen tekst ervoor of erna.`;

        const userPrompt = `Extraheer het recept van onderstaande webpagina en geef het terug als JSON.

URL: ${url}
Pagina-inhoud:
${cleanText}

Geef ALLEEN een JSON-object terug:
{
  "title": "receptnaam",
  "description": "korte beschrijving (max 200 tekens)",
  "category": "ontbijt|lunch|diner|snack|dessert|smoothie",
  "prep_time_min": getal of null,
  "cook_time_min": getal of null,
  "servings": getal of null,
  "calories_per_serving": getal of null,
  "protein_g": getal of null,
  "carbs_g": getal of null,
  "fat_g": getal of null,
  "fiber_g": getal of null,
  "ingredients": ["hoeveelheid + ingredient"],
  "instructions": ["stap 1", "stap 2"],
  "tags": ["tag1", "tag2"],
  "dieet_tags": ["glutenvrij", "lactosevrij", "veganistisch", etc. indien van toepassing]
}`;

        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1500,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        });

        const rawText = response.content[0].text.trim();
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('AI gaf geen geldig JSON terug');

        const recipeData = JSON.parse(jsonMatch[0]);

        // Override category from sheet if provided
        if (entry.category) {
          recipeData.category = entry.category;
        }

        const { data: saved } = await supabaseAdmin
          .from('recipes')
          .insert({
            ...recipeData,
            source_url: url,
            image_url: imageUrl,
            status: 'concept',
            created_by: user.id,
          })
          .select()
          .single();

        if (saved) imported.push({ id: saved.id, title: saved.title, image_url: imageUrl });
      } catch (urlErr) {
        errors.push({ url, error: urlErr.message });
      }
    }

    return respond({
      imported: imported.length,
      skipped: skipped.length,
      errors: errors.length,
      details: { imported, skipped, errors },
    });
  } catch (err) {
    console.error('importRecepten error:', err);
    if (err.message.includes('admin')) return respondError(err.message, 403);
    return respondError(err.message);
  }
};
