import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { artikel_id } = await req.json();
  if (!artikel_id) return Response.json({ error: 'artikel_id required' }, { status: 400 });

  const artikelen = await base44.asServiceRole.entities.KennisArtikel.filter({ id: artikel_id });
  const artikel = artikelen[0];
  if (!artikel) return Response.json({ error: 'Artikel niet gevonden' }, { status: 404 });

  const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Je bent een Nederlandse content-marketeer voor een fitness app (Sportfit Plus). Schrijf op basis van dit wetenschappelijke artikel:

Titel: ${artikel.title_nl || artikel.title_en}
Samenvatting: ${artikel.summary_nl || artikel.summary_en}
Categorie: ${artikel.category}
Evidence level: ${artikel.evidence_level}

Genereer het volgende:
1. Een pakkende Nederlandse blogtitel (max 60 tekens, SEO-geoptimaliseerd)
2. Een slug (URL-vriendelijk, kleine letters, koppeltekens)
3. Een korte intro van 2 zinnen voor de preview
4. Een volledig blogpost-artikel in Markdown (400-600 woorden), praktisch en toegankelijk voor sporters
5. Een SEO meta-description (max 155 tekens)
6. Een SEO-geoptimaliseerde paginatitel voor de app homepage (max 60 tekens)
7. Een meta-description voor de app homepage gebaseerd op deze nieuwe kennis (max 155 tekens)`,
    response_json_schema: {
      type: 'object',
      properties: {
        titel: { type: 'string' },
        slug: { type: 'string' },
        intro: { type: 'string' },
        inhoud: { type: 'string' },
        seo_description: { type: 'string' },
        app_seo_titel: { type: 'string' },
        app_seo_description: { type: 'string' }
      }
    }
  });

  const slug = aiResult.slug || aiResult.titel?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `artikel-${artikel_id}`;

  const nieuwsbericht = await base44.asServiceRole.entities.Nieuwsbericht.create({
    titel: aiResult.titel,
    slug,
    intro: aiResult.intro,
    inhoud: aiResult.inhoud,
    categorie: artikel.category || 'overig',
    bron_artikel_id: artikel_id,
    bron_pubmed_url: artikel.url,
    status: 'concept',
    seo_description: aiResult.seo_description
  });

  await base44.asServiceRole.entities.WijzigingsVoorstel.create({
    bron_type: 'pubmed',
    bron_naam: artikel.title_nl || artikel.title_en,
    bron_url: artikel.url,
    entity_naam: 'SEO',
    veld_naam: 'homepage_title',
    huidige_waarde: 'Sportfit Plus - Jouw fitness app',
    voorgestelde_waarde: aiResult.app_seo_titel,
    onderbouwing_nl: `Op basis van nieuw wetenschappelijk onderzoek (${artikel.journal}, evidence level ${artikel.evidence_level}) kan de paginatitel worden geoptimaliseerd.`,
    betrouwbaarheid: artikel.relevance_score || 70,
    status: 'pending'
  });

  await base44.asServiceRole.entities.WijzigingsVoorstel.create({
    bron_type: 'pubmed',
    bron_naam: artikel.title_nl || artikel.title_en,
    bron_url: artikel.url,
    entity_naam: 'SEO',
    veld_naam: 'homepage_meta_description',
    huidige_waarde: '',
    voorgestelde_waarde: aiResult.app_seo_description,
    onderbouwing_nl: `Gegenereerd op basis van nieuwe inzichten uit: "${artikel.title_nl || artikel.title_en}"`,
    betrouwbaarheid: artikel.relevance_score || 70,
    status: 'pending'
  });

  await base44.asServiceRole.entities.AuditLog.create({
    actie: 'ai_samenvatting',
    gebruiker: user.email,
    entity_naam: 'Nieuwsbericht',
    record_id: nieuwsbericht.id,
    details: `Nieuwsbericht "${aiResult.titel}" + 2 SEO-voorstellen gegenereerd op basis van KennisArtikel ${artikel_id}`
  });

  return Response.json({
    nieuwsbericht_id: nieuwsbericht.id,
    titel: aiResult.titel,
    seo_voorstellen: 2
  });
});