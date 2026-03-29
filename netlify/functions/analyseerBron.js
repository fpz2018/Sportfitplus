/**
 * analyseerBron — Analyseert een URL/YouTube-bron met AI en genereert voorstellen
 * Vervangt: base44/functions/analyseerBron/entry.ts
 */
import Anthropic from '@anthropic-ai/sdk';
import { requireAdmin, supabaseAdmin, corsHeaders, respond, respondError } from './_shared/supabaseAdmin.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };

  try {
    const user = await requireAdmin(event);
    const { bron_id } = JSON.parse(event.body || '{}');
    if (!bron_id) return respondError('bron_id verplicht', 400);

    // Haal bronbestand op
    const { data: bron } = await supabaseAdmin
      .from('bron_bestanden')
      .select('*')
      .eq('id', bron_id)
      .single();
    if (!bron) return respondError('Bronbestand niet gevonden', 404);

    // Update status naar verwerken
    await supabaseAdmin.from('bron_bestanden').update({ status: 'verwerken' }).eq('id', bron_id);

    try {
      // Haal paginabron op
      let bronTekst = '';
      if (bron.type === 'url' || bron.type === 'youtube') {
        const res = await fetch(bron.file_url, {
          headers: { 'User-Agent': 'SportfitPlus/1.0' },
          signal: AbortSignal.timeout(10000),
        });
        bronTekst = (await res.text()).substring(0, 20000);
        // Verwijder HTML-tags
        bronTekst = bronTekst.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      }

      if (!bronTekst) {
        await supabaseAdmin.from('bron_bestanden').update({
          status: 'fout', error_message: 'Kon geen tekst ophalen uit de bron'
        }).eq('id', bron_id);
        return respondError('Kon geen tekst ophalen', 422);
      }

      const prompt = `Analyseer onderstaande tekst en extraheer wetenschappelijke inzichten relevant voor een orthomoleculaire gezondheidsapp (voeding, supplementen, training, welzijn).

Bron: ${bron.naam} (${bron.file_url})

Tekst:
${bronTekst.substring(0, 8000)}

Geef ALLEEN een JSON-object terug:
{
  "voorstellen": [
    {
      "veld_naam": "naam van het veld of concept",
      "voorgestelde_waarde": "concrete aanbeveling",
      "onderbouwing_nl": "wetenschappelijke onderbouwing in het Nederlands",
      "betrouwbaarheid": 0-100,
      "entity_naam": "supplements|food|recipes"
    }
  ],
  "samenvatting": "Korte samenvatting van de bron in het Nederlands"
}`;

      const response = await anthropic.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      const rawText = response.content[0].text.trim();
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI gaf geen geldig JSON terug');

      const result = JSON.parse(jsonMatch[0]);
      const voorstellen = result.voorstellen || [];

      // Sla voorstellen op
      let aantalVoorstellen = 0;
      for (const voorstel of voorstellen) {
        await supabaseAdmin.from('wijzigings_voorstellen').insert({
          ...voorstel,
          bron_type: bron.type,
          bron_naam: bron.naam,
          bron_url: bron.file_url,
          status: 'pending',
        });
        aantalVoorstellen++;
      }

      // Audit log
      await supabaseAdmin.from('audit_logs').insert({
        actie: 'bron_upload',
        gebruiker: user.email,
        details: { bron_id, voorstellen: aantalVoorstellen },
      });

      // Update bronbestand als klaar
      await supabaseAdmin.from('bron_bestanden').update({
        status: 'klaar',
        verwerkt_op: new Date().toISOString(),
        aantal_voorstellen: aantalVoorstellen,
      }).eq('id', bron_id);

      return respond({ voorstellen: aantalVoorstellen, samenvatting: result.samenvatting });
    } catch (innerErr) {
      await supabaseAdmin.from('bron_bestanden').update({
        status: 'fout', error_message: innerErr.message
      }).eq('id', bron_id);
      throw innerErr;
    }
  } catch (err) {
    console.error('analyseerBron error:', err);
    if (err.message.includes('admin')) return respondError(err.message, 403);
    return respondError(err.message);
  }
};
