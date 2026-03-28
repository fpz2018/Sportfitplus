import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date, targetCalories, targetProtein, targetCarbs, targetFat } = await req.json();

    // Haal alle recepten op
    const recepten = await base44.entities.Recipe.list('-created_date', 1000);
    
    if (recepten.length === 0) {
      return Response.json({ error: 'Geen recepten beschikbaar' }, { status: 400 });
    }

    // Filter recepten met macro info
    const receptenMetMacros = recepten.filter(r => r.calories_per_serving && r.protein_g && r.carbs_g && r.fat_g);

    // Vraag AI om menu samen te stellen
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Je bent een voedingsdeskundige. Stel een volledig dagmenu samen op basis van de doelen.

Dagelijkse doelen:
- Calorieën: ${targetCalories} kcal
- Eiwit: ${targetProtein}g (${Math.round((targetProtein * 4 / targetCalories) * 100)}% van kcal)
- Koolhydraten: ${targetCarbs}g (${Math.round((targetCarbs * 4 / targetCalories) * 100)}% van kcal)
- Vetten: ${targetFat}g (${Math.round((targetFat * 9 / targetCalories) * 100)}% van kcal)

REGELS:
1. Kies 1 recept per maaltijd (ontbijt, lunch, diner, snack)
2. Samen moeten ze DICHT bij de doelen liggen
3. Verdeel logisch: ontbijt ~20%, lunch ~35%, diner ~35%, snack ~10% van calorieën
4. Items MOETEN uit deze lijst komen, gebruik exacte id's

Beschikbare recepten:
${JSON.stringify(receptenMetMacros.slice(0, 150).map(r => ({
  id: r.id,
  title: r.title,
  category: r.category,
  kcal: r.calories_per_serving,
  protein: r.protein_g,
  carbs: r.carbs_g,
  fat: r.fat_g
})))}`,
      response_json_schema: {
        type: 'object',
        properties: {
          ontbijt: { type: 'string', description: 'Recipe ID' },
          lunch: { type: 'string', description: 'Recipe ID' },
          diner: { type: 'string', description: 'Recipe ID' },
          snack: { type: 'string', description: 'Recipe ID' },
          reden: { type: 'string' }
        }
      }
    });

    // Map AI response naar volledige recepten
    const dagMenu = {
      ontbijt: receptenMetMacros.find(r => r.id === result.ontbijt),
      lunch: receptenMetMacros.find(r => r.id === result.lunch),
      diner: receptenMetMacros.find(r => r.id === result.diner),
      snack: receptenMetMacros.find(r => r.id === result.snack),
    };

    // Valideer dat alle recepten gevonden zijn
    const missing = Object.entries(dagMenu).filter(([k, v]) => !v);
    if (missing.length > 0) {
      return Response.json({ error: `Recepten niet gevonden: ${missing.map(m => m[0]).join(', ')}` }, { status: 400 });
    }

    return Response.json({ dagMenu, reden: result.reden });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});