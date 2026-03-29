/**
 * importFoods — Importeer voedingsmiddelen vanuit CSV
 * Vervangt: base44/functions/importFoods/entry.ts
 */
import { getUserFromRequest, supabaseAdmin, corsHeaders, respond, respondError } from './_shared/supabaseAdmin.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };

  try {
    const user = await getUserFromRequest(event);
    if (!user) return respondError('Niet ingelogd', 401);

    const { csv } = JSON.parse(event.body || '{}');
    if (!csv) return respondError('CSV-data verplicht', 400);

    const lines = csv.split('\n').filter(l => l.trim());
    // Detecteer scheidingsteken: komma of pipe
    const delimiter = lines[0].includes('|') ? '|' : ',';
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());

    const foods = [];
    for (const line of lines.slice(1)) {
      const values = line.split(delimiter);
      if (values.length < 5) continue;
      const row = {};
      headers.forEach((h, i) => { row[h] = values[i]?.trim() || ''; });

      foods.push({
        name: row['name'] || row['naam'] || row['product'] || '',
        calories: parseFloat(row['calories'] || row['energie'] || row['kcal'] || 0),
        protein_g: parseFloat(row['protein_g'] || row['eiwit'] || row['protein'] || 0),
        carbs_g: parseFloat(row['carbs_g'] || row['koolhydraten'] || row['carbs'] || 0),
        fat_g: parseFloat(row['fat_g'] || row['vet'] || row['fat'] || 0),
        fiber_g: parseFloat(row['fiber_g'] || row['vezels'] || 0),
        brand: row['brand'] || row['merk'] || '',
        source: 'handmatig',
        created_by: user.id,
      });
    }

    const validFoods = foods.filter(f => f.name && f.calories >= 0);
    if (!validFoods.length) return respondError('Geen geldige voedingsmiddelen gevonden in CSV', 422);

    // Batch inserts van 100
    const batchSize = 100;
    let inserted = 0;
    for (let i = 0; i < validFoods.length; i += batchSize) {
      const batch = validFoods.slice(i, i + batchSize);
      const { data } = await supabaseAdmin.from('food').insert(batch).select('id');
      inserted += data?.length || 0;
    }

    return respond({ inserted, total: validFoods.length });
  } catch (err) {
    console.error('importFoods error:', err);
    return respondError(err.message);
  }
};
