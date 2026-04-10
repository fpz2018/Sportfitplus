/**
 * fetchReceptenFromSheet — Lees recept-URL's uit een Google Sheet
 * Kolom A = URL van het recept
 * Kolom B = (optioneel) categorie (ontbijt, lunch, diner, snack, etc.)
 * Vereist: GOOGLE_SHEETS_API_KEY in env
 */
import { requireAdmin, corsHeaders, corsHeadersForRequest, respond, respondError } from './_shared/supabaseAdmin.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeadersForRequest(event) };
  }

  try {
    await requireAdmin(event);
    const { spreadsheet_id, range = 'A:B' } = JSON.parse(event.body || '{}');
    if (!spreadsheet_id) return respondError('spreadsheet_id verplicht', 400);

    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    if (!apiKey) return respondError('GOOGLE_SHEETS_API_KEY niet geconfigureerd', 500);

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}/values/${encodeURIComponent(range)}?key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return respondError(`Google Sheets API fout: ${res.status}`, 502);

    const data = await res.json();
    const rows = data.values || [];

    // Skip header row if first cell looks like a header
    const startIdx = (rows[0]?.[0] || '').toLowerCase().includes('url') ? 1 : 0;

    const recipes = rows.slice(startIdx)
      .filter(row => row[0] && row[0].trim().startsWith('http'))
      .map(row => ({
        url: row[0].trim(),
        category: (row[1] || '').trim() || null,
      }));

    return respond({ recipes, count: recipes.length });
  } catch (err) {
    console.error('fetchReceptenFromSheet error:', err);
    if (err.message.includes('admin')) return respondError(err.message, 403);
    return respondError(err.message);
  }
};
