/**
 * verwerkInzicht — Verwerkt een app-inzicht: genereer voorstel, toepassen of afwijzen
 * Vervangt: base44/functions/verwerkInzicht/entry.ts
 */
import Anthropic from '@anthropic-ai/sdk';
import { requireAdmin, supabaseAdmin, corsHeaders, respond, respondError } from './_shared/supabaseAdmin.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };

  try {
    const user = await requireAdmin(event);
    const { inzicht_id, actie } = JSON.parse(event.body || '{}');
    if (!inzicht_id || !actie) return respondError('inzicht_id en actie verplicht', 400);

    const { data: inzicht } = await supabaseAdmin
      .from('app_inzichten')
      .select('*')
      .eq('id', inzicht_id)
      .single();
    if (!inzicht) return respondError('Inzicht niet gevonden', 404);

    if (actie === 'afwijzen') {
      await supabaseAdmin.from('app_inzichten').update({ status: 'afgewezen' }).eq('id', inzicht_id);
      return respond({ status: 'afgewezen' });
    }

    if (actie === 'genereer_voorstel') {
      const prompt = `Op basis van dit app-inzicht, genereer een concreet wijzigingsvoorstel voor de Sportfit Plus app.

Inzicht: ${inzicht.titel}
Samenvatting: ${inzicht.samenvatting}
Aanbeveling: ${inzicht.aanbevolen_wijziging}
Onderbouwing: ${inzicht.onderbouwing}

Geef ALLEEN een JSON-object terug:
{
  "veld_naam": "naam van het veld of component",
  "voorgestelde_waarde": "concrete nieuwe waarde of beschrijving",
  "onderbouwing_nl": "wetenschappelijke onderbouwing in het Nederlands",
  "betrouwbaarheid": 0-100,
  "entity_naam": "supplements|food|recipes|app_settings"
}`;

      const response = await anthropic.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      });

      const rawText = response.content[0].text.trim();
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI gaf geen geldig JSON terug');

      const voorstelData = JSON.parse(jsonMatch[0]);
      const { data: voorstel } = await supabaseAdmin
        .from('wijzigings_voorstellen')
        .insert({
          ...voorstelData,
          bron_type: 'app_inzicht',
          bron_naam: inzicht.titel,
          status: 'pending',
        })
        .select()
        .single();

      await supabaseAdmin.from('app_inzichten').update({ status: 'bekeken' }).eq('id', inzicht_id);

      return respond({ voorstel_id: voorstel.id });
    }

    if (actie === 'toepassen') {
      await supabaseAdmin.from('app_inzichten').update({ status: 'toegepast' }).eq('id', inzicht_id);
      await supabaseAdmin.from('audit_logs').insert({
        actie: 'voorstel_toegepast',
        gebruiker: user.email,
        entity_naam: 'app_inzichten',
        record_id: inzicht_id,
        details: { inzicht_titel: inzicht.titel },
      });
      return respond({ status: 'toegepast' });
    }

    return respondError('Onbekende actie', 400);
  } catch (err) {
    console.error('verwerkInzicht error:', err);
    if (err.message.includes('admin')) return respondError(err.message, 403);
    return respondError(err.message);
  }
};
