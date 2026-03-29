/**
 * syncFoodDatabase — Zaai de initiële 25 veelgebruikte Nederlandse voedingsmiddelen
 * Vervangt: base44/functions/syncFoodDatabase/entry.ts
 */
import { getUserFromRequest, supabaseAdmin, corsHeaders, respond, respondError } from './_shared/supabaseAdmin.js';

const COMMON_FOODS = [
  { name: 'Kipfilet (gekookt)', calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, category: 'vlees_vis' },
  { name: 'Havermout (droog)', calories: 389, protein_g: 17, carbs_g: 66, fat_g: 7, fiber_g: 11, category: 'granen_brood' },
  { name: 'Ei (heel, rauw)', calories: 155, protein_g: 13, carbs_g: 1.1, fat_g: 11, category: 'zuivel_eieren' },
  { name: 'Kwark (mager)', calories: 63, protein_g: 11, carbs_g: 4, fat_g: 0.2, category: 'zuivel_eieren' },
  { name: 'Zalmfilet (vers)', calories: 208, protein_g: 20, carbs_g: 0, fat_g: 13, category: 'vlees_vis' },
  { name: 'Broccoli (rauw)', calories: 34, protein_g: 2.8, carbs_g: 7, fat_g: 0.4, fiber_g: 2.6, category: 'groenten' },
  { name: 'Spinazie (rauw)', calories: 23, protein_g: 2.9, carbs_g: 3.6, fat_g: 0.4, fiber_g: 2.2, category: 'groenten' },
  { name: 'Bruine rijst (gekookt)', calories: 216, protein_g: 5, carbs_g: 45, fat_g: 1.8, fiber_g: 3.5, category: 'granen_brood' },
  { name: 'Volkoren brood (snee)', calories: 247, protein_g: 13, carbs_g: 41, fat_g: 3.4, fiber_g: 6, category: 'granen_brood' },
  { name: 'Griekse yoghurt (vol)', calories: 97, protein_g: 9, carbs_g: 4, fat_g: 5, category: 'zuivel_eieren' },
  { name: 'Amandelen (rauw)', calories: 579, protein_g: 21, carbs_g: 22, fat_g: 50, fiber_g: 12.5, category: 'noten_zaden' },
  { name: 'Banaan (medium)', calories: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3, fiber_g: 2.6, category: 'fruit' },
  { name: 'Appel (medium)', calories: 52, protein_g: 0.3, carbs_g: 14, fat_g: 0.2, fiber_g: 2.4, category: 'fruit' },
  { name: 'Zoete aardappel (gekookt)', calories: 86, protein_g: 1.6, carbs_g: 20, fat_g: 0.1, fiber_g: 3, category: 'groenten' },
  { name: 'Linzen (gekookt)', calories: 116, protein_g: 9, carbs_g: 20, fat_g: 0.4, fiber_g: 7.9, category: 'peulvruchten' },
  { name: 'Cottage cheese', calories: 98, protein_g: 11, carbs_g: 3.4, fat_g: 4.3, category: 'zuivel_eieren' },
  { name: 'Olijfolie', calories: 884, protein_g: 0, carbs_g: 0, fat_g: 100, category: 'vetten_olien' },
  { name: 'Whey proteïne (scoop 30g)', calories: 120, protein_g: 24, carbs_g: 3, fat_g: 1.5, category: 'overig' },
  { name: 'Witte rijst (gekookt)', calories: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3, category: 'granen_brood' },
  { name: 'Tonijn (blik in water)', calories: 116, protein_g: 26, carbs_g: 0, fat_g: 1, category: 'vlees_vis' },
  { name: 'Mozzarella (125g)', calories: 280, protein_g: 18, carbs_g: 2.2, fat_g: 22, category: 'zuivel_eieren' },
  { name: 'Blauwe bessen', calories: 57, protein_g: 0.7, carbs_g: 14, fat_g: 0.3, fiber_g: 2.4, category: 'fruit' },
  { name: 'Edamame (gekookt)', calories: 121, protein_g: 11, carbs_g: 9, fat_g: 5.2, fiber_g: 5.2, category: 'peulvruchten' },
  { name: 'Pompoenpitten (rauw)', calories: 559, protein_g: 30, carbs_g: 10, fat_g: 49, fiber_g: 6, category: 'noten_zaden' },
  { name: 'Magere melk', calories: 34, protein_g: 3.4, carbs_g: 5, fat_g: 0.1, category: 'zuivel_eieren' },
];

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };

  try {
    const user = await getUserFromRequest(event);
    if (!user) return respondError('Niet ingelogd', 401);

    // Check of er al voedingsmiddelen zijn
    const { count } = await supabaseAdmin
      .from('food')
      .select('id', { count: 'exact', head: true });

    if (count && count > 0) {
      return respond({ skipped: true, message: 'Database bevat al voedingsmiddelen' });
    }

    const foods = COMMON_FOODS.map(f => ({ ...f, source: 'nevo_rivm', created_by: user.id }));
    const { data } = await supabaseAdmin.from('food').insert(foods).select('id');

    return respond({ inserted: data?.length || 0 });
  } catch (err) {
    console.error('syncFoodDatabase error:', err);
    return respondError(err.message);
  }
};
