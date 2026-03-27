import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Admin required' }, { status: 403 });
  }

  const all = await base44.asServiceRole.entities.Recipe.list('-created_date', 1000);
  const toDelete = all.filter(r => r.source_url);
  
  for (const recipe of toDelete) {
    await base44.asServiceRole.entities.Recipe.delete(recipe.id);
  }

  return Response.json({ deleted: toDelete.length });
});