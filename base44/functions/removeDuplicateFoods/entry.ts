import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all foods
    const foods = await base44.entities.Food.list('-created_date', 5000);
    
    // Find duplicates by name (case-insensitive)
    const nameMap = {};
    const toDelete = [];

    for (const food of foods) {
      const nameLower = food.name.toLowerCase().trim();
      
      if (nameMap[nameLower]) {
        // Duplicate found - mark for deletion
        toDelete.push(food.id);
      } else {
        // First occurrence
        nameMap[nameLower] = food.id;
      }
    }

    // Delete duplicates with proper rate limiting
    for (let i = 0; i < toDelete.length; i++) {
      await base44.entities.Food.delete(toDelete[i]);
      // Add delay between deletes to avoid rate limiting
      if (i < toDelete.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return Response.json({ 
      success: true,
      duplicates_removed: toDelete.length,
      remaining: foods.length - toDelete.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});