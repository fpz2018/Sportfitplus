/**
 * clearImportedRecipes — Verwijder alle geïmporteerde recepten (met source_url)
 * Vervangt: base44/functions/clearImportedRecipes/entry.ts
 */
import { requireAdmin, supabaseAdmin, corsHeaders, respond, respondError } from './_shared/supabaseAdmin.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };

  try {
    await requireAdmin(event);
    const { data } = await supabaseAdmin
      .from('recipes')
      .delete()
      .not('source_url', 'is', null)
      .select('id');

    return respond({ deleted: data?.length || 0 });
  } catch (err) {
    console.error('clearImportedRecipes error:', err);
    if (err.message.includes('admin')) return respondError(err.message, 403);
    return respondError(err.message);
  }
};
