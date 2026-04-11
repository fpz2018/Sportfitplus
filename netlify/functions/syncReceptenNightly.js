/**
 * syncReceptenNightly — Geplande nachtelijke sync van recepten uit Google Sheet
 *
 * Draait elke nacht om 03:00 UTC (= 04:00/05:00 NL tijd).
 * Leest URLs uit de geconfigureerde Google Sheet, controleert welke nog niet
 * geïmporteerd zijn, en importeert nieuwe recepten via AI-extractie.
 *
 * Vereiste env vars:
 *   GOOGLE_SHEETS_API_KEY       — Google Sheets API key
 *   RECIPE_SPREADSHEET_ID       — ID van de Google Sheet met recept-URLs
 *   RECIPE_SHEET_RANGE          — (optioneel) bereik, default "A:B"
 *   ANTHROPIC_API_KEY           — voor AI receptextractie
 *   VITE_SUPABASE_URL           — Supabase URL
 *   SUPABASE_SERVICE_ROLE_KEY   — Supabase service role key
 */
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin, assertPublicUrl, requireAdmin } from './_shared/supabaseAdmin.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Netlify Scheduled Function config
export const config = {
  schedule: '0 3 * * *', // Elke nacht om 03:00 UTC
};

function extractImageUrl(html, pageUrl) {
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogMatch?.[1]) return resolveUrl(ogMatch[1], pageUrl);

  const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
  if (twMatch?.[1]) return resolveUrl(twMatch[1], pageUrl);

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
    } catch { /* skip */ }
  }

  return null;
}

function resolveUrl(imgUrl, pageUrl) {
  if (!imgUrl) return null;
  if (imgUrl.startsWith('//')) return 'https:' + imgUrl;
  if (imgUrl.startsWith('/')) {
    try { return new URL(imgUrl, pageUrl).href; }
    catch { return imgUrl; }
  }
  return imgUrl;
}

// JSON response helper — voor zowel manual trigger als scheduled invocation
const jsonResponse = (status, payload) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

