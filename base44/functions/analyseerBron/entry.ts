import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const MIN_BETROUWBAARHEID = 60;

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { bron_id } = await req.json();
  if (!bron_id) return Response.json({ error: 'bron_id vereist' }, { status: 400 });

  const bron = await base44.asServiceRole.entities.BronBestand.get(bron_id);
  if (!bron) return Response.json({ error: 'Bron niet gevonden' }, { status: 404 });

  await base44.asServiceRole.entities.BronBestand.update(bron_id, { status: 'verwerken' });

  // Haal huidige database-inhoud op als context
  const gids = await base44.asServiceRole.entities.KennisArtikel.filter({ status: 'approved' }, '-created_date', 10);
  const dbContext = gids.map(a => `- ${a.title_nl || a.title_en}: ${a.summary_nl}`).join('\n');

  // Haal content op van de bron
  let bronContent = '';
  if (bron.type === 'url' || bron.type === 'youtube') {
    const pageRes = await base44.asServiceRole.functions.invoke('fetchPageSource', { url: bron.url });
    bronContent = pageRes?.data?.html?.substring(0, 15000) || bron.url;
  } else if (bron.file_url) {
    bronContent = `Bestandsnaam: ${bron.naam} (URL: ${bron.file_url})`;
  }

  // AI-analyse: genereer wijzigingsvoorstellen
  const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Je bent een expert in sportwetenschap. Analyseer de onderstaande nieuwe bron en vergelijk deze met de huidige kennisbasis van de app.
Genereer concrete wijzigingsvoorstellen voor de app-inhoud.

HUIDIGE KENNISBASIS:
${dbContext || 'Geen bestaande artikelen gevonden.'}

NIEUWE BRON (${bron.type}):
Naam: ${bron.naam}
URL: ${bron.url || ''}
Inhoud: ${bronContent.substring(0, 8000)}

Genereer maximaal 5 wijzigingsvoorstellen. Elk voorstel bevat:
- entity_naam: welk type content wordt aangepast (bijv. "GidsHoofdstuk", "VoedingsTip")
- veld_naam: welk veld
- huidige_waarde: wat er nu staat (of "Nieuw")
- voorgestelde_waarde_nl: nieuwe tekst in het Nederlands
- voorgestelde_waarde_en: nieuwe tekst in het Engels
- onderbouwing_nl: waarom dit voorstel (NL)
- onderbouwing_en: waarom dit voorstel (EN)
- betrouwbaarheid: 0-100 hoe zeker de AI is

Sla alleen wetenschappelijk onderbouwde, relevante voorstellen op.`,
    response_json_schema: {
      type: 'object',
      properties: {
        voorstellen: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              entity_naam: { type: 'string' },
              veld_naam: { type: 'string' },
              huidige_waarde: { type: 'string' },
              voorgestelde_waarde_nl: { type: 'string' },
              voorgestelde_waarde_en: { type: 'string' },
              onderbouwing_nl: { type: 'string' },
              onderbouwing_en: { type: 'string' },
              betrouwbaarheid: { type: 'number' }
            }
          }
        }
      }
    }
  });

  const voorstellen = (aiResult?.voorstellen || []).filter(v => v.betrouwbaarheid >= MIN_BETROUWBAARHEID);
  let aantalOpgeslagen = 0;

  for (const v of voorstellen) {
    await base44.asServiceRole.entities.WijzigingsVoorstel.create({
      bron_type: bron.type,
      bron_naam: bron.naam,
      bron_url: bron.url || bron.file_url,
      entity_naam: v.entity_naam,
      veld_naam: v.veld_naam,
      huidige_waarde: v.huidige_waarde,
      voorgestelde_waarde: v.voorgestelde_waarde_nl,
      onderbouwing_nl: v.onderbouwing_nl,
      onderbouwing_en: v.onderbouwing_en,
      betrouwbaarheid: v.betrouwbaarheid,
      status: 'pending'
    });
    aantalOpgeslagen++;
  }

  await base44.asServiceRole.entities.BronBestand.update(bron_id, {
    status: 'klaar',
    aantal_voorstellen: aantalOpgeslagen,
    verwerkt_op: new Date().toISOString()
  });

  await base44.asServiceRole.entities.AuditLog.create({
    actie: 'ai_analyse',
    gebruiker: user.email,
    entity_naam: 'BronBestand',
    record_id: bron_id,
    details: `${aantalOpgeslagen} voorstellen gegenereerd van "${bron.naam}"`
  });

  return Response.json({ voorstellen: aantalOpgeslagen });
});