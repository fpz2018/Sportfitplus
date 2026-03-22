import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, ChevronDown, ChevronUp, Loader2, Utensils, RefreshCw } from 'lucide-react';

const DIEET_OPTIES = [
  { value: 'alles', label: '🍖 Alles' },
  { value: 'vegetarisch', label: '🥗 Vegetarisch' },
  { value: 'veganistisch', label: '🌱 Veganistisch' },
  { value: 'pescotarisch', label: '🐟 Pescotarisch' },
  { value: 'glutenvrij', label: '🌾 Glutenvrij' },
  { value: 'lactosevrij', label: '🥛 Lactosevrij' },
];

const DOEL_OPTIES = [
  { value: 'droogtrainen', label: '🔥 Droogtrainen (vet verliezen)' },
  { value: 'spiermassa', label: '💪 Spiermassa opbouwen' },
  { value: 'onderhoud', label: '⚖️ Gewicht onderhouden' },
];

export default function AiMenuGenerator({ profile }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    gewicht: profile?.weight_kg || '',
    doel: 'droogtrainen',
    dieet: 'alles',
    allergenen: '',
    maaltijden: 4,
  });

  function update(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function genereer() {
    setLoading(true);
    setResult(null);
    const calorieDoel = profile?.target_calories || Math.round((parseFloat(form.gewicht) || 80) * 25 * 0.8);
    const eiwitDoel = profile?.protein_target_g || Math.round((parseFloat(form.gewicht) || 80) * 2);

    const prompt = `Je bent een professionele sport-diëtist gespecialiseerd in droogtrainen en lichaamscompositie.

Genereer een volledig dagmenu voor iemand met de volgende kenmerken:
- Gewicht: ${form.gewicht || 80} kg
- Doel: ${form.doel}
- Voedingsvoorkeur: ${form.dieet}
- Calorie doel: ${calorieDoel} kcal/dag
- Eiwit doel: ${eiwitDoel}g/dag
- Aantal maaltijden: ${form.maaltijden}
${form.allergenen ? `- Allergenen/vermijden: ${form.allergenen}` : ''}

Maak een concreet, realistisch dagmenu met Nederlandse voedingsmiddelen die makkelijk verkrijgbaar zijn.

REGELS:
- Eiwit moet minimaal ${eiwitDoel}g totaal zijn
- Totale calorieën moeten dicht bij ${calorieDoel} kcal liggen (±50 kcal)
- Gebruik realistische portiegroottes in grammen
- Geef voor elke maaltijd de exacte macro's

Geef ook 2-3 praktische tips specifiek voor dit profiel.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          totaal_calories: { type: 'number' },
          totaal_eiwit_g: { type: 'number' },
          totaal_koolh_g: { type: 'number' },
          totaal_vet_g: { type: 'number' },
          maaltijden: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                naam: { type: 'string' },
                tijd: { type: 'string' },
                calories: { type: 'number' },
                eiwit_g: { type: 'number' },
                koolh_g: { type: 'number' },
                vet_g: { type: 'number' },
                gerechten: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      naam: { type: 'string' },
                      hoeveelheid: { type: 'string' },
                      calories: { type: 'number' },
                      eiwit_g: { type: 'number' },
                    }
                  }
                }
              }
            }
          },
          tips: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    });

    setResult(response);
    setLoading(false);
  }

  const calorieDoel = profile?.target_calories || '';
  const eiwitDoel = profile?.protein_target_g || '';

  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 rounded-2xl mb-6 overflow-hidden">
      {/* Header */}
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-primary/5 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">AI Dagmenu Generator</p>
            <p className="text-xs text-muted-foreground">Persoonlijk menu op basis van jouw profiel en voorkeuren</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-primary/20 p-5 space-y-5">
          {/* Formulier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gewicht */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Huidig gewicht (kg)</label>
              <input
                type="number"
                value={form.gewicht}
                onChange={e => update('gewicht', e.target.value)}
                placeholder="bijv. 82"
                className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Aantal maaltijden */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Aantal maaltijden per dag</label>
              <div className="flex gap-2">
                {[3, 4, 5, 6].map(n => (
                  <button key={n} onClick={() => update('maaltijden', n)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${form.maaltijden === n ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Doel */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Doel</label>
              <div className="space-y-1.5">
                {DOEL_OPTIES.map(opt => (
                  <button key={opt.value} onClick={() => update('doel', opt.value)}
                    className={`w-full text-left px-3 py-2 rounded-xl border text-sm transition-all ${form.doel === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dieetvoorkeur */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Voedingsvoorkeur</label>
              <div className="grid grid-cols-2 gap-1.5">
                {DIEET_OPTIES.map(opt => (
                  <button key={opt.value} onClick={() => update('dieet', opt.value)}
                    className={`text-left px-3 py-2 rounded-xl border text-xs transition-all ${form.dieet === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Allergenen */}
              <div className="mt-3">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Allergenen / vermijden (optioneel)</label>
                <input
                  type="text"
                  value={form.allergenen}
                  onChange={e => update('allergenen', e.target.value)}
                  placeholder="bijv. noten, soja..."
                  className="w-full bg-input border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Profiel doelen preview */}
          {(calorieDoel || eiwitDoel) && (
            <div className="flex gap-3 p-3 bg-secondary/50 rounded-xl text-xs text-muted-foreground">
              <span>📊 Jouw profiel:</span>
              {calorieDoel && <span className="text-orange-400 font-medium">{calorieDoel} kcal</span>}
              {eiwitDoel && <span className="text-primary font-medium">{eiwitDoel}g eiwit</span>}
              <span className="ml-1">wordt gebruikt als basis</span>
            </div>
          )}

          {/* Genereer knop */}
          <button onClick={genereer} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Menu genereren...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Genereer mijn dagmenu</>
            )}
          </button>

          {/* Resultaat */}
          {result && <MenuResultaat result={result} onRefresh={genereer} loading={loading} />}
        </div>
      )}
    </div>
  );
}

function MenuResultaat({ result, onRefresh, loading }) {
  const [openMeal, setOpenMeal] = useState(null);
  const calPct = (cal) => result.totaal_calories ? Math.round((cal / result.totaal_calories) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Totale macro's */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-foreground">📊 Macro-verdeling vandaag</p>
          <button onClick={onRefresh} disabled={loading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-all disabled:opacity-50">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Nieuw menu
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Calorieën', value: result.totaal_calories, unit: 'kcal', color: 'text-orange-400' },
            { label: 'Eiwit', value: result.totaal_eiwit_g, unit: 'g', color: 'text-primary' },
            { label: 'Koolh.', value: result.totaal_koolh_g, unit: 'g', color: 'text-blue-400' },
            { label: 'Vetten', value: result.totaal_vet_g, unit: 'g', color: 'text-accent' },
          ].map(({ label, value, unit, color }) => (
            <div key={label} className="bg-secondary rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
              <p className={`text-lg font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{unit}</p>
            </div>
          ))}
        </div>

        {/* Macro balk */}
        <div className="space-y-2">
          {[
            { label: 'Eiwit', g: result.totaal_eiwit_g, cal: result.totaal_eiwit_g * 4, color: 'bg-primary' },
            { label: 'Koolhydraten', g: result.totaal_koolh_g, cal: result.totaal_koolh_g * 4, color: 'bg-blue-400' },
            { label: 'Vetten', g: result.totaal_vet_g, cal: result.totaal_vet_g * 9, color: 'bg-accent' },
          ].map(({ label, g, cal, color }) => {
            const pct = result.totaal_calories ? Math.round((cal / result.totaal_calories) * 100) : 0;
            return (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-24">{label}</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-medium text-foreground w-20 text-right">{g}g ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Maaltijden */}
      <div className="space-y-2">
        {result.maaltijden?.map((meal, i) => (
          <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
            <button onClick={() => setOpenMeal(openMeal === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-all">
              <div className="flex items-center gap-3">
                <Utensils className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="text-left">
                  <span className="text-sm font-medium text-foreground">{meal.naam}</span>
                  {meal.tijd && <span className="text-xs text-muted-foreground ml-2">({meal.tijd})</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-2 text-xs">
                  <span className="text-orange-400">{meal.calories} kcal</span>
                  <span className="text-primary">{meal.eiwit_g}g eiwit</span>
                </div>
                {openMeal === i ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
              </div>
            </button>

            {openMeal === i && (
              <div className="border-t border-border px-4 pb-3 pt-2 space-y-2">
                {meal.gerechten?.map((g, j) => (
                  <div key={j} className="flex items-center justify-between p-2.5 bg-secondary rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-foreground">{g.naam}</p>
                      <p className="text-xs text-muted-foreground">{g.hoeveelheid}</p>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="text-orange-400">{g.calories} kcal</span>
                      <span className="text-primary">{g.eiwit_g}g</span>
                    </div>
                  </div>
                ))}
                <div className="flex gap-3 pt-1 text-xs text-muted-foreground border-t border-border mt-2 pt-2">
                  <span>Koolh: <span className="text-blue-400">{meal.koolh_g}g</span></span>
                  <span>Vet: <span className="text-accent">{meal.vet_g}g</span></span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tips */}
      {result.tips?.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-primary mb-2">💡 Persoonlijke tips</p>
          <ul className="space-y-1.5">
            {result.tips.map((tip, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-2">
                <span className="text-primary mt-0.5 shrink-0">→</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}