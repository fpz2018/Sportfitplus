import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all foods for this user
    const foods = await base44.entities.Food.list('-created_date', 10000);

    // Delete all
    for (const food of foods) {
      await base44.entities.Food.delete(food.id);
    }

    return Response.json({ success: true, deleted: foods.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});