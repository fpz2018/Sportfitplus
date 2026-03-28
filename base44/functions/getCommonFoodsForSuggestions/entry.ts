import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Veelgebruikte voedingsmiddelen voor suggesties
const COMMON_FOODS = [
  { id: '1', name: 'Banaan', calories: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3 },
  { id: '2', name: 'Kip borst (gekookt)', calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
  { id: '3', name: 'Brood (wit)', calories: 265, protein_g: 9, carbs_g: 49, fat_g: 3.3 },
  { id: '4', name: 'Melk (halfvol)', calories: 49, protein_g: 3.3, carbs_g: 4.8, fat_g: 1.7 },
  { id: '5', name: 'Ei (gekookt)', calories: 155, protein_g: 13, carbs_g: 1.1, fat_g: 11 },
  { id: '6', name: 'Rijst (gekookt)', calories: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3 },
  { id: '7', name: 'Pasta (gekookt)', calories: 131, protein_g: 5, carbs_g: 25, fat_g: 1.1 },
  { id: '8', name: 'Appel', calories: 52, protein_g: 0.3, carbs_g: 14, fat_g: 0.2 },
  { id: '9', name: 'Sinaasappel', calories: 47, protein_g: 0.9, carbs_g: 12, fat_g: 0.3 },
  { id: '10', name: 'Broccoli', calories: 34, protein_g: 2.8, carbs_g: 7, fat_g: 0.4 },
  { id: '11', name: 'Tomaat', calories: 18, protein_g: 0.9, carbs_g: 3.9, fat_g: 0.2 },
  { id: '12', name: 'Aardappel (gekookt)', calories: 77, protein_g: 2, carbs_g: 17, fat_g: 0.1 },
  { id: '13', name: 'Zalm (gekookt)', calories: 208, protein_g: 20, carbs_g: 0, fat_g: 13 },
  { id: '14', name: 'Yoghurt (Grieks)', calories: 59, protein_g: 10, carbs_g: 3.3, fat_g: 0.4 },
  { id: '15', name: 'Havermout (droog)', calories: 389, protein_g: 17, carbs_g: 66, fat_g: 6.9 },
  { id: '16', name: 'Pinda butter', calories: 588, protein_g: 25, carbs_g: 20, fat_g: 50 },
  { id: '17', name: 'Noten (gemengd)', calories: 607, protein_g: 21, carbs_g: 27, fat_g: 54 },
  { id: '18', name: 'Linzen (gekookt)', calories: 116, protein_g: 9, carbs_g: 20, fat_g: 0.4 },
  { id: '19', name: 'Kalkoen (gekookt)', calories: 189, protein_g: 29, carbs_g: 0, fat_g: 7.4 },
  { id: '20', name: 'Tuna (uit blik)', calories: 132, protein_g: 29, carbs_g: 0, fat_g: 1.3 },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return Response.json({ foods: COMMON_FOODS });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});