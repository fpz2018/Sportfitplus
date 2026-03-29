/**
 * sendFoodLogReminder — Stuur notificaties naar gebruikers die nog geen voedingslog hebben ingevuld
 * Vervangt: base44/functions/sendFoodLogReminder/entry.ts
 * Kan worden getriggerd via een Netlify scheduled function of handmatig
 */
import { supabaseAdmin, corsHeaders, respond, respondError } from './_shared/supabaseAdmin.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };

  try {
    const today = new Date().toISOString().split('T')[0];

    // Haal alle users op met weekmenu-items voor vandaag
    const { data: weekMenuUsers } = await supabaseAdmin
      .from('week_menus')
      .select('user_id')
      .eq('datum', today);

    const userIds = [...new Set((weekMenuUsers || []).map(w => w.user_id))];
    if (!userIds.length) return respond({ verstuurd: 0 });

    // Filter: welke users hebben vandaag al een foodlog ingevuld?
    const { data: foodLogs } = await supabaseAdmin
      .from('food_logs')
      .select('user_id')
      .eq('log_date', today)
      .eq('status', 'submitted')
      .in('user_id', userIds);

    const loggedUserIds = new Set((foodLogs || []).map(f => f.user_id));
    const teBerichten = userIds.filter(id => !loggedUserIds.has(id));

    // Maak notificaties aan
    if (teBerichten.length) {
      await supabaseAdmin.from('notifications').insert(
        teBerichten.map(user_id => ({
          user_id,
          type: 'nutrition_update',
          title: 'Vergeet je voedingslog niet!',
          message: 'Je hebt je weekmenu ingesteld maar nog geen voedingslog ingevuld voor vandaag.',
          link: '/voeding',
          source: 'in-app',
        }))
      );
    }

    return respond({ verstuurd: teBerichten.length });
  } catch (err) {
    console.error('sendFoodLogReminder error:', err);
    return respondError(err.message);
  }
};
