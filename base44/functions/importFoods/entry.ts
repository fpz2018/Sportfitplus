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

    // Parse header - support NEVO format and custom format
    const header = lines[0].split(',').map(h => h.toLowerCase().trim());
    
    // Try custom format first
    let nameIdx = header.indexOf('name');
    let caloriesIdx = header.indexOf('calories');
    let proteinIdx = header.indexOf('protein_g');
    let carbsIdx = header.indexOf('carbs_g');
    let fatIdx = header.indexOf('fat_g');
    let fiberIdx = header.indexOf('fiber_g');
    let categoryIdx = header.indexOf('category');
    let brandIdx = header.indexOf('brand');
    let isNEVO = false;
    let energyKjIdx = -1;

    // Try NEVO format if custom format not complete
    if (nameIdx === -1) {
      const nevoNames = ['voedsmiddel', 'voedingsmiddel', 'food', 'omschrijving', 'description'];
      nameIdx = header.findIndex(h => nevoNames.some(n => h.includes(n)));
      isNEVO = true;
    }

    // Energy in kJ (NEVO format)
    if (caloriesIdx === -1) {
      const nevoEnergy = ['energie', 'energy_kj', 'energy (kj)', 'kcal', 'calories'];
      energyKjIdx = header.findIndex(h => nevoEnergy.some(n => h.includes(n)));
      if (energyKjIdx !== -1) isNEVO = true;
      caloriesIdx = energyKjIdx;
    }

    // Protein
    if (proteinIdx === -1) {
      const nevoProtein = ['eiwit', 'protein', 'protein (g)'];
      proteinIdx = header.findIndex(h => nevoProtein.some(n => h.includes(n)));
    }

    // Carbs
    if (carbsIdx === -1) {
      const nevoCarbs = ['koolhydraten', 'carbohydrate', 'carbs', 'koolh (g)', 'carbohydrate (g)'];
      carbsIdx = header.findIndex(h => nevoCarbs.some(n => h.includes(n)));
    }

    // Fat
    if (fatIdx === -1) {
      const nevoFat = ['vet', 'fat', 'lipide', 'fat (g)'];
      fatIdx = header.findIndex(h => nevoFat.some(n => h.includes(n)));
    }

    // Fiber
    if (fiberIdx === -1) {
      const nevoFiber = ['vezel', 'fiber', 'fibre', 'vezel (g)'];
      fiberIdx = header.findIndex(h => nevoFiber.some(n => h.includes(n)));
    }

    if (nameIdx === -1 || caloriesIdx === -1 || proteinIdx === -1 || carbsIdx === -1 || fatIdx === -1) {
      return Response.json({ 
        error: 'CSV must contain: name/omschrijving, calories/energie, protein_g/eiwit, carbs_g/koolhydraten, fat_g/vet' 
      }, { status: 400 });
    }

    // Parse rows
    const foods = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        
        const name = values[nameIdx];
        let calories = parseFloat(values[caloriesIdx]);
        const protein = parseFloat(values[proteinIdx]);
        const carbs = parseFloat(values[carbsIdx]);
        const fat = parseFloat(values[fatIdx]);

        if (!name || isNaN(calories) || isNaN(protein) || isNaN(carbs) || isNaN(fat)) {
          errors.push(`Row ${i + 1}: Missing or invalid required values`);
          continue;
        }

        // Convert kJ to kcal if NEVO format (kJ / 4.184)
        if (isNEVO && calories > 100) {
          calories = Math.round(calories / 4.184);
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
          source: isNEVO ? 'nevo_rivm' : 'handmatig'
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