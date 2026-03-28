import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all foods and delete in small batches
    let deleted = 0;
    let hasMore = true;
    
    while (hasMore) {
      const foods = await base44.entities.Food.list('-created_date', 100);
      
      if (foods.length === 0) {
        hasMore = false;
        break;
      }

      // Delete in sequence with proper delays
      for (const food of foods) {
        try {
          await base44.entities.Food.delete(food.id);
          deleted++;
        } catch (deleteError) {
          // Item might already be deleted, continue
          console.log(`Could not delete ${food.id}: ${deleteError.message}`);
        }
        // Wait 50ms between each delete
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    return Response.json({ success: true, deleted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});