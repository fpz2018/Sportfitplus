import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ShoppingCart, Loader2, X, Check, ChevronDown, ChevronUp, Sparkles, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const CATEGORIE_VOLGORDE = [
  'groenten', 'fruit', 'vlees & vis', 'zuivel & eieren', 'granen & brood',
  'peulvruchten', 'noten & zaden', 'kruiden & specerijen', 'sauzen & olie', 'overig'
];

const CATEGORIE_ICONEN = {
  'groenten': '🥦',
  'fruit': '🍎',
  'vlees & vis': '🍗',
  'zuivel & eieren': '🥛',
  'granen & brood': '🌾',
  'peulvruchten': '🫘',
  'noten & zaden': '🌰',
  'kruiden & specerijen': '🌿',
  'sauzen & olie': '🫙',
  'overig': '🛒',
};

export default function Boodschappenlijst({ alleRecepten, onSluit }) {
  const [loading, setLoading] = useState(false);
  const [lijst, setLijst] = useState(null);
  const [afgevinkt, setAfgevinkt] = useState({});
  const [ingeklapt, setIngeklapt] = useState({});
  const [datumVan, setDatumVan] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [datumTot, setDatumTot] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [weekLabel, setWeekLabel] = useState('');

  // Haal weekmenu items op voor de geselecteerde datumrange
  async function laadItems() {
    const allItems = await base44.entities.WeekMenu.list('-datum', 1000);
    return allItems.filter(i => i.datum >= datumVan && i.datum <= datumTot);
  }

  // Haal de volledige receptgegevens op voor alle geplande items
  async function genereer() {
    setLoading(true);

    const items = await laadItems();
    const receptIds = [...new Set(items.map(i => i.recept_id).filter(Boolean))];
    const geplandRecepten = alleRecepten.filter(r => receptIds.includes(r.id));

    if (geplandRecepten.length === 0) {
      setLijst({});
      setLoading(false);
      return;
    }

    // Bouw een lijst van recepten met ingrediënten
    const receptenMetIngredienten = geplandRecepten.map(r => ({
      titel: r.title,
      ingredienten: r.ingredients || [],
    })).filter(r => r.ingredienten.length > 0);

    if (receptenMetIngredienten.length === 0) {
      // Geen ingrediënten in recepten — toon alleen receptnamen
      setLijst({ 'overig': geplandRecepten.map(r => ({ naam: r.title, hoeveelheid: '', gecombineerd: false })) });
      setLoading(false);
      return;
    }

    const rangeLabel = datumVan === datumTot ? datumVan : `${datumVan} t/m ${datumTot}`;
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Je bent een boodschappenassistent. Hieronder staan de ingrediënten van alle geplande recepten voor ${rangeLabel}.

Combineer ingrediënten die hetzelfde zijn (bijv. "2 eieren" + "3 eieren" = "5 eieren").
Sorteer alle ingrediënten in de juiste categorie.
Geef hoeveelheden in een leesbaar formaat (bijv. "500g", "2 stuks", "1 blikje").

Categorieën: groenten, fruit, vlees & vis, zuivel & eieren, granen & brood, peulvruchten, noten & zaden, kruiden & specerijen, sauzen & olie, overig

Recepten met ingrediënten:
${JSON.stringify(receptenMetIngredienten)}

Geef een gestructureerde boodschappenlijst terug.`,
      response_json_schema: {
        type: 'object',
        properties: {
          categorieen: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                naam: { type: 'string' },
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      naam: { type: 'string' },
                      hoeveelheid: { type: 'string' },
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Zet om naar object gesorteerd op volgorde
    const gegroepeerd = {};
    (result?.categorieen || []).forEach(cat => {
      const key = cat.naam.toLowerCase();
      gegroepeerd[key] = cat.items || [];
    });

    setLijst(gegroepeerd);
    setLoading(false);
  }

  // Initieel genereren bij openen
  useEffect(() => {
    setWeekLabel(datumVan === datumTot ? datumVan : `${datumVan} t/m ${datumTot}`);
    genereer();
  }, [datumVan, datumTot]);

  function toggleAfgevinkt(catKey, idx) {
    const key = `${catKey}-${idx}`;
    setAfgevinkt(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleCategorie(cat) {
    setIngeklapt(prev => ({ ...prev, [cat]: !prev[cat] }));
  }

  const gesorteerdeCategorieen = lijst
    ? CATEGORIE_VOLGORDE.filter(c => lijst[c]?.length > 0)
        .concat(Object.keys(lijst).filter(c => !CATEGORIE_VOLGORDE.includes(c) && lijst[c]?.length > 0))
    : [];

  const totaalItems = lijst ? Object.values(lijst).reduce((sum, items) => sum + items.length, 0) : 0;
  const totaalAfgevinkt = Object.values(afgevinkt).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
         {/* Header */}
         <div className="p-4 border-b border-border shrink-0 space-y-3">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <ShoppingCart className="w-5 h-5 text-primary" />
               <div>
                 <p className="font-semibold text-foreground">Boodschappenlijst</p>
               </div>
             </div>


           {/* Datum selector */}
           <div className="flex items-center gap-2">
             <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
             <input
               type="date"
               value={datumVan}
               onChange={(e) => setDatumVan(e.target.value)}
               className="text-xs bg-secondary border border-border rounded-lg px-2 py-1.5 text-foreground"
             />
             <span className="text-xs text-muted-foreground">tot</span>
             <input
               type="date"
               value={datumTot}
               onChange={(e) => setDatumTot(e.target.value)}
               className="text-xs bg-secondary border border-border rounded-lg px-2 py-1.5 text-foreground"
             />
           </div>
         </div>
          <div className="flex items-center gap-2">
            {!loading && lijst && (
              <span className="text-xs text-muted-foreground">{totaalAfgevinkt}/{totaalItems}</span>
            )}
            <button onClick={onSluit} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium">Boodschappenlijst samenstellen...</p>
                <p className="text-xs mt-1">AI combineert en categoriseert ingrediënten</p>
              </div>
            </div>
          ) : lijst && gesorteerdeCategorieen.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Geen ingrediënten gevonden.</p>
              <p className="text-xs mt-1">Voeg recepten met ingrediënten toe aan je weekmenu.</p>
            </div>
          ) : (
            gesorteerdeCategorieen.map(cat => {
              const catItems = lijst[cat] || [];
              const isIngeklapt = ingeklapt[cat];
              return (
                <div key={cat} className="bg-secondary rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleCategorie(cat)}
                    className="w-full flex items-center justify-between p-3 hover:bg-secondary/80 transition-all">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{CATEGORIE_ICONEN[cat] || '🛒'}</span>
                      <span className="font-medium text-sm text-foreground capitalize">{cat}</span>
                      <span className="text-xs text-muted-foreground bg-card px-2 py-0.5 rounded-full">{catItems.length}</span>
                    </div>
                    {isIngeklapt ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {!isIngeklapt && (
                    <div className="px-3 pb-3 space-y-1.5">
                      {catItems.map((item, idx) => {
                        const key = `${cat}-${idx}`;
                        const gedaan = afgevinkt[key];
                        return (
                          <button
                            key={idx}
                            onClick={() => toggleAfgevinkt(cat, idx)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-card/50 transition-all text-left">
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${gedaan ? 'bg-primary border-primary' : 'border-border bg-card'}`}>
                              {gedaan && <Check className="w-3 h-3 text-primary-foreground" />}
                            </div>
                            <span className={`text-sm flex-1 ${gedaan ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {item.naam}
                            </span>
                            {item.hoeveelheid && (
                              <span className="text-xs text-muted-foreground shrink-0">{item.hoeveelheid}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {!loading && lijst && (
          <div className="p-4 border-t border-border shrink-0">
            <button onClick={genereer}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-muted-foreground text-sm hover:text-primary hover:border-primary/40 transition-all">
              <Sparkles className="w-4 h-4" />
              Opnieuw genereren
            </button>
          </div>
        )}
      </div>
    </div>
  );
}