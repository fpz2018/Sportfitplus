/**
 * getCommonFoodsForSuggestions — Geeft lijst van veelgebruikte voedingsmiddelen voor autocomplete
 * Vervangt: base44/functions/getCommonFoodsForSuggestions/entry.ts
 */
import { getUserFromRequest, corsHeaders, respond, respondError } from './_shared/supabaseAdmin.js';

const SUGGESTIONS = [
  { name: 'Kipfilet', calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
  { name: 'Havermout', calories: 389, protein_g: 17, carbs_g: 66, fat_g: 7 },
  { name: 'Ei', calories: 155, protein_g: 13, carbs_g: 1.1, fat_g: 11 },
  { name: 'Kwark', calories: 63, protein_g: 11, carbs_g: 4, fat_g: 0.2 },
  { name: 'Zalm', calories: 208, protein_g: 20, carbs_g: 0, fat_g: 13 },
  { name: 'Broccoli', calories: 34, protein_g: 2.8, carbs_g: 7, fat_g: 0.4 },
  { name: 'Bruine rijst', calories: 216, protein_g: 5, carbs_g: 45, fat_g: 1.8 },
  { name: 'Volkoren brood', calories: 247, protein_g: 13, carbs_g: 41, fat_g: 3.4 },
  { name: 'Griekse yoghurt', calories: 97, protein_g: 9, carbs_g: 4, fat_g: 5 },
  { name: 'Amandelen', calories: 579, protein_g: 21, carbs_g: 22, fat_g: 50 },
  { name: 'Banaan', calories: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3 },
  { name: 'Zoete aardappel', calories: 86, protein_g: 1.6, carbs_g: 20, fat_g: 0.1 },
  { name: 'Linzen', calories: 116, protein_g: 9, carbs_g: 20, fat_g: 0.4 },
  { name: 'Tonijn', calories: 116, protein_g: 26, carbs_g: 0, fat_g: 1 },
  { name: 'Cottage cheese', calories: 98, protein_g: 11, carbs_g: 3.4, fat_g: 4.3 },
  { name: 'Olijfolie', calories: 884, protein_g: 0, carbs_g: 0, fat_g: 100 },
  { name: 'Whey proteïne', calories: 120, protein_g: 24, carbs_g: 3, fat_g: 1.5 },
  { name: 'Edamame', calories: 121, protein_g: 11, carbs_g: 9, fat_g: 5.2 },
  { name: 'Blauwe bessen', calories: 57, protein_g: 0.7, carbs_g: 14, fat_g: 0.3 },
  { name: 'Magere melk', calories: 34, protein_g: 3.4, carbs_g: 5, fat_g: 0.1 },
];

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };

  try {
    const user = await getUserFromRequest(event);
    if (!user) return respondError('Niet ingelogd', 401);
    return respond({ foods: SUGGESTIONS });
  } catch (err) {
    return respondError(err.message);
  }
};
