import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const COMMON_FOODS = [
  { name: 'Banaan', calories: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3, fiber_g: 2.6, category: 'fruit' },
  { name: 'Appel', calories: 52, protein_g: 0.3, carbs_g: 14, fat_g: 0.2, fiber_g: 2.4, category: 'fruit' },
  { name: 'Sinaasappel', calories: 47, protein_g: 0.9, carbs_g: 12, fat_g: 0.1, fiber_g: 2.4, category: 'fruit' },
  { name: 'Kip (borst)', calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, fiber_g: 0, category: 'vlees' },
  { name: 'Rund (mager)', calories: 250, protein_g: 26, carbs_g: 0, fat_g: 15, fiber_g: 0, category: 'vlees' },
  { name: 'Zalm', calories: 208, protein_g: 20, carbs_g: 0, fat_g: 13, fiber_g: 0, category: 'vis' },
  { name: 'Broccoli', calories: 34, protein_g: 2.8, carbs_g: 7, fat_g: 0.4, fiber_g: 2.4, category: 'groenten' },
  { name: 'Tomaat', calories: 18, protein_g: 0.9, carbs_g: 3.9, fat_g: 0.2, fiber_g: 1.2, category: 'groenten' },
  { name: 'Sla (iceberg)', calories: 15, protein_g: 1.2, carbs_g: 2.9, fat_g: 0.2, fiber_g: 0.6, category: 'groenten' },
  { name: 'Rijst (wit, gekookt)', calories: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3, fiber_g: 0.4, category: 'graan' },
  { name: 'Pasta (gekookt)', calories: 131, protein_g: 5, carbs_g: 25, fat_g: 1.1, fiber_g: 1.8, category: 'graan' },
  { name: 'Brood (wit)', calories: 265, protein_g: 9, carbs_g: 49, fat_g: 3.3, fiber_g: 2.7, category: 'graan' },
  { name: 'Brood (volkoren)', calories: 247, protein_g: 12.3, carbs_g: 41, fat_g: 3.3, fiber_g: 7, category: 'graan' },
  { name: 'Melk (vol)', calories: 61, protein_g: 3.2, carbs_g: 4.8, fat_g: 3.3, fiber_g: 0, category: 'zuivel' },
  { name: 'Yoghurt (vol)', calories: 59, protein_g: 3.5, carbs_g: 4.7, fat_g: 0.4, fiber_g: 0, category: 'zuivel' },
  { name: 'Kaas (cheddar)', calories: 403, protein_g: 23, carbs_g: 3.3, fat_g: 33, fiber_g: 0, category: 'zuivel' },
  { name: 'Ei', calories: 155, protein_g: 13, carbs_g: 1.1, fat_g: 11, fiber_g: 0, category: 'zuivel' },
  { name: 'Aardappel (gekookt)', calories: 77, protein_g: 1.7, carbs_g: 17, fat_g: 0.1, fiber_g: 1.5, category: 'groenten' },
  { name: 'Havermout', calories: 389, protein_g: 16.9, carbs_g: 66, fat_g: 6.9, fiber_g: 10.6, category: 'graan' },
  { name: 'Amandelen', calories: 579, protein_g: 21.2, carbs_g: 22, fat_g: 49.9, fiber_g: 12.5, category: 'noten' },
  { name: 'Pindakaas', calories: 588, protein_g: 25.8, carbs_g: 20, fat_g: 51.4, fiber_g: 5.9, category: 'noten' },
  { name: 'Olijfolie', calories: 884, protein_g: 0, carbs_g: 0, fat_g: 100, fiber_g: 0, category: 'olie' },
  { name: 'Vis (witte vis)', calories: 82, protein_g: 17.4, carbs_g: 0, fat_g: 0.7, fiber_g: 0, category: 'vis' },
  { name: 'Blauwebes', calories: 57, protein_g: 0.7, carbs_g: 14, fat_g: 0.3, fiber_g: 2.4, category: 'fruit' },
  { name: 'Boterham (wit brood)', calories: 79, protein_g: 2.7, carbs_g: 15, fat_g: 1, fiber_g: 0.8, category: 'graan' },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Controleer of foods al gesynchroniseerd zijn
    const existingFoods = await base44.entities.Food.filter({ created_by: user.email });
    
    if (existingFoods.length > 0) {
      return Response.json({ 
        message: 'Foods already synced', 
        count: existingFoods.length 
      });
    }

    // Voeg standaard voedingsmiddelen toe
    await base44.entities.Food.bulkCreate(COMMON_FOODS);

    return Response.json({ 
      message: 'Foods synced successfully', 
      count: COMMON_FOODS.length 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});