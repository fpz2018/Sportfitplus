import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react';

const CHAPTERS = [
  {
    titel: '1. Wat is droogtrainen (cutting)?',
    emoji: '📖',
    inhoud: [
      {
        type: 'tekst',
        content: 'Droogtrainen, ook wel "cutting" genoemd, is het proces van vetmassa verliezen terwijl je spiermassa behoudt. Het doel is een calorietekort creëren zodat het lichaam opgeslagen vet als energie gebruikt.',
      },
      {
        type: 'tip',
        content: 'Een tekort van 300-500 kcal/dag is ideaal: genoeg om vet te verliezen, zonder te veel spierverlies.',
      },
      {
        type: 'tekst',
        content: 'Wetenschappelijk onderzoek (Hall et al., 2012) toont aan dat een tekort van meer dan 25% van je TDEE leidt tot significant spierverlies, zelfs bij voldoende eiwitinname.',
      },
      {
        type: 'waarschuwing',
        content: 'Vermijd extreme crash-diëten. Een verlies van meer dan 1% lichaamsgewicht per week verhoogt het risico op spierverlies aanzienlijk.',
      },
    ]
  },
  {
    titel: '2. Calorietekort berekenen',
    emoji: '🔢',
    inhoud: [
      {
        type: 'tekst',
        content: 'Je TDEE (Total Daily Energy Expenditure) is de basis. Hiervan trek je je tekort af om je dagelijks caloriedoel te bepalen.',
      },
      {
        type: 'lijst',
        items: [
          'Mild tekort: -15% van TDEE → langzame maar spier-vriendelijke cut',
          'Matig tekort: -20% van TDEE → standaard aanbeveling voor de meesten',
          'Agressief tekort: -25% van TDEE → alleen voor korte periodes of bij hoog vetpercentage',
        ]
      },
      {
        type: 'tip',
        content: 'Meet je gewicht elke ochtend na het toiletbezoek. Gebruik een 7-daags gemiddelde om waterretentie te neutraliseren.',
      },
    ]
  },
  {
    titel: '3. Eiwitinname tijdens een cut',
    emoji: '🥩',
    inhoud: [
      {
        type: 'tekst',
        content: 'Eiwit is het meest kritische macronutriënt tijdens een cut. Het beschermt spiermassa, verhoogt verzadiging en heeft de hoogste thermische werking (20-30% van calorieën worden verbrand bij vertering).',
      },
      {
        type: 'lijst',
        items: [
          'Beginner: 1.6-2.0g eiwit per kg lichaamsgewicht',
          'Gevorderd / lager vetpercentage: 2.0-2.4g/kg',
          'Atleet: 2.2-3.1g/kg (Helms et al., 2014)',
        ]
      },
      {
        type: 'tip',
        content: 'Spread eiwitinname over 4-5 maaltijden van 30-40g voor optimale spiereiwitsynhtese (MPS).',
      },
      {
        type: 'check',
        content: 'Beste bronnen: kipfilet, kwark, Griekse yoghurt (0%), tonijn, eieren, cottage cheese, whey proteïne.',
      },
    ]
  },
  {
    titel: '4. Koolhydraten en vetten',
    emoji: '🍚',
    inhoud: [
      {
        type: 'tekst',
        content: 'Na het bepalen van je eiwitdoel verdeel je de resterende calorieën over koolhydraten en vetten. Beiden zijn belangrijk — geen van beide volledig elimineren.',
      },
      {
        type: 'lijst',
        items: [
          'Vetten: minimaal 0.5-1g/kg/dag voor hormoonproductie (testosteron, oestrogeen)',
          'Koolhydraten: vullen de rest van je calorieën, prioriteit voor rondom training',
          'Low-carb diëten werken niet beter voor vetverlies bij gelijke calorieën (Hall et al., 2015)',
        ]
      },
      {
        type: 'waarschuwing',
        content: 'Vetten te laag (<0.5g/kg) kan leiden tot hormonale disbalans, vermoeidheid en verminderd herstel.',
      },
    ]
  },
  {
    titel: '5. Training tijdens een cut',
    emoji: '🏋️',
    inhoud: [
      {
        type: 'tekst',
        content: 'Training tijdens een cut heeft twee doelen: spiermassa behouden én calorieverbruik verhogen. Krachtraining is hierbij essentieel — cardio is optioneel maar nuttig.',
      },
      {
        type: 'lijst',
        items: [
          'Behoud je trainingsintensiteit: gebruik vergelijkbare gewichten als in je bulk',
          'Je hebt minder energie → volumes kunnen licht zakken (10-15% minder)',
          'LISS cardio (wandelen, fietsen): veiligste optie, geen interferentie met kracht',
          'HIIT: effectief maar vraagt meer herstel, max 2x per week',
        ]
      },
      {
        type: 'tip',
        content: 'NEAT (Non-Exercise Activity Thermogenesis) — dagelijkse beweging zoals wandelen — verklaart 15-30% van je totale energieverbruik. Stap dagelijks 8000-10.000 stappen.',
      },
    ]
  },
  {
    titel: '6. Refeed dagen & dieetpauzes',
    emoji: '🔄',
    inhoud: [
      {
        type: 'tekst',
        content: 'Bij langdurig calorietekort daalt leptine (het "verzadigingshormoon"), wat metabolisme vertraagt en honger verhoogt. Refeed dagen herstellen dit gedeeltelijk.',
      },
      {
        type: 'lijst',
        items: [
          'Refeed dag: eet 1 dag op TDEE (calorie-onderhoud), extra koolhydraten',
          'Frequentie: bij 10-12% BF of minder → 1-2x per week refeed',
          'Dieetpauzes (1-2 weken TDEE): effectiever dan continue cutting bij lange cuts (>16 weken)',
        ]
      },
      {
        type: 'check',
        content: 'Studie (Byrne et al., 2017): afwisseling van 2 weken cut / 2 weken onderhoud resulteerde in meer vetverl ies en minder spierverlies dan continue cutting.',
      },
    ]
  },
  {
    titel: '7. Slaap, stress & herstel',
    emoji: '😴',
    inhoud: [
      {
        type: 'tekst',
        content: 'Slaap is misschien de meest onderschatte factor in een cut. Chronisch slaapgebrek verhoogt cortisol, verlaagt testosteron en vergroot de kans op spierverlies en vetopslag.',
      },
      {
        type: 'lijst',
        items: [
          'Minimaal 7-9 uur slaap per nacht voor optimaal herstel',
          'Cortisol (stresshormoon) is katabool: het breekt spierweefsel af',
          'Meditatie, wandelen en beperkt cafeïne na 14:00 verbeteren slaapkwaliteit',
        ]
      },
      {
        type: 'waarschuwing',
        content: 'Bij 5.5 uur slaap vs 8.5 uur verloor een groep 55% meer spiermassa en 60% minder vet bij gelijke calorieën (Nedeltcheva et al., 2010).',
      },
    ]
  },
  {
    titel: '8. Supplementen tijdens een cut',
    emoji: '💊',
    inhoud: [
      {
        type: 'tekst',
        content: 'Supplementen zijn geen wondermiddelen, maar kunnen een bescheiden bijdrage leveren. Focus eerst op voeding en training.',
      },
      {
        type: 'lijst',
        items: [
          '✅ Creatine monohydraat: behoud van kracht en spiermassa (sterk bewijs)',
          '✅ Whey proteïne: handig om eiwitdoel te halen',
          '✅ Vitamine D + omega-3: algemene gezondheid, kan testosteron ondersteunen',
          '⚠️ Cafeïne: verhoogt prestaties en vetverbranding, maar opbouwen van tolerantie',
          '❌ Vetverbranders / thermogenics: onvoldoende bewijs, potentieel gevaarlijk',
        ]
      },
      {
        type: 'tip',
        content: 'Stop creatine NIET tijdens een cut. Het verhoogt cellulair volume maar heeft geen invloed op vetmassa.',
      },
    ]
  },
];

