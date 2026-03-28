import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);

    if (lines.length < 2) {
      return Response.json({ error: 'CSV must have header and at least one row' }, { status: 400 });
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.toLowerCase().trim());
    const nameIdx = header.indexOf('name');
    const caloriesIdx = header.indexOf('calories');
    const proteinIdx = header.indexOf('protein_g');
    const carbsIdx = header.indexOf('carbs_g');
    const fatIdx = header.indexOf('fat_g');
    const fiberIdx = header.indexOf('fiber_g');
    const categoryIdx = header.indexOf('category');
    const brandIdx = header.indexOf('brand');

    if (nameIdx === -1 || caloriesIdx === -1 || proteinIdx === -1 || carbsIdx === -1 || fatIdx === -1) {
      return Response.json({ 
        error: 'CSV must contain columns: name, calories, protein_g, carbs_g, fat_g' 
      }, { status: 400 });
    }

    // Parse rows
    const foods = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        
        const name = values[nameIdx];
        const calories = parseFloat(values[caloriesIdx]);
        const protein = parseFloat(values[proteinIdx]);
        const carbs = parseFloat(values[carbsIdx]);
        const fat = parseFloat(values[fatIdx]);

        if (!name || isNaN(calories) || isNaN(protein) || isNaN(carbs) || isNaN(fat)) {
          errors.push(`Row ${i + 1}: Missing or invalid required values`);
          continue;
        }

        foods.push({
          name,
          calories,
          protein_g: protein,
          carbs_g: carbs,
          fat_g: fat,
          fiber_g: fiberIdx !== -1 ? parseFloat(values[fiberIdx]) || 0 : 0,
          category: categoryIdx !== -1 ? values[categoryIdx] || 'overig' : 'overig',
          brand: brandIdx !== -1 ? values[brandIdx] : undefined,
          source: 'handmatig'
        });
      } catch (e) {
        errors.push(`Row ${i + 1}: ${e.message}`);
      }
    }

    if (foods.length === 0) {
      return Response.json({ error: 'No valid foods to import', details: errors }, { status: 400 });
    }

    // Bulk create
    await base44.entities.Food.bulkCreate(foods);

    return Response.json({ 
      success: true,
      imported: foods.length,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});