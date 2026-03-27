import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // Haal alle gebruikers op
    const users = await base44.asServiceRole.entities.User.list('-created_date', 100);

    let remindersSent = 0;

    const today = new Date().toISOString().split('T')[0];

    for (const user of users) {
      // Check of deze gebruiker vandaag al een FoodLog heeft ingediend
      const logs = await base44.asServiceRole.entities.FoodLog.filter({
        created_by: user.email,
        log_date: today,
        status: 'submitted'
      });

      // Als nog niet ingediend, stuur herinnering
      if (logs.length === 0) {
        // Check of er überhaupt WeekMenu items voor vandaag zijn
        const weekMenuItems = await base44.asServiceRole.entities.WeekMenu.filter({
          created_by: user.email,
          datum: today
        });

        if (weekMenuItems.length > 0) {
          await base44.asServiceRole.entities.Notification.create({
            type: 'nutrition_update',
            title: 'Voeding nog niet ingediend',
            message: `Zet je voeding van vandaag af! Je hebt ${weekMenuItems.length} maaltijd(en) gepland.`,
            related_entity: 'FoodLog',
            link: '/weekmenu',
            source: 'in_app'
          });

          remindersSent++;
        }
      }
    }

    return Response.json({ remindersSent, status: 'ok' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});