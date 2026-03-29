/**
 * fetchReceptenFromSheet — Lees recepttitels uit een Google Sheet
 * Vervangt: base44/functions/fetchReceptenFromSheet/entry.ts
 * Vereist: GOOGLE_SHEETS_API_KEY of GOOGLE_SERVICE_ACCOUNT_TOKEN in env
 */
import { requireAdmin, corsHeaders, respond, respondError } from './_shared/supabaseAdmin.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };

  try {
    await requireAdmin(event);
    const { spreadsheet_id, range = 'A:A' } = JSON.parse(event.body || '{}');
    if (!spreadsheet_id) return respondError('spreadsheet_id verplicht', 400);

    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    if (!apiKey) return respondError('GOOGLE_SHEETS_API_KEY niet geconfigureerd', 500);

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}/values/${encodeURIComponent(range)}?key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return respondError(`Google Sheets API fout: ${res.status}`, 502);

    const data = await res.json();
    const rows = data.values || [];
    const titles = rows.flat().filter(v => v && v.trim());

    return respond({ titles, count: titles.length });
  } catch (err) {
    console.error('fetchReceptenFromSheet error:', err);
    if (err.message.includes('admin')) return respondError(err.message, 403);
    return respondError(err.message);
  }
};
