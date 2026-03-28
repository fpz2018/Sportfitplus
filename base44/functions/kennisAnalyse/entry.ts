import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Context snapshot van de huidige app-inhoud die de AI kan vergelijken
const APP_CONTEXT = {
  calculator: {
    beschrijving: "TDEE calculator op basis van Mifflin-St Jeor formule. Cut doel = TDEE * 0.8 (-20%). Eiwitdoel = 2.0g/kg lichaamsgewicht.",
    formules: "BMR man: 10*kg + 6.25*cm - 5*jaar + 5. BMR vrouw: 10*kg + 6.25*cm - 5*jaar - 161. TDEE = BMR * activiteitsfactor.",
    activiteitsfactoren: "sedentair: 1.2, licht_actief: 1.375, matig_actief: 1.55, zeer_actief: 1.725, extreem_actief: 1.9"
  },
  gids: {
    beschrijving: "Gids over droogtrainen/cutting met 8 hoofdstukken.",
    hoofdstukken: [
      "1. Wat is droogtrainen - tekort van 300-500 kcal/dag ideaal, max 25% van TDEE",
      "2. Calorietekort - mild -15%, matig -20%, agressief -25%",
      "3. Eiwitinname - 1.6-2.0g/kg beginner, 2.0-2.4g/kg gevorderd, 2.2-3.1g/kg atleet",
      "4. Koolhydraten/vetten - min 0.5-1g/kg vet voor hormonen",
      "5. Training - behoud intensiteit, LISS cardio veiligst",
      "6. Refeed/dieetpauzes - Byrne 2017: 2wk cut / 2wk onderhoud effectiever",
      "7. Slaap/stress - 7-9 uur slaap, cortisol katabool",
      "8. Supplementen - creatine, whey, vit D, omega-3 aanbevolen"
    ]
  },
  onboarding: {
    beschrijving: "8-stap onboarding: profiel, activiteit, doelgroep, training, gezondheid, supplementen, TDEE, voeding",
    supplement_stap: "Vraagt naar supplement_doelen (8 opties) en huidige_supplementen (vrij tekst)",
    ai_analyse: "Na onboarding: AI vergelijkt profiel met kennisbank + goedgekeurde literatuur voor gepersonaliseerd supplement advies"
  },
  training: {
    beschrijving: "Trainingsschema's op basis van methode (kracht/hypertrofie/hiit/tabata). AI genereert schema's op basis van profiel.",
    methode_selectie: "kracht: beginners/50+, hypertrofie: gevorderden, hiit: tijdgebrek/vetverbranding, tabata: gevorderden max 2x/week"
  },
  voeding: {
    beschrijving: "Macro targets op basis van TDEE -20%, eiwitdoel 2g/kg, vet 25% van caloriedoel, rest koolhydraten"
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    // Start analyserun
    const run = await base44.asServiceRole.entities.KennisAnalyseRun.create({
      gestart_op: new Date().toISOString(),
      status: 'bezig'
    });

    // Haal alle kennisbronnen op
    const [supplementen, literatuur] = await Promise.all([
      base44.asServiceRole.entities.Supplement.filter({ status: 'gepubliceerd' }),
      base44.asServiceRole.entities.KennisArtikel.filter({ status: 'approved' }),
    ]);

    // Bouw kenniscontext op
    const suppTekst = supplementen.map(s =>
      `${s.naam} | ${s.categorie} | Evidence ${s.evidence_level || '?'} | Dosering: ${s.dosering || '?'} | Timing: ${s.timing || '?'} | Doelen: ${s.doelen?.join(', ') || '-'} | Bijwerkingen: ${s.bijwerkingen || 'geen'}`
    ).join('\n');

    const litTekst = literatuur.map(a =>
      `[Evidence ${a.evidence_level || '?'}] ${a.title_nl || a.title_en}${a.summary_nl ? '\n  → ' + a.summary_nl.substring(0, 300) : ''}`
    ).join('\n\n');

    // AI analyse: vergelijk kennisbank met huidige app-inhoud
    const analyse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Je bent een expert sportwetenschap AI. Analyseer de nieuwste kennisbank en wetenschappelijke literatuur en vergelijk dit met de huidige app-inhoud. Identificeer concrete verbetermogelijkheden.

HUIDIGE APP INHOUD:
${JSON.stringify(APP_CONTEXT, null, 2)}

SUPPLEMENTEN KENNISBANK (${supplementen.length} supplementen):
${suppTekst || 'Geen supplementen'}

GOEDGEKEURDE WETENSCHAPPELIJKE LITERATUUR (${literatuur.length} artikelen):
${litTekst || 'Geen goedgekeurde literatuur'}

Analyseer per domein (gids, calculator, supplementen, onboarding, training, voeding) of er:
1. Nieuwe wetenschappelijke inzichten zijn die de huidige inhoud weerspreken of verbeteren
2. Formules of richtlijnen verouderd zijn op basis van recente studies
3. Supplement-aanbevelingen in de gids aangepast moeten worden op basis van de kennisbank
4. Nieuwe doseringsadviezen of timings in de kennisbank staan die relevant zijn
5. Trainingsaanbevelingen bijgesteld moeten worden

Geef alleen inzichten waarvoor je daadwerkelijk onderbouwing hebt in de aangeleverde bronnen.
Schrijf specifiek en praktisch. Maximaal 8 inzichten totaal.
Schrijf in het Nederlands.`,
      response_json_schema: {
        type: 'object',
        properties: {
          inzichten: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                domein: { type: 'string' },
                titel: { type: 'string' },
                samenvatting: { type: 'string' },
                huidige_waarde: { type: 'string' },
                aanbevolen_wijziging: { type: 'string' },
                onderbouwing: { type: 'string' },
                bron_artikelen: { type: 'array', items: { type: 'string' } },
                prioriteit: { type: 'string' }
              }
            }
          },
          algemene_samenvatting: { type: 'string' }
        }
      }
    });

    // Sla inzichten op
    const inzichten = analyse?.inzichten || [];
    for (const inzicht of inzichten) {
      await base44.asServiceRole.entities.AppInzicht.create({
        ...inzicht,
        status: 'nieuw',
        analyse_run_id: run.id
      });
    }

    // Update run
    await base44.asServiceRole.entities.KennisAnalyseRun.update(run.id, {
      afgerond_op: new Date().toISOString(),
      status: 'afgerond',
      aantal_artikelen: literatuur.length,
      aantal_supplementen: supplementen.length,
      aantal_inzichten: inzichten.length,
      samenvatting: analyse?.algemene_samenvatting || ''
    });

    return Response.json({
      success: true,
      run_id: run.id,
      inzichten_gegenereerd: inzichten.length,
      samenvatting: analyse?.algemene_samenvatting
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});