import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { voorstel_id } = body;

    if (!voorstel_id) {
      return Response.json({ error: 'voorstel_id required' }, { status: 400 });
    }

    // Haal voorstel op
    const voorstel = await base44.asServiceRole.entities.WijzigingsVoorstel.filter({ 
      id: voorstel_id 
    });
    
    if (!voorstel || voorstel.length === 0) {
      return Response.json({ error: 'Voorstel niet gevonden' }, { status: 404 });
    }

    const proposal = voorstel[0];
    if (proposal.status !== 'applied') {
      return Response.json({ error: 'Voorstel is niet applied' }, { status: 400 });
    }

    // Bepaal notificatietype op basis van entiteit
    let notificationType = 'general';
    let link = '/';
    
    if (proposal.entity_naam === 'CustomSchema') {
      notificationType = 'training_update';
      link = '/schemas';
    } else if (['Recipe', 'MealPlan'].includes(proposal.entity_naam)) {
      notificationType = 'nutrition_update';
      link = '/voeding';
    } else if (proposal.entity_naam === 'Recipe') {
      notificationType = 'recipe_update';
      link = '/recepten';
    }

    // Haal alle users op (behalve admin)
    const users = await base44.asServiceRole.entities.User.list('-created_date', 1000);
    const regularUsers = users.filter(u => u.role !== 'admin');

    // Maak notificaties voor alle users
    for (const user of regularUsers) {
      const notification = await base44.asServiceRole.entities.Notification.create({
        created_by: user.email,
        type: notificationType,
        title: '✨ Wetenschappelijk onderbouwde update',
        message: `Je ${proposal.entity_naam === 'CustomSchema' ? 'trainingsschema' : 'voedingsplan'} is bijgewerkt op basis van nieuw onderzoek: ${proposal.bron_naam}`,
        related_entity: proposal.entity_naam,
        related_entity_id: proposal.record_id,
        link,
        source: 'in_app'
      });

      // Stuur ook email
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: '✨ Jouw trainings- of voedingsschema is bijgewerkt',
        body: `Hallo ${user.full_name},\n\nJouw ${proposal.entity_naam === 'CustomSchema' ? 'trainingsschema' : 'voedingsplan'} is bijgewerkt op basis van nieuw wetenschappelijk onderzoek.\n\nBron: ${proposal.bron_naam}\n\nUpdate: ${proposal.onderbouwing_nl || proposal.onderbouwing_en}\n\nBekijk de wijzigingen in je app.\n\nGroeten,\nSportfit Plus`
      });
    }

    return Response.json({ 
      success: true, 
      notificaties_verzonden: regularUsers.length,
      type: notificationType
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});