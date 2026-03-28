import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, ChefHat, Plus, X } from 'lucide-react';

export default function MacroSuggestie({ resterend, recepten, voedingsmiddelen = [], geselecteerdeDag, maaltijdTypes, onVoegToe }) {
  const [loading, setLoading] = useState(false);
  const [suggesties, setSuggesties] = useState(null);
  const [open, setOpen] = useState(false);

  // Controleer of er zinvolle resterende macro's zijn
  const heeftRest = resterend.cal > 50 || resterend.prot > 5 || resterend.carbs > 10 || resterend.fat > 3;

  async function zoekSuggesties() {
    setLoading(true);
    setOpen(true);
    setSuggesties(null);

    // Geef AI een lijst van beschikbare recepten met hun macro's
    const receptenLijst = recepten
      .filter(r => r.calories_per_serving || r.protein_g || r.carbs_g || r.fat_g)
      .map(r => ({
        type: 'recept',
        id: r.id,
        titel: r.title,
        categorie: r.category,
        kcal: r.calories_per_serving || 0,
        eiwit: r.protein_g || 0,
        koolhydraten: r.carbs_g || 0,
        vetten: r.fat_g || 0,
      }));

    // Geef AI een lijst van beschikbare voedingsmiddelen met hun macro's
    const voedingLijst = voedingsmiddelen
      .filter(v => v.calories || v.protein_g || v.carbs_g || v.fat_g)
      .map(v => ({
        type: 'voedingsmiddel',
        id: v.id,
        titel: v.name,
        kcal: v.calories || 0,
        eiwit: v.protein_g || 0,
        koolhydraten: v.carbs_g || 0,
        vetten: v.fat_g || 0,
      }));

    const alles = [...receptenLijst, ...voedingLijst];

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Je bent een voedingsdeskundige. Een gebruiker heeft al maaltijden gepland voor vandaag en heeft nog de volgende macro's over:
- Calorieën: ${resterend.cal} kcal
- Eiwit: ${resterend.prot}g
- Koolhydraten: ${resterend.carbs}g
- Vetten: ${resterend.fat}g

Kies uit de onderstaande recepten en voedingsmiddelen de TOP 3 die de resterende macro's zo goed mogelijk aanvullen, ZONDER het doel te overschrijden. 
Prioriteer op basis van de grootste tekorten. Als iemand veel eiwit nodig heeft, prioriteer voedingsmiddelen/recepten met veel eiwit.
Geef voor elk item een korte uitleg (1 zin) waarom het past.

Beschikbare items (recepten + voedingsmiddelen):
${JSON.stringify(alles.slice(0, 300))}

Geef alleen items terug die daadwerkelijk in de lijst staan. Gebruik de exacte id's en type.`,
      response_json_schema: {
        type: 'object',
        properties: {
          suggesties: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['recept', 'voedingsmiddel'] },
                id: { type: 'string' },
                reden: { type: 'string' },
                maaltijd_type: { type: 'string', enum: ['ontbijt', 'lunch', 'diner', 'snack'] },
              }
            }
          }
        }
      }
    });

    // Koppel de suggesties terug aan de volledige objecten
    const verrijkt = (result?.suggesties || []).map(s => {
      if (s.type === 'recept') {
        const recept = recepten.find(r => r.id === s.id);
        return recept ? { ...s, recept } : null;
      } else {
        const item = voedingsmiddelen.find(v => v.id === s.id);
        return item ? { ...s, voedingsmiddel: item } : null;
      }
    }).filter(Boolean);

    setSuggesties(verrijkt);
    setLoading(false);
  }

  if (!heeftRest) return null;

  return (
    <div className="mt-3">
      {!open ? (
        <button onClick={zoekSuggesties}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/40 bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 transition-all">
          <Sparkles className="w-4 h-4" />
          AI suggesties op basis van resterende macro's
        </button>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Aanbevolen recepten</span>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 text-muted-foreground hover:text-foreground transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">AI zoekt de beste match...</span>
            </div>
          ) : suggesties?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ChefHat className="w-7 h-7 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Geen passende recepten gevonden</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
               {suggesties?.map((s, i) => {
                 const isRecept = s.type === 'recept';
                 const item = isRecept ? s.recept : s.voedingsmiddel;
                 const titel = isRecept ? item.title : item.name;
                 const imageUrl = item.image_url;
                 const calPerUnit = isRecept ? item.calories_per_serving : item.calories;
                 const protPerUnit = isRecept ? item.protein_g : item.protein_g;
                 const carbsPerUnit = isRecept ? item.carbs_g : item.carbs_g;
                 const fatPerUnit = isRecept ? item.fat_g : item.fat_g;
                 const alGepland = maaltijdTypes.includes(s.maaltijd_type);
                 return (
                   <div key={i} className="p-3 flex items-start gap-3">
                     {imageUrl ? (
                       <img src={imageUrl} alt={titel} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                     ) : (
                       <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                         <ChefHat className="w-5 h-5 text-muted-foreground" />
                       </div>
                     )}
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-medium text-foreground truncate">{titel}</p>
                       <p className="text-xs text-muted-foreground mt-0.5">
                         {calPerUnit && `${calPerUnit} kcal · `}
                         {protPerUnit && `${protPerUnit}g eiwit · `}
                         {carbsPerUnit && `${carbsPerUnit}g koolh · `}
                         {fatPerUnit && `${fatPerUnit}g vet`}
                       </p>
                       <p className="text-xs text-primary/80 mt-1 italic">{s.reden}</p>
                       <div className="flex items-center gap-2 mt-2">
                         <span className="text-xs text-muted-foreground capitalize bg-secondary px-2 py-0.5 rounded-md">{isRecept ? 'Recept' : 'Voedingsmiddel'}</span>
                         <button
                           onClick={() => onVoegToe(item, s.maaltijd_type, isRecept ? 'recept' : 'voedingsmiddel')}
                           disabled={alGepland}
                           className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${alGepland ? 'bg-secondary text-muted-foreground cursor-not-allowed' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}>
                           <Plus className="w-3 h-3" />
                           {alGepland ? 'Al gepland' : 'Inplannen'}
                         </button>
                       </div>
                     </div>
                   </div>
                 );
               })}
            </div>
          )}

          <div className="p-3 border-t border-border">
            <button onClick={zoekSuggesties} disabled={loading}
              className="w-full text-xs text-muted-foreground hover:text-primary transition-all disabled:opacity-50">
              Opnieuw zoeken
            </button>
          </div>
        </div>
      )}
    </div>
  );
}