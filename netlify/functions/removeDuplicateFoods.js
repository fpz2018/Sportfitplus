/**
 * removeDuplicateFoods — Verwijder dubbele voedingsmiddelen op naam
 * Vervangt: base44/functions/removeDuplicateFoods/entry.ts
 */
import { getUserFromRequest, supabaseAdmin, corsHeaders, respond, respondError } from './_shared/supabaseAdmin.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };

  try {
    const user = await getUserFromRequest(event);
    if (!user) return respondError('Niet ingelogd', 401);

    const { data: foods } = await supabaseAdmin
      .from('food')
      .select('id, name')
      .order('created_at');

    const seen = new Map();
    const toDelete = [];

    for (const food of foods || []) {
      const key = food.name.toLowerCase().trim();
      if (seen.has(key)) {
        toDelete.push(food.id);
      } else {
        seen.set(key, food.id);
      }
    }

    if (!toDelete.length) return respond({ deleted: 0 });

    // Verwijder in batches van 10
    let deleted = 0;
    for (let i = 0; i < toDelete.length; i += 10) {
      const batch = toDelete.slice(i, i + 10);
      await supabaseAdmin.from('food').delete().in('id', batch);
      deleted += batch.length;
      // Kleine vertraging om de database niet te overbelasten
      if (i + 10 < toDelete.length) await new Promise(r => setTimeout(r, 50));
    }

    return respond({ deleted });
  } catch (err) {
    console.error('removeDuplicateFoods error:', err);
    return respondError(err.message);
  }
};
