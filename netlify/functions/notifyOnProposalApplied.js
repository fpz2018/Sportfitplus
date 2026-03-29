/**
 * notifyOnProposalApplied — Notificeer gebruikers wanneer een voorstel is toegepast
 * Vervangt: base44/functions/notifyOnProposalApplied/entry.ts
 */
import { requireAdmin, supabaseAdmin, corsHeaders, respond, respondError } from './_shared/supabaseAdmin.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };

  try {
    await requireAdmin(event);
    const { voorstel_id } = JSON.parse(event.body || '{}');
    if (!voorstel_id) return respondError('voorstel_id verplicht', 400);

    const { data: voorstel } = await supabaseAdmin
      .from('wijzigings_voorstellen')
      .select('veld_naam, voorgestelde_waarde, entity_naam')
      .eq('id', voorstel_id)
      .single();

    if (!voorstel) return respondError('Voorstel niet gevonden', 404);

    // Haal alle niet-admin gebruikers op
    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .neq('role', 'admin');

    if (!profiles?.length) return respond({ verstuurd: 0 });

    // Maak notificaties voor alle gebruikers
    const notifications = profiles.map(p => ({
      user_id: p.id,
      type: 'general',
      title: 'App-update beschikbaar',
      message: `De Sportfit Plus app is bijgewerkt op basis van nieuwe wetenschappelijke inzichten: ${voorstel.veld_naam}.`,
      link: '/nieuws',
      source: 'in-app',
    }));

    await supabaseAdmin.from('notifications').insert(notifications);

    return respond({ verstuurd: notifications.length });
  } catch (err) {
    console.error('notifyOnProposalApplied error:', err);
    if (err.message.includes('admin')) return respondError(err.message, 403);
    return respondError(err.message);
  }
};
