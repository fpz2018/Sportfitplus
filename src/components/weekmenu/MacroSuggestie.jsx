import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, ChefHat, Plus, X } from 'lucide-react';

export default function MacroSuggestie({ resterend, recepten, geselecteerdeDag, maaltijdTypes, onVoegToe }) {
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
        id: r.id,
        titel: r.title,
        categorie: r.category,
        kcal: r.calories_per_serving || 0,
        eiwit: r.protein_g || 0,
        koolhydraten: r.carbs_g || 0,
        vetten: r.fat_g || 0,
      }));

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Je bent een voedingsdeskundige. Een gebruiker heeft al maaltijden gepland voor vandaag en heeft nog de volgende macro's over:
- Calorieën: ${resterend.cal} kcal
- Eiwit: ${resterend.prot}g
- Koolhydraten: ${resterend.carbs}g
- Vetten: ${resterend.fat}g

Kies uit de onderstaande recepten de TOP 3 die de resterende macro's zo goed mogelijk aanvullen. Prioriteer op basis van de grootste tekorten. 
Als iemand weinig vet over heeft maar veel eiwit, kies dan recepten met weinig vet en veel eiwit. 
Geef voor elk recept een korte uitleg (1 zin) waarom het past.

Beschikbare recepten (JSON):
${JSON.stringify(receptenLijst.slice(0, 200))}

Geef alleen recepten terug die daadwerkelijk in de lijst staan. Gebruik de exacte id's.`,
      response_json_schema: {
        type: 'object',
        properties: {
          suggesties: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                recept_id: { type: 'string' },
                reden: { type: 'string' },
                maaltijd_type: { type: 'string', enum: ['ontbijt', 'lunch', 'diner', 'snack'] },
              }
            }
          }
        }
      }
    });

    // Koppel de suggesties terug aan de volledige receptobjecten
    const verrijkt = (result?.suggesties || []).map(s => {
      const recept = recepten.find(r => r.id === s.recept_id);
      return recept ? { ...s, recept } : null;
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
                const r = s.recept;
                const alGepland = maaltijdTypes.includes(s.maaltijd_type);
                return (
                  <div key={i} className="p-3 flex items-start gap-3">
                    {r.image_url ? (
                      <img src={r.image_url} alt={r.title} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                        <ChefHat className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.calories_per_serving && `${r.calories_per_serving} kcal · `}
                        {r.protein_g && `${r.protein_g}g eiwit · `}
                        {r.carbs_g && `${r.carbs_g}g koolh · `}
                        {r.fat_g && `${r.fat_g}g vet`}
                      </p>
                      <p className="text-xs text-primary/80 mt-1 italic">{s.reden}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground capitalize bg-secondary px-2 py-0.5 rounded-md">{s.maaltijd_type}</span>
                        <button
                          onClick={() => onVoegToe(r, s.maaltijd_type)}
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