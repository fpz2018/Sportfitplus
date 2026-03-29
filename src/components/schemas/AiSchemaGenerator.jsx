import { useState } from 'react';
import { callFunction } from '@/api/netlifyClient';
import { CustomSchema } from '@/api/entities';
import { Sparkles, ChevronDown, ChevronUp, Loader2, Dumbbell, Moon, RefreshCw, Save, CheckCircle } from 'lucide-react';

const FREQ_OPTIES = [
  { value: 2, label: '2x per week' },
  { value: 3, label: '3x per week' },
  { value: 4, label: '4x per week' },
  { value: 5, label: '5x per week' },
  { value: 6, label: '6x per week' },
];

const METHODE_OPTIES = [
  { value: 'kracht', label: '🏋️ Klassieke kracht', desc: 'Compound oefeningen, 3-4 sets, 8-12 reps' },
  { value: 'hypertrofie', label: '💪 Hypertrofie', desc: 'Hoog volume, 4-6 sets, 8-12 reps, progressieve overload' },
  { value: 'hiit', label: '⚡ HIIT', desc: 'Intervallen, maximale inspanning, vetverbranding' },
  { value: 'tabata', label: '🔥 Tabata', desc: '20s werk / 10s rust, 8 rondes per oefening' },
];

const DAG_KLEUREN = {
  kracht: 'bg-primary/10 border-primary/30 text-primary',
  cardio: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  rust: 'bg-secondary border-border text-muted-foreground',
  active_recovery: 'bg-accent/10 border-accent/30 text-accent',
};