function ContentBlock({ block }) {
  if (block.type === 'tekst') {
    return <p className="text-sm text-muted-foreground leading-relaxed">{block.content}</p>;
  }
  if (block.type === 'lijst') {
    return (
      <ul className="space-y-2">
        {block.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="text-primary mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (block.type === 'tip') {
    return (
      <div className="flex items-start gap-3 p-3 bg-primary/10 border border-primary/20 rounded-xl">
        <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-primary/90">{block.content}</p>
      </div>
    );
  }
  if (block.type === 'waarschuwing') {
    return (
      <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
        <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
        <p className="text-sm text-destructive/90">{block.content}</p>
      </div>
    );
  }
  if (block.type === 'check') {
    return (
      <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
        <p className="text-sm text-green-400">{block.content}</p>
      </div>
    );
  }
  return null;
}

export default function Gids() {
  const [open, setOpen] = useState(0);

  return (
    <div className="p-6 pb-24 md:pb-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Droogtrainen Gids</h1>
        </div>
        <p className="text-muted-foreground text-sm">Wetenschappelijk onderbouwde gids voor effectief en veilig droogtrainen</p>
      </div>

      <div className="space-y-3">
        {CHAPTERS.map((chapter, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? -1 : i)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-secondary/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{chapter.emoji}</span>
                <span className="font-semibold text-foreground text-sm">{chapter.titel}</span>
              </div>
              {open === i
                ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
            </button>

            {open === i && (
              <div className="border-t border-border p-5 space-y-4">
                {chapter.inhoud.map((block, j) => (
                  <ContentBlock key={j} block={block} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 bg-secondary rounded-2xl p-5 text-center">
        <p className="text-xs text-muted-foreground">
          📚 Bronnen: Hall et al. (2012), Helms et al. (2014), Byrne et al. (2017), Nedeltcheva et al. (2010), Hector et al. (2017)
        </p>
      </div>
    </div>
  );
}