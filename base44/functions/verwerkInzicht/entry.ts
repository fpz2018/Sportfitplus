import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Verwerkt een AppInzicht naar een WijzigingsVoorstel (concept)
// OF past een goedgekeurd WijzigingsVoorstel automatisch toe
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { actie, inzicht_id, voorstel_id } = await req.json();

  // === ACTIE: genereer voorstel vanuit inzicht ===
  if (actie === 'genereer_voorstel') {
    const inzicht = await base44.asServiceRole.entities.AppInzicht.get(inzicht_id);
    if (!inzicht) return Response.json({ error: 'Inzicht niet gevonden' }, { status: 404 });

    // Bepaal wat er aangevuld moet worden op basis van domein
    let supplement = null;
    let supplementNieuws = null;

    if (inzicht.domein === 'supplementen') {
      // Zoek het relevante supplement op naam in de kennisbank
      const naam = extractSupplementNaam(inzicht.titel);
      const supplementen = await base44.asServiceRole.entities.Supplement.list();
      supplement = supplementen.find(s =>
        naam && s.naam?.toLowerCase().includes(naam.toLowerCase())
      ) || null;
    }

    // Gebruik AI om een concreet voorstel te genereren
    const contextInfo = supplement
      ? `Huidig supplement record: ${JSON.stringify({
          naam: supplement.naam,
          beschrijving: supplement.beschrijving,
          voordelen: supplement.voordelen,
          dosering: supplement.dosering,
          timing: supplement.timing,
          bijwerkingen: supplement.bijwerkingen,
          evidence_level: supplement.evidence_level,
        })}`
      : '';

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Je bent een expert in sportvoeding en supplementen. Genereer een concreet wijzigingsvoorstel op basis van het volgende inzicht.

INZICHT:
Domein: ${inzicht.domein}
Titel: ${inzicht.titel}
Samenvatting: ${inzicht.samenvatting}
Huidige waarde: ${inzicht.huidige_waarde || 'onbekend'}
Aanbevolen wijziging: ${inzicht.aanbevolen_wijziging || 'zie samenvatting'}
Onderbouwing: ${inzicht.onderbouwing || ''}
Bronartikelen: ${(inzicht.bron_artikelen || []).join(', ')}

${contextInfo}

Genereer een specifiek, toepasbaar voorstel. Voor supplementen: geef de exacte nieuwe waarden voor velden zoals dosering, timing, voordelen, bijwerkingen, evidence_level.
Voor nieuwsartikelen: geef een volledige artikeltekst in Markdown (400-600 woorden), een titel, intro (2 zinnen) en seo_description.
Schrijf alles in het Nederlands.`,
      response_json_schema: {
        type: 'object',
        properties: {
          voorstel_titel: { type: 'string' },
          voorstel_samenvatting: { type: 'string' },
          // Voor supplementen
          supplement_updates: {
            type: 'object',
            properties: {
              dosering: { type: 'string' },
              timing: { type: 'string' },
              voordelen: { type: 'array', items: { type: 'string' } },
              bijwerkingen: { type: 'string' },
              evidence_level: { type: 'string' },
              beschrijving: { type: 'string' },
            }
          },
          // Voor nieuws
          nieuws_artikel: {
            type: 'object',
            properties: {
              titel: { type: 'string' },
              intro: { type: 'string' },
              inhoud: { type: 'string' },
              seo_description: { type: 'string' },
              categorie: { type: 'string' },
            }
          },
          onderbouwing: { type: 'string' },
        }
      }
    });

    // Maak WijzigingsVoorstel aan
    const voorgestelde_waarde = inzicht.domein === 'supplementen' && res.supplement_updates
      ? JSON.stringify(res.supplement_updates, null, 2)
      : inzicht.domein === 'nieuws' && res.nieuws_artikel
      ? JSON.stringify(res.nieuws_artikel, null, 2)
      : res.voorstel_samenvatting || inzicht.aanbevolen_wijziging || '';

    const voorstel = await base44.asServiceRole.entities.WijzigingsVoorstel.create({
      bron_type: 'pubmed',
      bron_naam: `AppInzicht: ${inzicht.titel}`,
      entity_naam: inzicht.domein === 'supplementen' ? 'Supplement' :
                   inzicht.domein === 'nieuws' ? 'SupplementNieuws' : 'AppInzicht',
      record_id: supplement?.id || null,
      veld_naam: inzicht.domein === 'supplementen' ? 'meerdere_velden' : 'artikel_inhoud',
      huidige_waarde: inzicht.huidige_waarde || '',
      voorgestelde_waarde,
      onderbouwing_nl: res.onderbouwing || inzicht.onderbouwing || '',
      betrouwbaarheid: 80,
      status: 'pending',
    });

    // Update inzicht status naar bekeken
    await base44.asServiceRole.entities.AppInzicht.update(inzicht_id, { status: 'bekeken' });

    return Response.json({ success: true, voorstel_id: voorstel.id, voorstel });
  }

  // === ACTIE: pas voorstel toe ===
  if (actie === 'toepassen') {
    const voorstel = await base44.asServiceRole.entities.WijzigingsVoorstel.get(voorstel_id);
    if (!voorstel) return Response.json({ error: 'Voorstel niet gevonden' }, { status: 404 });

    let toegepast = false;
    let details = '';

    if (voorstel.entity_naam === 'Supplement' && voorstel.record_id) {
      // Parse de JSON updates en pas ze toe op het supplement
      const updates = JSON.parse(voorstel.voorgestelde_waarde);
      await base44.asServiceRole.entities.Supplement.update(voorstel.record_id, updates);
      toegepast = true;
      details = `Supplement record ${voorstel.record_id} bijgewerkt`;
    } else if (voorstel.entity_naam === 'SupplementNieuws') {
      // Maak een nieuw nieuwsartikel aan als concept
      const artikelData = JSON.parse(voorstel.voorgestelde_waarde);
      const nieuw = await base44.asServiceRole.entities.SupplementNieuws.create({
        ...artikelData,
        status: 'concept',
        gepubliceerd_op: new Date().toISOString().split('T')[0],
      });
      toegepast = true;
      details = `Nieuw SupplementNieuws concept aangemaakt (id: ${nieuw.id})`;
    } else {
      // Algemeen: markeer als toegepast zonder automatische wijziging
      toegepast = true;
      details = 'Handmatig toepassen vereist (domein niet automatiseerbaar)';
    }

    // Update voorstel status
    await base44.asServiceRole.entities.WijzigingsVoorstel.update(voorstel_id, {
      status: 'applied',
      reviewed_by: user.email,
      reviewed_at: new Date().toISOString(),
      applied_at: new Date().toISOString(),
      review_notes: details,
    });

    // Log
    await base44.asServiceRole.entities.AuditLog.create({
      actie: 'voorstel_toegepast',
      gebruiker: user.email,
      entity_naam: voorstel.entity_naam,
      record_id: voorstel.record_id || voorstel_id,
      details,
    });

    return Response.json({ success: true, toegepast, details });
  }

  // === ACTIE: afwijzen ===
  if (actie === 'afwijzen') {
    await base44.asServiceRole.entities.WijzigingsVoorstel.update(voorstel_id, {
      status: 'rejected',
      reviewed_by: user.email,
      reviewed_at: new Date().toISOString(),
    });
    return Response.json({ success: true });
  }

  return Response.json({ error: 'Onbekende actie' }, { status: 400 });
});

function extractSupplementNaam(titel) {
  // Haal supplement naam uit de inzicht-titel (bijv. "Creatine: nieuwe dosering")
  const match = titel?.match(/^([A-Za-zÀ-ÿ\s\-]+?)[:–\(]/);
  return match ? match[1].trim() : titel;
}