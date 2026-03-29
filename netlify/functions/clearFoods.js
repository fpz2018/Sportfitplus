/**
 * clearFoods — Verwijder alle voedingsmiddelen (admin only)
 * Vervangt: base44/functions/clearFoods/entry.ts
 */
import { requireAdmin, supabaseAdmin, corsHeaders, respond, respondError } from './_shared/supabaseAdmin.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };

  try {
    await requireAdmin(event);

    // Verwijder in batches van 100
    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: batch } = await supabaseAdmin
        .from('food')
        .select('id')
        .limit(100);

      if (!batch?.length) { hasMore = false; break; }

      const ids = batch.map(f => f.id);
      await supabaseAdmin.from('food').delete().in('id', ids);
      totalDeleted += ids.length;

      if (ids.length < 100) hasMore = false;
      else await new Promise(r => setTimeout(r, 50));
    }

    return respond({ deleted: totalDeleted });
  } catch (err) {
    console.error('clearFoods error:', err);
    if (err.message.includes('admin')) return respondError(err.message, 403);
    return respondError(err.message);
  }
};