export const handler = async (event) => {
  // Manual trigger via /api/syncReceptenNightly: vereis admin auth.
  // Scheduled invocation door Netlify heeft geen Authorization header.
  const authHeader = event?.headers?.authorization || event?.headers?.Authorization;
  const isManual = Boolean(authHeader);
  if (isManual) {
    try {
      await requireAdmin(event);
    } catch (err) {
      return jsonResponse(401, { error: err.message || 'Niet geautoriseerd' });
    }
  }

  // Quick-mode: bij manual trigger beperken we het aantal recepten dat
  // we per call importeren zodat we binnen Netlify's HTTP function timeout
  // (10-26s) blijven. Elk recept is een fetch + AI call van ~5-10s, dus
  // 10 recepten = ruim over de timeout. Cron-pad krijgt het volledige
  // limiet van 10. ?full=1 forceert volledig limiet ook bij manual.
  const queryStr = event?.rawQueryString || event?.rawQuery || '';
  const fullMode = isManual && /[?&]full=1/.test(queryStr);
  const quickMode = isManual && !fullMode;
  const MAX_PER_RUN = quickMode ? 3 : 10;

  const spreadsheetId = process.env.RECIPE_SPREADSHEET_ID;
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const range = process.env.RECIPE_SHEET_RANGE || 'A:B';

  if (!spreadsheetId || !apiKey) {
    const missing = [
      !spreadsheetId && 'RECIPE_SPREADSHEET_ID',
      !apiKey && 'GOOGLE_SHEETS_API_KEY',
    ].filter(Boolean);
    console.log('syncReceptenNightly: env vars ontbreken:', missing.join(', '));
    return jsonResponse(200, {
      ok: false,
      skipped: true,
      reason: 'missing_env',
      missing,
      message: `Configuratie ontbreekt in Netlify. Stel deze env vars in: ${missing.join(', ')}`,
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonResponse(200, {
      ok: false,
      skipped: true,
      reason: 'missing_env',
      missing: ['ANTHROPIC_API_KEY'],
      message: 'ANTHROPIC_API_KEY ontbreekt in Netlify env vars.',
    });
  }

  console.log('syncReceptenNightly: Start nachtelijke recept-sync...');

  try {
    // 1. Lees URLs uit Google Sheet
    const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;
    const sheetRes = await fetch(sheetUrl);
    if (!sheetRes.ok) throw new Error(`Google Sheets API fout: ${sheetRes.status}`);

    const sheetData = await sheetRes.json();
    const rows = sheetData.values || [];
    const startIdx = (rows[0]?.[0] || '').toLowerCase().includes('url') ? 1 : 0;

    const entries = rows.slice(startIdx)
      .filter(row => row[0] && row[0].trim().startsWith('http'))
      .map(row => ({
        url: row[0].trim(),
        category: (row[1] || '').trim() || null,
      }));

    if (entries.length === 0) {
      console.log('syncReceptenNightly: Geen URLs gevonden in sheet.');
      return jsonResponse(200, {
        ok: true,
        sheetRows: rows.length,
        urlsInSheet: 0,
        imported: [],
        errors: [],
        message: 'Geen URLs gevonden in de Google Sheet (kolom A moet URLs bevatten).',
      });
    }

    // 2. Check welke URLs al bestaan
    const urlList = entries.map(e => e.url);
    const { data: existing } = await supabaseAdmin
      .from('recipes')
      .select('source_url')
      .in('source_url', urlList);
    const existingUrls = new Set((existing || []).map(r => r.source_url));

    const newEntries = entries.filter(e => !existingUrls.has(e.url));
    console.log(`syncReceptenNightly: ${entries.length} URLs in sheet, ${newEntries.length} nieuw.`);

    if (newEntries.length === 0) {
      return jsonResponse(200, {
        ok: true,
        sheetRows: rows.length,
        urlsInSheet: entries.length,
        urlsAlreadyImported: existingUrls.size,
        imported: [],
        errors: [],
        message: 'Alle recepten uit de Google Sheet zijn al geïmporteerd.',
      });
    }

    // 3. Importeer nieuwe recepten — quick-mode bij manual trigger,
    //    volledige run (max 10) bij cron of ?full=1
    const imported = [];
    const errors = [];

    for (const entry of newEntries.slice(0, MAX_PER_RUN)) {
      try {
        assertPublicUrl(entry.url);

        const res = await fetch(entry.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SportfitPlus/1.0)',
            'Accept': 'text/html,application/xhtml+xml',
          },
          signal: AbortSignal.timeout(10000),
        });
        const html = await res.text();

        const imageUrl = extractImageUrl(html, entry.url);

        const cleanText = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .substring(0, 6000);

        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1500,
          system: 'Je bent een recepten-extractor. Analyseer webpagina\'s en extraheer receptinformatie als gestructureerde JSON. Antwoord ALLEEN met een JSON-object.',
          messages: [{
            role: 'user',
            content: `Extraheer het recept van deze webpagina als JSON.

URL: ${entry.url}
Inhoud:
${cleanText}

JSON-formaat:
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
  "ingredients": ["hoeveelheid + ingredient"],
  "instructions": ["stap 1", "stap 2"],
  "tags": ["tag1", "tag2"]
}`,
          }],
        });

        const rawText = response.content[0].text.trim();
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('AI gaf geen geldig JSON terug');

        const recipeData = JSON.parse(jsonMatch[0]);
        if (entry.category) recipeData.category = entry.category;

        // Forceer geldige category waarde — schema constraint is strikt.
        const VALID_CATEGORIES = ['ontbijt', 'lunch', 'diner', 'snack', 'dessert', 'smoothie'];
        if (!VALID_CATEGORIES.includes(recipeData.category)) {
          recipeData.category = 'diner';
        }

        const { data: saved, error: insertErr } = await supabaseAdmin
          .from('recipes')
          .insert({
            ...recipeData,
            source_url: entry.url,
            image_url: imageUrl,
            status: 'concept',
          })
          .select('id, title')
          .single();

        if (insertErr) throw new Error(`DB insert: ${insertErr.message}`);

        if (saved) {
          imported.push(saved.title);
          console.log(`  ✓ ${saved.title} (${imageUrl ? 'met afbeelding' : 'zonder afbeelding'})`);
        }
      } catch (urlErr) {
        errors.push({ url: entry.url, error: urlErr.message });
        console.error(`  ✗ ${entry.url}: ${urlErr.message}`);
      }
    }

    const skipped = newEntries.length - imported.length - errors.length;
    const baseSummary = `Sync klaar: ${imported.length} geïmporteerd, ${errors.length} fouten, ${skipped} overgeslagen (limiet ${MAX_PER_RUN}/run).`;
    const summary = quickMode
      ? `${baseSummary} (Snelle test — max ${MAX_PER_RUN} per call. Klik nogmaals voor de volgende batch, of wacht op de nachtelijke cron voor max 10/run.)`
      : baseSummary;
    console.log(`syncReceptenNightly: ${summary}`);

    return jsonResponse(200, {
      ok: true,
      sheetRows: rows.length,
      urlsInSheet: entries.length,
      urlsAlreadyImported: existingUrls.size,
      newUrls: newEntries.length,
      imported,
      errors,
      skippedDueToLimit: skipped,
      quickMode,
      message: summary,
    });
  } catch (err) {
    console.error('syncReceptenNightly error:', err);
    return jsonResponse(500, { ok: false, error: err.message });
  }
};
