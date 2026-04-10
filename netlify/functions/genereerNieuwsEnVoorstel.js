/**
 * genereerNieuwsEnVoorstel — Genereert een blogpost + SEO-voorstellen vanuit een KennisArtikel
 * Vervangt: base44/functions/genereerNieuwsEnVoorstel/entry.ts
 */
import Anthropic from '@anthropic-ai/sdk';
import { requireAdmin, supabaseAdmin, corsHeaders, respond, respondError } from './_shared/supabaseAdmin.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };

  try {
    const user = await requireAdmin(event);
    const { artikel_id } = JSON.parse(event.body || '{}');
    if (!artikel_id) return respondError('artikel_id verplicht', 400);

    const { data: artikel } = await supabaseAdmin
      .from('kennis_artikelen')
      .select('*')
      .eq('id', artikel_id)
      .single();
    if (!artikel) return respondError('Artikel niet gevonden', 404);

    const systemPrompt = `Schrijf een informatief blogbericht voor de Sportfit Plus gezondheidsapp op basis van een wetenschappelijk artikel.
Schrijf in het Nederlands, toegankelijk voor een breed publiek (fitness-enthousiastelingen, 18-80 jaar).

Geef ALLEEN een JSON-object terug:
{
  "titel": "Pakkende Nederlandse titel",
  "slug": "url-vriendelijke-slug",
  "intro": "2-3 zinnen intro",
  "inhoud": "Volledig artikel in markdown (400-600 woorden)",
  "categorie": "voeding|supplementen|training|welzijn",
  "seo_description": "SEO meta-description (max 160 tekens)"
}`;

    const userContent = `Artikel: ${(artikel.title_en || '').substring(0, 500)}\nSamenvatting: ${(artikel.summary_nl || artikel.abstract_en || '').substring(0, 1000)}`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    });

    const rawText = response.content[0].text.trim();
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI gaf geen geldig JSON terug');

    const nieuwsData = JSON.parse(jsonMatch[0]);

    // Sla nieuwsbericht op als concept
    const { data: nieuws } = await supabaseAdmin
      .from('nieuwsberichten')
      .insert({
        ...nieuwsData,
        bron_artikel_id: artikel_id,
        bron_pubmed_url: artikel.url,
        status: 'concept',
      })
      .select()
      .single();

    // Maak 2 SEO-wijzigingsvoorstellen
    await supabaseAdmin.from('wijzigings_voorstellen').insert([
      {
        bron_type: 'kennis_artikel',
        bron_naam: artikel.title_en,
        bron_url: artikel.url,
        entity_naam: 'nieuwsberichten',
        record_id: nieuws.id,
        veld_naam: 'seo_description',
        voorgestelde_waarde: nieuwsData.seo_description,
        onderbouwing_nl: 'Automatisch gegenereerde SEO-beschrijving op basis van wetenschappelijk artikel',
        betrouwbaarheid: 75,
        status: 'pending',
      },
      {
        bron_type: 'kennis_artikel',
        bron_naam: artikel.title_en,
        bron_url: artikel.url,
        entity_naam: 'nieuwsberichten',
        record_id: nieuws.id,
        veld_naam: 'titel',
        voorgestelde_waarde: nieuwsData.titel,
        onderbouwing_nl: 'Automatisch gegenereerde titel op basis van wetenschappelijk artikel',
        betrouwbaarheid: 80,
        status: 'pending',
      },
    ]);

    await supabaseAdmin.from('audit_logs').insert({
      actie: 'ai_samenvatting',
      gebruiker: user.email,
      entity_naam: 'nieuwsberichten',
      record_id: nieuws.id,
      details: { artikel_id, nieuws_id: nieuws.id },
    });

    return respond({ nieuws_id: nieuws.id, titel: nieuwsData.titel });
  } catch (err) {
    console.error('genereerNieuwsEnVoorstel error:', err);
    if (err.message.includes('admin')) return respondError(err.message, 403);
    return respondError(err.message);
  }
};
