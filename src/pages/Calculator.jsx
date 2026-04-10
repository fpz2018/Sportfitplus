import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { UserProfile } from '@/api/entities';
import { Calculator as CalcIcon, Save, Info } from 'lucide-react';

const ACTIVITY_OPTIONS = [
  { value: 'sedentair', label: 'Sedentair', factor: 1.2, desc: 'Weinig of geen beweging' },
  { value: 'licht_actief', label: 'Licht actief', factor: 1.375, desc: '1-3x per week sporten' },
  { value: 'matig_actief', label: 'Matig actief', factor: 1.55, desc: '3-5x per week sporten' },
  { value: 'zeer_actief', label: 'Zeer actief', factor: 1.725, desc: '6-7x per week sporten' },
  { value: 'extreem_actief', label: 'Extreem actief', factor: 1.9, desc: 'Zwaar werk + dagelijks sporten' },
];

export default function CalculatorPage() {
  const { profile } = useAuth();
  const [form, setForm] = useState({ gender: 'man', age: '', weight: '', height: '', activity: 'matig_actief' });
  const [manualTdee, setManualTdee] = useState('');
  const [mode, setMode] = useState('berekend');
  const [saved, setSaved] = useState(false);

  function update(k, v) { setForm(p => ({ ...p, [k]: v })); }

  function calcTDEE() {
    const { gender, age, weight, height, activity } = form;
    if (!age || !weight || !height) return null;
    let bmr;
    if (gender === 'man') {
      bmr = 10 * parseFloat(weight) + 6.25 * parseFloat(height) - 5 * parseInt(age) + 5;
    } else {
      bmr = 10 * parseFloat(weight) + 6.25 * parseFloat(height) - 5 * parseInt(age) - 161;
    }
    const factor = ACTIVITY_OPTIONS.find(o => o.value === activity)?.factor || 1.55;
    return Math.round(bmr * factor);
  }

  const tdee = mode === 'berekend' ? calcTDEE() : (manualTdee ? parseInt(manualTdee) : null);
  const cutTarget = tdee ? Math.round(tdee * 0.8) : null;
  const protein = form.weight ? Math.round(parseFloat(form.weight) * 2.0) : null;

  async function saveToProfile() {
    if (!tdee) return;
    const target = Math.round(tdee * 0.8);
    const p = Math.round(parseFloat(form.weight) * 2.0);
    const fatCals = Math.round(target * 0.25);
    const fat = Math.round(fatCals / 9);
    const carbCals = target - (p * 4) - fatCals;
    const carbs = Math.round(carbCals / 4);
    const profileData = { tdee, target_calories: target, protein_target_g: p, carbs_target_g: carbs, fat_target_g: fat, tdee_source: mode };
    if (profile) {
      await UserProfile.update(profileData);
    } else {
      await UserProfile.upsert({ ...profileData, onboarding_done: false });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="p-6 pb-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <CalcIcon className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">TDEE Calculator</h1>
        </div>
        <p className="text-muted-foreground text-sm">Bereken je totale dagelijkse energiebehoefte of voer hem handmatig in</p>
      </div>

      {/* Mode selector */}
      <div className="flex gap-3 mb-6">
        {[{ v: 'berekend', l: 'Automatisch berekenen' }, { v: 'handmatig', l: 'Handmatig invoeren' }].map(opt => (
          <button key={opt.v} onClick={() => setMode(opt.v)}
            className={`flex-1 py-3 rounded-xl border font-medium text-sm transition-all ${mode === opt.v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
            {opt.l}
          </button>
        ))}
      </div>

      {mode === 'berekend' && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 space-y-5">
          {/* Geslacht */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Geslacht</label>
            <div className="flex gap-3">
              {['man', 'vrouw'].map(g => (
                <button key={g} onClick={() => update('gender', g)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium capitalize transition-all ${form.gender === g ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                  {g === 'man' ? '👨 Man' : '👩 Vrouw'}
                </button>
              ))}
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { k: 'age', l: 'Leeftijd', p: '25', u: 'jaar' },
              { k: 'weight', l: 'Gewicht', p: '80', u: 'kg' },
              { k: 'height', l: 'Lengte', p: '178', u: 'cm' },
            ].map(({ k, l, p, u }) => (
              <div key={k}>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{l}</label>
                <div className="relative">
                  <input type="number" value={form[k]} onChange={e => update(k, e.target.value)} placeholder={p}
                    className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{u}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Activiteit */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Activiteitsniveau</label>
            <div className="space-y-2">
              {ACTIVITY_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => update('activity', opt.value)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${form.activity === opt.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}>
                  <span className={`font-medium text-sm ${form.activity === opt.value ? 'text-primary' : 'text-foreground'}`}>{opt.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">— {opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === 'handmatig' && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-3 mb-4 p-3 bg-accent/10 rounded-xl">
            <Info className="w-4 h-4 text-accent mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">Gebruik een externe TDEE calculator zoals <strong className="text-foreground">TDEE Calculator.net</strong>, <strong className="text-foreground">MyFitnessPal</strong> of <strong className="text-foreground">Cronometer</strong> en voer je TDEE hier in.</p>
          </div>
          <label className="text-sm font-medium text-foreground mb-2 block">Jouw TDEE (kcal/dag)</label>
          <input type="number" value={manualTdee} onChange={e => setManualTdee(e.target.value)} placeholder="bijv. 2800"
            className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
          {form.weight && (
            <div className="mt-3">
              <label className="text-sm font-medium text-foreground mb-2 block">Gewicht (voor eiwitberekening)</label>
              <input type="number" value={form.weight} onChange={e => update('weight', e.target.value)} placeholder="80"
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
            </div>
          )}
          {!form.weight && (
            <div className="mt-3">
              <label className="text-sm font-medium text-foreground mb-2 block">Gewicht (voor eiwitberekening)</label>
              <input type="number" value={form.weight} onChange={e => update('weight', e.target.value)} placeholder="80"
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
            </div>
          )}
        </div>
      )}

      {/* Resultaat */}
      {tdee && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h3 className="font-semibold text-foreground mb-5">📊 Jouw resultaten</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'TDEE', value: `${tdee}`, unit: 'kcal' },
              { label: 'Cut doel (-20%)', value: `${cutTarget}`, unit: 'kcal' },
              { label: 'Eiwit', value: `${protein || '—'}`, unit: 'g/dag' },
              { label: 'Tekort', value: `${tdee - cutTarget}`, unit: 'kcal/dag' },
            ].map(({ label, value, unit }) => (
              <div key={label} className="bg-secondary rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className="text-2xl font-bold text-primary">{value}</p>
                <p className="text-xs text-muted-foreground">{unit}</p>
              </div>
            ))}
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-5">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Macro verdeling</p>
            <div className="space-y-2">
              {[
                { label: 'Eiwit', g: protein, color: 'bg-primary', pct: protein ? Math.round((protein * 4 / cutTarget) * 100) : 0 },
                { label: 'Vetten', g: cutTarget && protein ? Math.round((cutTarget * 0.25) / 9) : 0, color: 'bg-accent', pct: 25 },
                { label: 'Koolhydraten', g: cutTarget && protein ? Math.round((cutTarget - protein * 4 - cutTarget * 0.25) / 4) : 0, color: 'bg-blue-400', pct: cutTarget && protein ? Math.round(((cutTarget - protein * 4 - cutTarget * 0.25) / cutTarget) * 100) : 0 },
              ].map(({ label, g, color, pct }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-28">{label}</span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-medium text-foreground w-16 text-right">{g}g ({pct}%)</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={saveToProfile}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${saved ? 'bg-primary/20 text-primary' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
            <Save className="w-4 h-4" />
            {saved ? '✓ Opgeslagen in profiel!' : 'Opslaan in mijn profiel'}
          </button>
        </div>
      )}

      {/* Uitleg */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold text-foreground mb-3">📚 Wat is TDEE?</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Je <strong className="text-foreground">Total Daily Energy Expenditure (TDEE)</strong> is het totale aantal calorieën dat je dagelijks verbrandt, inclusief rust, activiteit en voedselvertering. Voor een cut raden we een tekort van <strong className="text-foreground">15-25%</strong> aan. Groter dan 25% verhoogt het risico op spierverlies.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-3">
          Eiwitinname van <strong className="text-foreground">1.6-2.4g/kg lichaamsgewicht</strong> is essentieel om spieren te behouden tijdens het snijden (Hector et al., 2017).
        </p>
      </div>
    </div>
  );
}
