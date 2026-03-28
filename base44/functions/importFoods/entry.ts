import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const text = body.csv;

    if (!text) {
      return Response.json({ error: 'No CSV data provided' }, { status: 400 });
    }
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

    // Micronutrients (optional)
    const getMicroIdx = (keywords) => header.findIndex(h => keywords.some(k => h.includes(k)));
    
    const sodiumIdx = getMicroIdx(['natrium', 'sodium', 'na']);
    const potassiumIdx = getMicroIdx(['kalium', 'potassium', 'k']);
    const calciumIdx = getMicroIdx(['calcium', 'ca']);
    const ironIdx = getMicroIdx(['ijzer', 'iron', 'fe']);
    const magnesiumIdx = getMicroIdx(['magnesium', 'mg']);
    const phosphorusIdx = getMicroIdx(['fosfor', 'phosphorus', 'p']);
    const zincIdx = getMicroIdx(['zink', 'zinc', 'zn']);
    const vitaminAIdx = getMicroIdx(['vitamine a', 'vitamin a', 'vit a', 'retinol']);
    const vitaminCIdx = getMicroIdx(['vitamine c', 'vitamin c', 'vit c']);
    const vitaminDIdx = getMicroIdx(['vitamine d', 'vitamin d', 'vit d']);
    const vitaminEIdx = getMicroIdx(['vitamine e', 'vitamin e', 'vit e']);
    const vitaminB1Idx = getMicroIdx(['vitamine b1', 'vitamin b1', 'thiamine']);
    const vitaminB2Idx = getMicroIdx(['vitamine b2', 'vitamin b2', 'riboflavin']);
    const vitaminB3Idx = getMicroIdx(['vitamine b3', 'vitamin b3', 'niacine']);
    const vitaminB6Idx = getMicroIdx(['vitamine b6', 'vitamin b6']);
    const vitaminB12Idx = getMicroIdx(['vitamine b12', 'vitamin b12', 'cyanocobalamine']);
    const folateIdx = getMicroIdx(['folaat', 'folate']);
    const cholesterolIdx = getMicroIdx(['cholesterol']);
    const saturatedFatIdx = getMicroIdx(['verzadigd', 'saturated']);
    const unsaturatedFatIdx = getMicroIdx(['onverzadigd', 'unsaturated']);
    const sugarIdx = getMicroIdx(['suiker', 'sugar']);

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

        const food = {
          name,
          calories,
          protein_g: protein,
          carbs_g: carbs,
          fat_g: fat,
          fiber_g: fiberIdx !== -1 ? parseFloat(values[fiberIdx]) || 0 : 0,
          category: categoryIdx !== -1 ? values[categoryIdx] || 'overig' : 'overig',
          brand: brandIdx !== -1 ? values[brandIdx] : undefined,
          source: isNEVO ? 'nevo_rivm' : 'handmatig'
        };

        // Add micronutrients if available
        if (sodiumIdx !== -1) food.sodium_mg = parseFloat(values[sodiumIdx]) || 0;
        if (potassiumIdx !== -1) food.potassium_mg = parseFloat(values[potassiumIdx]) || 0;
        if (calciumIdx !== -1) food.calcium_mg = parseFloat(values[calciumIdx]) || 0;
        if (ironIdx !== -1) food.iron_mg = parseFloat(values[ironIdx]) || 0;
        if (magnesiumIdx !== -1) food.magnesium_mg = parseFloat(values[magnesiumIdx]) || 0;
        if (phosphorusIdx !== -1) food.phosphorus_mg = parseFloat(values[phosphorusIdx]) || 0;
        if (zincIdx !== -1) food.zinc_mg = parseFloat(values[zincIdx]) || 0;
        if (vitaminAIdx !== -1) food.vitamin_a_ug = parseFloat(values[vitaminAIdx]) || 0;
        if (vitaminCIdx !== -1) food.vitamin_c_mg = parseFloat(values[vitaminCIdx]) || 0;
        if (vitaminDIdx !== -1) food.vitamin_d_ug = parseFloat(values[vitaminDIdx]) || 0;
        if (vitaminEIdx !== -1) food.vitamin_e_mg = parseFloat(values[vitaminEIdx]) || 0;
        if (vitaminB1Idx !== -1) food.vitamin_b1_mg = parseFloat(values[vitaminB1Idx]) || 0;
        if (vitaminB2Idx !== -1) food.vitamin_b2_mg = parseFloat(values[vitaminB2Idx]) || 0;
        if (vitaminB3Idx !== -1) food.vitamin_b3_mg = parseFloat(values[vitaminB3Idx]) || 0;
        if (vitaminB6Idx !== -1) food.vitamin_b6_mg = parseFloat(values[vitaminB6Idx]) || 0;
        if (vitaminB12Idx !== -1) food.vitamin_b12_ug = parseFloat(values[vitaminB12Idx]) || 0;
        if (folateIdx !== -1) food.folate_ug = parseFloat(values[folateIdx]) || 0;
        if (cholesterolIdx !== -1) food.cholesterol_mg = parseFloat(values[cholesterolIdx]) || 0;
        if (saturatedFatIdx !== -1) food.saturated_fat_g = parseFloat(values[saturatedFatIdx]) || 0;
        if (unsaturatedFatIdx !== -1) food.unsaturated_fat_g = parseFloat(values[unsaturatedFatIdx]) || 0;
        if (sugarIdx !== -1) food.sugar_g = parseFloat(values[sugarIdx]) || 0;

        foods.push(food);
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