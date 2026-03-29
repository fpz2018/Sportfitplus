/**
 * kennisAnalyse — AI analyseert supplementen + literatuur en genereert app-inzichten
 * Vervangt: base44/functions/kennisAnalyse/entry.ts
 */
import Anthropic from '@anthropic-ai/sdk';
import { requireAdmin, supabaseAdmin, corsHeaders, respond, respondError } from './_shared/supabaseAdmin.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };

  try {
    const user = await requireAdmin(event);

    // Maak een analyse-run aan
    const { data: run } = await supabaseAdmin
      .from('kennis_analyse_runs')
      .insert({ status: 'bezig', gestart_op: new Date().toISOString() })
      .select()
      .single();

    try {
      // Haal goedgekeurde artikelen + supplementen op
      const [{ data: artikelen }, { data: supplementen }] = await Promise.all([
        supabaseAdmin.from('kennis_artikelen').select('id, title_en, summary_nl, evidence_level, category').eq('status', 'approved').limit(50),
        supabaseAdmin.from('supplements').select('id, naam, categorie, evidence_level, beschrijving').limit(30),
      ]);

      const artikelTekst = (artikelen || []).map(a =>
        `[${a.id}] ${a.title_en} (niveau ${a.evidence_level}, ${a.category}): ${a.summary_nl || ''}`
      ).join('\n');

      const suppTekst = (supplementen || []).map(s =>
        `[${s.id}] ${s.naam} (${s.categorie}, niveau ${s.evidence_level}): ${s.beschrijving || ''}`
      ).join('\n');

      const prompt = `Analyseer onderstaande wetenschappelijke artikelen en supplementendatabase voor de Sportfit Plus app.
Genereer 5-10 concrete aanbevelingen voor app-verbetering in JSON-formaat.

Artikelen:
${artikelTekst.substring(0, 6000)}

Supplementen:
${suppTekst.substring(0, 2000)}

Geef ALLEEN een JSON-array terug:
[
  {
    "domein": "supplementen|voeding|training|welzijn|inhoud",
    "titel": "Korte titel",
    "samenvatting": "Wat is het inzicht?",
    "aanbevolen_wijziging": "Wat moet er veranderen in de app?",
    "onderbouwing": "Wetenschappelijke onderbouwing",
    "prioriteit": "hoog|middel|laag"
  }
]`;

      const response = await anthropic.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      const rawText = response.content[0].text.trim();
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('AI gaf geen geldig JSON terug');

      const inzichten = JSON.parse(jsonMatch[0]);
      const inzichtRows = inzichten.map(i => ({ ...i, status: 'nieuw', analyse_run_id: run.id }));
      const { data: saved } = await supabaseAdmin.from('app_inzichten').insert(inzichtRows).select();

      // Update run als afgerond
      await supabaseAdmin.from('kennis_analyse_runs').update({
        status: 'klaar',
        afgerond_op: new Date().toISOString(),
        aantal_artikelen: artikelen?.length || 0,
        aantal_supplementen: supplementen?.length || 0,
        aantal_inzichten: saved?.length || 0,
        samenvatting: `${saved?.length || 0} inzichten gegenereerd uit ${artikelen?.length || 0} artikelen.`,
      }).eq('id', run.id);

      await supabaseAdmin.from('audit_logs').insert({
        actie: 'ai_analyse',
        gebruiker: user.email,
        details: { run_id: run.id, inzichten: saved?.length || 0 },
      });

      return respond({ run_id: run.id, inzichten: saved?.length || 0 });
    } catch (innerErr) {
      await supabaseAdmin.from('kennis_analyse_runs').update({
        status: 'fout',
        afgerond_op: new Date().toISOString(),
        fout_melding: innerErr.message,
      }).eq('id', run.id);
      throw innerErr;
    }
  } catch (err) {
    console.error('kennisAnalyse error:', err);
    if (err.message.includes('admin')) return respondError(err.message, 403);
    return respondError(err.message);
  }
};
