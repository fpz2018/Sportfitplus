/**
 * generateFullDayMenu — AI genereert een volledig dagmenu op basis van macro-doelen
 * Vervangt: base44/functions/generateFullDayMenu/entry.ts
 */
import Anthropic from '@anthropic-ai/sdk';
import { getUserFromRequest, supabaseAdmin, corsHeaders, respond, respondError } from './_shared/supabaseAdmin.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };

  try {
    const user = await getUserFromRequest(event);
    if (!user) return respondError('Niet ingelogd', 401);

    const { targetCalories, targetProtein, targetCarbs, targetFat, date } = JSON.parse(event.body || '{}');

    // Haal beschikbare recepten op
    const { data: recipes } = await supabaseAdmin
      .from('recipes')
      .select('id, title, calories_per_serving, protein_g, carbs_g, fat_g, category')
      .eq('status', 'gepubliceerd')
      .limit(100);

    if (!recipes?.length) return respondError('Geen recepten beschikbaar', 404);

    const recipeList = recipes.map(r =>
      `ID:${r.id} | ${r.title} | ${r.category} | ${r.calories_per_serving}kcal | P:${r.protein_g}g K:${r.carbs_g}g V:${r.fat_g}g`
    ).join('\n');

    const prompt = `Selecteer 4 recepten (ontbijt, lunch, diner, snack) uit onderstaande lijst die samen zo dicht mogelijk bij de dagdoelen komen.
Dagdoelen: ${targetCalories}kcal | Eiwit:${targetProtein}g | Koolhydraten:${targetCarbs}g | Vet:${targetFat}g

Recepten:
${recipeList}

Geef ALLEEN een JSON-array terug in dit formaat:
[
  {"recept_id": "uuid", "maaltijd_type": "ontbijt"},
  {"recept_id": "uuid", "maaltijd_type": "lunch"},
  {"recept_id": "uuid", "maaltijd_type": "diner"},
  {"recept_id": "uuid", "maaltijd_type": "snack"}
]`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = response.content[0].text.trim();
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return respondError('AI gaf geen geldig menu terug', 500);

    const selections = JSON.parse(jsonMatch[0]);

    // Bouw de weekmenu-entries op
    const menuEntries = selections.map(sel => {
      const recipe = recipes.find(r => r.id === sel.recept_id);
      if (!recipe) return null;
      return {
        user_id: user.id,
        datum: date,
        maaltijd_type: sel.maaltijd_type,
        recept_id: recipe.id,
        recept_titel: recipe.title,
        calories: recipe.calories_per_serving,
        protein_g: recipe.protein_g,
        carbs_g: recipe.carbs_g,
        fat_g: recipe.fat_g,
      };
    }).filter(Boolean);

    // Sla op in week_menus
    if (menuEntries.length) {
      await supabaseAdmin.from('week_menus').insert(menuEntries);
    }

    return respond({ menu: menuEntries, count: menuEntries.length });
  } catch (err) {
    console.error('generateFullDayMenu error:', err);
    return respondError(err.message);
  }
};
