import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Volledige code-context van de app — zodat AI ook code-wijzigingen kan voorstellen
const APP_CODE_CONTEXT = {
  calculator: {
    bestand: 'pages/Calculator.jsx',
    beschrijving: "TDEE calculator op basis van Mifflin-St Jeor formule.",
    formules: {
      BMR_man: "10 * gewicht_kg + 6.25 * lengte_cm - 5 * leeftijd + 5",
      BMR_vrouw: "10 * gewicht_kg + 6.25 * lengte_cm - 5 * leeftijd - 161",
      TDEE: "BMR * activiteitsfactor",
      cut_doel: "TDEE * 0.80  (= -20% calorietekort)",
      eiwitdoel: "2.0 g/kg lichaamsgewicht (vast, niet aangepast per doelgroep)",
    },
    activiteitsfactoren: {
      sedentair: 1.2, licht_actief: 1.375, matig_actief: 1.55,
      zeer_actief: 1.725, extreem_actief: 1.9
    }
  },
  gids: {
    bestand: 'pages/Gids.jsx',
    beschrijving: "Statische educatieve gids over droogtrainen, 8 hoofdstukken.",
    inhoud: [
      "H1: Droogtrainen = 300-500 kcal/dag tekort, max 1% lichaamsgewicht per week verlies",
      "H2: Calorietekort mild -15%, matig -20%, agressief -25% (langdurig schadelijk)",
      "H3: Eiwit beginner 1.6-2.0g/kg, gevorderd 2.0-2.4g/kg, atleet 2.2-3.1g/kg",
      "H4: Vetten minimaal 0.5-1g/kg voor hormoonproductie, koolhydraten de rest",
      "H5: Training — behoud intensiteit en gewichten, volume mag iets omlaag. LISS cardio veiligst bij cut.",
      "H6: Refeed/dieetpauzes — Byrne 2017: 2wk cut / 2wk onderhoud (2-on-2-off) effectiever dan continue cut",
      "H7: Slaap 7-9 uur per nacht, cortisol is katabool, stress management",
      "H8: Supplementen aanbevolen tijdens cut: creatine monohydraat, whey eiwit, vitamine D3, omega-3"
    ]
  },
  onboarding: {
    bestand: 'pages/Onboarding.jsx',
    beschrijving: "8-stap onboarding wizard die gebruikersprofiel opstelt.",
    stappen: [
      "Stap 1: Geslacht, leeftijd, gewicht, lengte",
      "Stap 2: Activiteitsniveau (5 opties) + levensstijl",
      "Stap 3: Doelgroep (beginner/gevorderd/vrouw/50plus/atleet)",
      "Stap 4: Training methode + frequentie + locatie + ervaring",
      "Stap 5: Gezondheid — slaap, stress, blessures, voedingspatroon",
      "Stap 6: Supplement doelen + huidige supplementen",
      "Stap 7: TDEE berekening (Mifflin-St Jeor) + macro instelling",
      "Stap 8: Voedingsmode kiezen"
    ],
    ai_analyse_bij_afronden: "Genereert persoonlijk supplement-advies via LLM op basis van profiel + kennisbank"
  },
  training: {
    bestand: 'pages/Schemas.jsx + components/schemas/',
    beschrijving: "AI-gegenereerde trainingsschema's op basis van gebruikersprofiel.",
    methode_logica: {
      kracht: "Aanbevolen voor beginners en 50+. Lage reps (3-5), hoog gewicht, lange rust.",
      hypertrofie: "Voor gevorderden. 6-12 reps, matig gewicht, 60-90s rust.",
      hiit: "Voor tijdgebrek of vetverbranding. Intervaltraining, 20-40 min.",
      tabata: "Gevorderden max 2x/week. 20s werk / 10s rust, 8 rondes per oefening."
    },
    ai_prompt_parameters: "Gebruikt: doelgroep, ervaring, frequentie, locatie (gym/thuis), methode"
  },
  voeding: {
    bestand: 'pages/Voeding.jsx',
    beschrijving: "Macro tracking en maaltijdplanning.",
    macro_berekening: {
      calorie_doel: "UserProfile.target_calories (= TDEE * 0.80)",
      eiwit: "UserProfile.protein_target_g (= 2.0g/kg)",
      vet: "25% van calorie_doel / 9",
      koolhydraten: "rest van calorie_doel na eiwit en vet"
    }
  },
  supplementen_kennisbank: {
    bestand: 'pages/Supplementen.jsx + entities/Supplement.json',
    beschrijving: "Kennisbank van supplementen met evidence levels A-D, dosering, timing, doelen.",
    evidence_systeem: "A=RCT/Meta-analyse, B=Cohort, C=Case study, D=Expert opinion"
  },
  hrv_tracker: {
    bestand: 'components/voortgang/HRVTracker.jsx',
    beschrijving: "HRV meting via vragenlijst. Energiescore berekening:",
    energiescore_formule: "score = (hrv_score * 0.4) + (slaap_score * 0.35) + (stress_score * 0.25). Training aanbevolen als score >= 60.",
    hrv_score: "hrv_waarde direct als score (gecapped op 100)",
    slaap_score: "(slaap_uren / 9) * 100",
    stress_score: "((10 - stress_niveau) / 10) * 100"
  },
  nieuws_systeem: {
    bestand: 'pages/Nieuws.jsx + entities/Nieuwsbericht.json + entities/SupplementNieuws.json',
    beschrijving: "Twee typen nieuws: algemeen (Nieuwsbericht) en supplement-specifiek (SupplementNieuws). Beide hebben concept/gepubliceerd status."
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

    // Haal ALLE kennisbronnen op
    const [supplementen, literatuur, bronbestanden, supplementNieuws] = await Promise.all([
      base44.asServiceRole.entities.Supplement.list(),
      base44.asServiceRole.entities.KennisArtikel.filter({ status: 'approved' }),
      base44.asServiceRole.entities.BronBestand.filter({ status: 'klaar' }),
      base44.asServiceRole.entities.SupplementNieuws.filter({ status: 'gepubliceerd' }),
    ]);

    // Kennisbank teksten opbouwen
    const suppTekst = supplementen.map(s =>
      `[${s.status}] ${s.naam} | ${s.categorie} | Evidence ${s.evidence_level || '?'} | Dosering: ${s.dosering || '?'} | Timing: ${s.timing || '?'} | Doelen: ${s.doelen?.join(', ') || '-'} | Voordelen: ${s.voordelen?.slice(0, 3).join('; ') || '-'} | Bijwerkingen: ${s.bijwerkingen || 'geen'}`
    ).join('\n');

    const litTekst = literatuur.map(a =>
      `[Evidence ${a.evidence_level || '?'}] [${a.category}] ${a.title_nl || a.title_en}${a.summary_nl ? '\n  → ' + a.summary_nl.substring(0, 400) : ''}${a.abstract_en ? '\n  Abstract: ' + a.abstract_en.substring(0, 200) : ''}`
    ).join('\n\n');

    const bronTekst = bronbestanden.length > 0
      ? bronbestanden.map(b => `Bron: ${b.naam} (${b.type}) — ${b.aantal_voorstellen || 0} voorstellen gegenereerd`).join('\n')
      : 'Geen verwerkte bronbestanden';

    const nieuwsTekst = supplementNieuws.slice(0, 5).map(n =>
      `Artikel: ${n.titel} | Categorie: ${n.categorie} | Evidence: ${n.evidence_level}`
    ).join('\n');

    // Volledige AI analyse zonder beperkingen
    const analyse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Je bent een senior sportwetenschap AI-adviseur. Jouw taak is een VOLLEDIG en ACTUEEL overzicht te geven van alle verbetermogelijkheden in de Sportfit Plus app, gebaseerd op alle beschikbare kennisbronnen.

BELANGRIJK: Geef ALLE inzichten — ook als ze handmatige code-aanpassingen vereisen. Beschrijf bij code-wijzigingen exact welk bestand, welke variabele of formule aangepast moet worden en met welke nieuwe waarde.

===== HUIDIGE APP CODE & LOGICA =====
${JSON.stringify(APP_CODE_CONTEXT, null, 2)}

===== SUPPLEMENTEN KENNISBANK (${supplementen.length} supplementen) =====
${suppTekst || 'Leeg'}

===== GOEDGEKEURDE WETENSCHAPPELIJKE LITERATUUR (${literatuur.length} artikelen) =====
${litTekst || 'Geen goedgekeurde literatuur beschikbaar'}

===== VERWERKTE BRONBESTANDEN (${bronbestanden.length} bestanden) =====
${bronTekst}

===== GEPUBLICEERDE SUPPLEMENT NIEUWSARTIKELEN =====
${nieuwsTekst || 'Geen'}

===== ANALYSE OPDRACHT =====
Analyseer alle bovenstaande kennis en identificeer ALLE verbetermogelijkheden. Wees volledig en grondig. Geen beperking op aantal inzichten.

Categorieën om te analyseren:
1. **Formules/berekeningen** (Calculator, HRV tracker, macro berekening) — zijn de huidige formules nog wetenschappelijk correct?
2. **Richtlijnen in de Gids** — welke hoofdstukken zijn verouderd of onvolledig op basis van de literatuur?
3. **Supplement kennisbank** — welke supplementen hebben verouderde dosering/timing/evidence? Welke ontbreken?
4. **Trainingsaanbevelingen** — wat zegt de literatuur over methode-selectie, volume, intensiteit tijdens cut?
5. **Onboarding vragen** — missen we belangrijke datapunten die de AI-analyse zouden verbeteren?
6. **Voedingslogica** — kloppen de macro-verhoudingen met actuele richtlijnen?
7. **Nieuwe supplementen** — welke supplementen staan in de literatuur maar nog niet in de kennisbank?
8. **HRV/herstel** — klopt de energiescore-formule met actuele HRV-wetenschap?
9. **Content gaps** — welke onderwerpen zijn onderbelicht in de app?
10. **Code-wijzigingen** — beschrijf exact: bestandsnaam, variabelenaam, huidige waarde → nieuwe waarde

Voor ELKE aanbeveling:
- Geef het exacte bestand en de variabele/constante als het code betreft
- Citeer de specifieke literatuurbron of het supplement waarop het gebaseerd is
- Geef de huidige waarde EN de aanbevolen nieuwe waarde
- Schat de prioriteit (hoog/middel/laag) op basis van wetenschappelijk bewijs

Schrijf in het Nederlands. Wees specifiek en praktisch — geen vage aanbevelingen.`,
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
                prioriteit: { type: 'string' },
                vereist_code_aanpassing: { type: 'boolean' },
                code_bestand: { type: 'string' },
              }
            }
          },
          algemene_samenvatting: { type: 'string' }
        }
      }
    });

    // Sla alle inzichten op (geen max limiet)
    const inzichten = analyse?.inzichten || [];
    for (const inzicht of inzichten) {
      await base44.asServiceRole.entities.AppInzicht.create({
        domein: inzicht.domein || 'algemeen',
        titel: inzicht.titel,
        samenvatting: inzicht.samenvatting,
        huidige_waarde: inzicht.huidige_waarde,
        aanbevolen_wijziging: inzicht.vereist_code_aanpassing
          ? `[CODE AANPASSING VEREIST — ${inzicht.code_bestand || 'zie beschrijving'}]\n\n${inzicht.aanbevolen_wijziging}`
          : inzicht.aanbevolen_wijziging,
        onderbouwing: inzicht.onderbouwing,
        bron_artikelen: inzicht.bron_artikelen || [],
        prioriteit: inzicht.prioriteit || 'middel',
        status: 'nieuw',
        analyse_run_id: run.id,
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