export default function AiSchemaGenerator({ profile }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    methode: profile?.training_methode || 'kracht',
    frequentie: profile?.training_frequentie || (profile?.goal_group === 'beginner' ? 3 : profile?.goal_group === 'atleet' ? 5 : 4),
    doel: profile?.goal_group || 'gevorderd',
    ervaring: profile?.training_ervaring || 'gemiddeld',
    thuis: profile?.training_locatie === 'thuis',
  });

  function update(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function genereer() {
    setLoading(true);
    setResult(null);
    setSaved(false);

    const doelOmschrijving = {
      beginner: 'beginnen met trainen en vet verliezen',
      gevorderd: 'gezond en fit worden met behoud van spiermassa',
      vrouw: 'tonen en vet verliezen met focus op onderlichaam',
      '50plus': 'spiermassa behouden en fit blijven na je 50e',
      atleet: 'prestaties maximaliseren en spiermassa opbouwen',
    }[form.doel] || 'gezond en fit worden';

    const methodeInstructies = {
      kracht: `Klassieke krachttraining:
- Compound oefeningen (squat, deadlift, bench, row, press)
- 3-4 sets per oefening, 8-12 herhalingen
- Rusttijd: 60-120 seconden tussen sets
- Intensiteit: 60-80% van 1RM
- Progressieve overload week over week`,

      hypertrofie: `Hypertrofie training (spiergroei):
- Mix van compound + isolatie oefeningen
- 4-6 sets per oefening, 6-12 herhalingen
- Rusttijd: 60-90 seconden tussen sets
- Hoog volume per spiergroep
- Elke spiergroep 2x per week trainen
- Progressieve overload is essentieel`,

      hiit: `HIIT (High-Intensity Interval Training):
- Afwisseling van maximale inspanning (85-100% HF) en rust
- Intervalverhouding: 20-40s werk / 20-60s rust (1:1 of 1:2 ratio)
- 5-10 intervallen per ronde
- Totale duur per sessie: 20-30 minuten
- Maximaal 3x per week (herstel is cruciaal)
- Oefeningen: burpees, jump squats, mountain climbers, sprinten`,

      tabata: `Tabata training:
- Protocol: 20 seconden maximale inspanning / 10 seconden rust
- 8 rondes per oefening = 4 minuten per blok
- 1-4 oefeningen per sessie
- Totale duur: 4-20 minuten (exclusief warming-up)
- Maximaal 2x per week (extreem intensief)
- Oefeningen: bodyweight of lichte gewichten`,
    }[form.methode];

    const prompt = `Je bent een expert personal trainer gespecialiseerd in gezondheid en lichaamscompositie.

Maak een volledig wekelijks trainingsschema voor iemand met:
- Trainingsmethode: ${METHODE_OPTIES.find(m => m.value === form.methode)?.label}
- Trainingsfrequentie: ${form.frequentie}x per week
- Doel: ${doelOmschrijving}
- Ervaringsniveau: ${form.ervaring}
- Thuis trainen: ${form.thuis ? 'ja (geen gym apparatuur)' : 'nee (gym beschikbaar)'}
${profile?.weight_kg ? `- Gewicht: ${profile.weight_kg} kg` : ''}

RICHTLIJNEN VOOR DEZE METHODE:
${methodeInstructies}

Maak een schema voor alle 7 dagen van de week (ma t/m zo).
Zorg voor optimale verdeling van spiergroepen en rustdagen.
Geef per trainingsdag 4-6 concrete oefeningen met sets en herhalingen (inclusief rusttijden).
Rustdagen mogen actief herstel bevatten (wandelen, stretchen).

Geef ook een korte uitleg van de opbouw en waarom deze structuur werkt.`;

    const response = await callFunction('invokeLLM', {
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          schema_naam: { type: 'string' },
          uitleg: { type: 'string' },
          dagen: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                dag: { type: 'string' },
                type: { type: 'string', enum: ['kracht', 'cardio', 'rust', 'active_recovery'] },
                focus: { type: 'string' },
                oefeningen: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      naam: { type: 'string' },
                      sets: { type: 'string' },
                      tip: { type: 'string' },
                    }
                  }
                },
                duur_min: { type: 'number' },
              }
            }
          },
          tips: { type: 'array', items: { type: 'string' } },
        }
      }
    });

    setResult(response);
    setLoading(false);
  }

  async function slaOp() {
    if (!result) return;
    setSaving(true);
    await CustomSchema.create({
      name: result.schema_naam,
      description: result.uitleg,
      days: result.dagen?.map(dag => ({
        dag_naam: dag.dag,
        oefeningen: dag.oefeningen?.map(oe => ({
          naam: oe.naam,
          sets: oe.sets,
          rust: oe.rust || '',
          tip: oe.tip || '',
        })) || [],
      })) || [],
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 rounded-2xl mb-6 overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-primary/5 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">AI Schema Generator</p>
            <p className="text-xs text-muted-foreground">Persoonlijk weekschema op basis van jouw profiel en doelen</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-primary/20 p-5 space-y-5">
          {/* Trainingsmethode */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Trainingsmethode</label>
            <div className="grid grid-cols-2 gap-2">
              {METHODE_OPTIES.map(({ value, label, desc }) => (
                <button key={value} onClick={() => update('methode', value)}
                  className={`text-left px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${form.methode === value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                  <div>{label}</div>
                  <div className="text-xs opacity-70 font-normal mt-0.5">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Frequentie */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Trainingsfrequentie per week</label>
            <div className="flex gap-2 flex-wrap">
              {FREQ_OPTIES.map(({ value, label }) => (
                <button key={value} onClick={() => update('frequentie', value)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${form.frequentie === value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Doel */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Doelgroep / focus</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { v: 'beginner', l: '🌱 Beginner' },
                { v: 'gevorderd', l: '💪 Gevorderd' },
                { v: 'vrouw', l: '👩 Vrouw' },
                { v: '50plus', l: '🏅 50+' },
                { v: 'atleet', l: '🏆 Atleet' },
              ].map(({ v, l }) => (
                <button key={v} onClick={() => update('doel', v)}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${form.doel === v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Ervaring + locatie */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Ervaringsniveau</label>
              <div className="space-y-1.5">
                {[{ v: 'beginner', l: 'Beginner (<1 jaar)' }, { v: 'gemiddeld', l: 'Gemiddeld (1-3 jaar)' }, { v: 'gevorderd', l: 'Gevorderd (3+ jaar)' }].map(({ v, l }) => (
                  <button key={v} onClick={() => update('ervaring', v)}
                    className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-all ${form.ervaring === v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Locatie</label>
              <div className="space-y-1.5">
                {[{ v: false, l: '🏋️ Gym' }, { v: true, l: '🏠 Thuis' }].map(({ v, l }) => (
                  <button key={String(v)} onClick={() => update('thuis', v)}
                    className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-all ${form.thuis === v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={genereer} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Schema genereren...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Genereer mijn weekschema</>
            )}
          </button>

          {result && <SchemaResultaat result={result} onRefresh={genereer} loading={loading} onSave={slaOp} saving={saving} saved={saved} />}
        </div>
      )}
    </div>
  );
}

function SchemaResultaat({ result, onRefresh, loading, onSave, saving, saved }) {
  const [openDag, setOpenDag] = useState(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="font-semibold text-foreground">{result.schema_naam}</p>
        <div className="flex items-center gap-2">
          <button onClick={onRefresh} disabled={loading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-all disabled:opacity-50">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Nieuw
          </button>
          <button onClick={onSave} disabled={saving || saved}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all ${saved ? 'bg-green-500/20 text-green-400' : 'bg-primary/10 text-primary hover:bg-primary/20'} disabled:opacity-60`}>
            {saved ? <><CheckCircle className="w-3 h-3" /> Opgeslagen!</> : saving ? <><Loader2 className="w-3 h-3 animate-spin" /> Opslaan...</> : <><Save className="w-3 h-3" /> Opslaan</>}
          </button>
        </div>
      </div>

      {/* Uitleg */}
      {result.uitleg && (
        <div className="bg-secondary/50 rounded-xl p-4 text-sm text-muted-foreground">
          {result.uitleg}
        </div>
      )}

      {/* Week overzicht */}
      <div className="grid grid-cols-7 gap-1">
        {result.dagen?.map((dag, i) => {
          const kleur = DAG_KLEUREN[dag.type] || DAG_KLEUREN.rust;
          return (
            <button key={i} onClick={() => setOpenDag(openDag === i ? null : i)}
              className={`rounded-xl border p-2 text-center transition-all ${kleur} ${openDag === i ? 'ring-2 ring-primary/50' : ''}`}>
              <p className="text-xs font-bold">{dag.dag.slice(0, 2)}</p>
              <div className="mt-1">
                {dag.type === 'rust' || dag.type === 'active_recovery'
                  ? <Moon className="w-3.5 h-3.5 mx-auto" />
                  : <Dumbbell className="w-3.5 h-3.5 mx-auto" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Dag detail */}
      {openDag !== null && result.dagen?.[openDag] && (() => {
        const dag = result.dagen[openDag];
        const kleur = DAG_KLEUREN[dag.type] || DAG_KLEUREN.rust;
        return (
          <div className={`rounded-xl border p-4 ${kleur}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold">{dag.dag}</p>
                <p className="text-xs opacity-75">{dag.focus}</p>
              </div>
              {dag.duur_min && <span className="text-xs opacity-75">{dag.duur_min} min</span>}
            </div>
            {dag.oefeningen?.length > 0 ? (
              <div className="space-y-2">
                {dag.oefeningen.map((oe, j) => (
                  <div key={j} className="bg-background/30 rounded-lg px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{oe.naam}</span>
                      <span className="text-xs font-mono opacity-80">{oe.sets}</span>
                    </div>
                    {oe.tip && <p className="text-xs opacity-65 mt-0.5">{oe.tip}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm opacity-75">Rust & herstel — geen training</p>
            )}
          </div>
        );
      })()}

      {/* Tips */}
      {result.tips?.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-primary mb-2">💡 Tips voor dit schema</p>
          <ul className="space-y-1.5">
            {result.tips.map((tip, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-2">
                <span className="text-primary shrink-0">→</span>{tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}