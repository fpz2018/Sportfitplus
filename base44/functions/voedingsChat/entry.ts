import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ORTHO_SYSTEEM_PROMPT = `Je bent een orthomoleculaire voedings- en gezondheidscoach geïntegreerd in de Sportfit Plus app.

KENNISBASIS – Orthomoleculaire richtlijnen:
- Micronutriënten als basis: vitamine D3 (2000-5000 IE/dag), magnesium glycinaat/malaat (300-400mg), zink (15-30mg), omega-3 EPA/DHA (2-4g/dag)
- Vermijd ultra-bewerkte voedingsmiddelen, kunstmatige toevoegingen, transvetten en geraffineerde suikers
- Geef de voorkeur aan volwaardige, nutriëntdichte voedingsmiddelen: orgaanvlees, eieren (volledig), vette vis, noten, zaden, donkere groenten
- Eiwitbehoefte: 1,6–2,4g/kg lichaamsgewicht voor sporters; prioriteit aan complete aminozuurprofielen (dierlijke bronnen of combinaties)
- Insulinegevoeligheid: combineer koolhydraten altijd met eiwitten en vezels; vermijd koolhydraatrijke maaltijden zonder proteïne
- Chronobiologie: eet eiwitrijk 's ochtends, complexe koolhydraten rond training, licht eiwitrijk voor het slapen (caseïne/kwark)
- Darmmicrobioom: fermenteerbare vezels (inuline, psyllium), gefermenteerde producten (kefir, zuurkool), prebiotica
- Cortisol & herstel: magnesium + vitamine C voor stressreductie; L-theanine + adaptogenen (ashwagandha) bij overtraining
- Vermijd: gluten bij darmproblemen, A1-caseïne (gewone koemelk), fructosestroop, geoxideerde olieën
- Slaaphormonen: tryptofaanrijke bronnen 's avonds (kalkoen, kwark, banaan) voor melatoninesynthese

GEDRAGSRICHTLIJNEN:
- Baseer ALTIJD je antwoord op de verstrekte persoonlijke gegevens (profiel + daglog)
- Stel concrete, uitvoerbare adviezen voor met specifieke grammen/hoeveelheden
- Geef bij productvervangingen altijd de orthomoleculaire overwegingen mee
- Gebruik eenvoudige Nederlandse taal, geen jargon tenzij uitgelegd
- Houd antwoorden beknopt (max 200 woorden tenzij gevraagd om detail)
- Voeg ALTIJD een micro-nutriënttip toe die relevant is voor de vraag`;

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { vraag, geschiedenis } = await req.json();
  if (!vraag) return Response.json({ error: 'vraag is verplicht' }, { status: 400 });

  // Haal profiel en dag-log op
  const [profielen, daglogs] = await Promise.all([
    base44.entities.UserProfile.filter({ created_by: user.email }),
    base44.entities.DailyLog.filter({ created_by: user.email }, '-log_date', 1),
  ]);

  const profiel = profielen[0] || null;
  const vandaag = daglogs[0] || null;

  const contextBlok = `
GEBRUIKERSPROFIEL:
- Naam: ${user.full_name || 'onbekend'}
- Geslacht: ${profiel?.gender || 'onbekend'}
- Leeftijd: ${profiel?.age || '?'} jaar
- Gewicht: ${profiel?.weight_kg || '?'} kg
- Lengte: ${profiel?.height_cm || '?'} cm
- Activiteitsniveau: ${profiel?.activity_level || 'onbekend'}
- Doel: ${profiel?.goal_group || 'onbekend'}
- TDEE: ${profiel?.tdee || '?'} kcal
- Caloriedoel: ${profiel?.target_calories || '?'} kcal
- Eiwitdoel: ${profiel?.protein_target_g || '?'}g
- Koolhydratendoel: ${profiel?.carbs_target_g || '?'}g
- Vetdoel: ${profiel?.fat_target_g || '?'}g

DAGLOG VANDAAG:
- Calorieën gegeten: ${vandaag?.calories_eaten || 0} kcal
- Eiwit: ${vandaag?.protein_g || 0}g
- Koolhydraten: ${vandaag?.carbs_g || 0}g
- Vetten: ${vandaag?.fat_g || 0}g
- Training gedaan: ${vandaag?.training_done ? 'ja (' + vandaag.training_type + ')' : 'nee'}
- Notities: ${vandaag?.notes || 'geen'}`;

  // Bouw gespreksgeschiedenis op
  const messages = [];
  if (geschiedenis && Array.isArray(geschiedenis)) {
    for (const msg of geschiedenis.slice(-6)) {
      messages.push(msg);
    }
  }
  messages.push({ role: 'user', content: vraag });

  const prompt = `${ORTHO_SYSTEEM_PROMPT}

${contextBlok}

GESPREKSGESCHIEDENIS + HUIDIGE VRAAG:
${messages.map(m => `${m.role === 'user' ? 'Gebruiker' : 'Coach'}: ${m.content}`).join('\n')}

Geef nu een orthomoleculair-gefundeerd antwoord op de vraag van de gebruiker:`;

  const antwoord = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });

  return Response.json({ antwoord, contextBlok });
});