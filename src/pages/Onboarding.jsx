import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, ChevronRight, ChevronLeft, Check, Loader2, Sparkles } from 'lucide-react';

const STEPS = ['profiel', 'activiteit', 'doelgroep', 'training', 'tdee', 'voeding'];



const ACTIVITY_OPTIONS = [
  { value: 'sedentair', label: 'Zittend leven', desc: 'Weinig of geen beweging' },
  { value: 'licht_actief', label: 'Licht actief', desc: '1-3x sport per week' },
  { value: 'matig_actief', label: 'Matig actief', desc: '3-5x sport per week' },
  { value: 'zeer_actief', label: 'Zeer actief', desc: '6-7x sport per week' },
  { value: 'extreem_actief', label: 'Extreem actief', desc: 'Zwaar werk + dagelijks sporten' },
];

const LIFESTYLE_OPTIONS = [
  { value: 'student', label: '🎓 Student', desc: 'Studeren, veel zitten of fietsen' },
  { value: 'kantoorwerk', label: '💼 Kantoorwerk', desc: 'Bureau job, weinig bewegen overdag' },
  { value: 'drukke_baan', label: '⚡ Drukke baan', desc: 'Weinig tijd, hoog stressniveau' },
  { value: 'handarbeid', label: '🔧 Handarbeid', desc: 'Fysiek werk overdag' },
  { value: 'ouder_thuis', label: '👶 Ouder/thuis', desc: 'Thuis, zorgtaken' },
];

const GOAL_GROUPS = [
  { value: 'beginner', label: '🌱 Beginner', desc: 'Minder dan 1 jaar trainen' },
  { value: 'gevorderd', label: '💪 Gevorderd', desc: '1+ jaar consistent trainen' },
  { value: 'vrouw', label: '👩 Vrouw specifiek', desc: 'Schema op maat voor vrouwen' },
  { value: '50plus', label: '🏅 50+ schema', desc: 'Aangepast voor 50+' },
  { value: 'atleet', label: '🏆 Atleet', desc: 'Hoge prestaties, weinig verlies' },
];

function calcTDEE(data) {
  const { gender, age, weight_kg, height_cm, activity_level } = data;
  if (!weight_kg || !height_cm || !age) return 0;
  let bmr;
  if (gender === 'man') {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  } else {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  }
  const factors = { sedentair: 1.2, licht_actief: 1.375, matig_actief: 1.55, zeer_actief: 1.725, extreem_actief: 1.9 };
  return Math.round(bmr * (factors[activity_level] || 1.2));
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    gender: 'man', age: '', weight_kg: '', height_cm: '',
    activity_level: 'matig_actief', lifestyle: 'kantoorwerk',
    goal_group: 'beginner', tdee_source: 'berekend',
    tdee: '', nutrition_mode: 'in_app', external_app_name: '',
    cut_weeks: 12,
    training_frequentie: 3,
    training_locatie: 'gym', training_ervaring: 'beginner',
    training_methode: null
  });

  function update(key, val) {
    setData(prev => ({ ...prev, [key]: val }));
  }

  function computedTDEE() {
    return calcTDEE(data);
  }

  const [finishing, setFinishing] = useState(false);

  async function finish() {
    setFinishing(true);
    const tdee = data.tdee_source === 'berekend' ? computedTDEE() : parseInt(data.tdee);
    const target = Math.round(tdee * 0.8);
    const protein = Math.round(parseFloat(data.weight_kg) * 2.0);
    const fatCals = Math.round(target * 0.25);
    const fat = Math.round(fatCals / 9);
    const carbCals = target - (protein * 4) - fatCals;
    const carbs = Math.round(carbCals / 4);

    // AI bepaalt de beste trainingsmethode op basis van alle criteria
    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Je bent een expert personal trainer. Kies de BESTE trainingsmethode voor deze persoon op basis van hun profiel.

Profiel:
- Geslacht: ${data.gender}
- Leeftijd: ${data.age} jaar
- Gewicht: ${data.weight_kg} kg
- Activiteitsniveau: ${data.activity_level}
- Levensstijl: ${data.lifestyle}
- Doelgroep/niveau: ${data.goal_group}
- Trainingservaring: ${data.training_ervaring}
- Trainingsfrequentie gewenst: ${data.training_frequentie}x per week
- Trainingslocatie: ${data.training_locatie}

Kies precies één methode uit: kracht, hypertrofie, hiit, tabata
- kracht: geschikt voor beginners, ouderen (50+), focus op functionele kracht, compound oefeningen
- hypertrofie: geschikt voor gevorderden met spiergroeidoel, hoog volume
- hiit: geschikt voor mensen met weinig tijd, vet verbranden, max 3x/week
- tabata: alleen voor zeer gevorderden, extreem intensief, max 2x/week

Geef ook een korte motivatie (1 zin) waarom deze methode het best past.`,
      response_json_schema: {
        type: 'object',
        properties: {
          methode: { type: 'string', enum: ['kracht', 'hypertrofie', 'hiit', 'tabata'] },
          motivatie: { type: 'string' },
        }
      }
    });

    const u = await base44.auth.me();
    const existing = await base44.entities.UserProfile.filter({ created_by: u.email });
    const profileData = {
      ...data,
      tdee,
      target_calories: target,
      protein_target_g: protein,
      carbs_target_g: carbs,
      fat_target_g: fat,
      age: parseInt(data.age),
      weight_kg: parseFloat(data.weight_kg),
      height_cm: parseFloat(data.height_cm),
      cut_start_date: new Date().toISOString().split('T')[0],
      onboarding_done: true,
      training_methode: aiResult?.methode || 'kracht',
    };
    if (existing.length > 0) {
      await base44.entities.UserProfile.update(existing[0].id, profileData);
    } else {
      await base44.entities.UserProfile.create(profileData);
    }
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl text-foreground">DroogFit</span>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-primary' : 'bg-secondary'}`} />
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          {/* Step 0: Profiel */}
          {step === 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Jouw profiel</h2>
              <p className="text-muted-foreground mb-6 text-sm">Vul je basisgegevens in voor een nauwkeurige berekening</p>
              <div className="space-y-4">
                <div className="flex gap-3">
                  {['man', 'vrouw'].map(g => (
                    <button key={g} onClick={() => update('gender', g)}
                      className={`flex-1 py-3 rounded-xl border font-medium capitalize transition-all ${data.gender === g ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                      {g === 'man' ? '👨 Man' : '👩 Vrouw'}
                    </button>
                  ))}
                </div>
                {[
                  { key: 'age', label: 'Leeftijd', placeholder: '25', unit: 'jaar' },
                  { key: 'weight_kg', label: 'Gewicht', placeholder: '80', unit: 'kg' },
                  { key: 'height_cm', label: 'Lengte', placeholder: '178', unit: 'cm' },
                ].map(({ key, label, placeholder, unit }) => (
                  <div key={key}>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
                    <div className="flex items-center gap-2">
                      <input type="number" value={data[key]} onChange={e => update(key, e.target.value)}
                        placeholder={placeholder}
                        className="flex-1 bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                      <span className="text-muted-foreground text-sm w-8">{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Activiteitsniveau */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Activiteitsniveau</h2>
              <p className="text-muted-foreground mb-1 text-sm">Sport & trainingsfrequentie</p>
              <div className="space-y-2 mb-5">
                {ACTIVITY_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => update('activity_level', opt.value)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${data.activity_level === opt.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}>
                    <p className={`font-medium text-sm ${data.activity_level === opt.value ? 'text-primary' : 'text-foreground'}`}>{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>
              <p className="text-muted-foreground mb-2 text-sm">Levensstijl</p>
              <div className="grid grid-cols-2 gap-2">
                {LIFESTYLE_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => update('lifestyle', opt.value)}
                    className={`text-left p-3 rounded-xl border transition-all ${data.lifestyle === opt.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}>
                    <p className={`font-medium text-xs ${data.lifestyle === opt.value ? 'text-primary' : 'text-foreground'}`}>{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Doelgroep */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Jouw doelgroep</h2>
              <p className="text-muted-foreground mb-6 text-sm">We passen schema's en adviezen aan op jouw niveau</p>
              <div className="space-y-2">
                {GOAL_GROUPS.map(g => (
                  <button key={g.value} onClick={() => update('goal_group', g.value)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 ${data.goal_group === g.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${data.goal_group === g.value ? 'text-primary' : 'text-foreground'}`}>{g.label}</p>
                      <p className="text-xs text-muted-foreground">{g.desc}</p>
                    </div>
                    {data.goal_group === g.value && <Check className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Training praktisch */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Jouw training</h2>
              <p className="text-muted-foreground mb-5 text-sm">Op basis hiervan kiest de AI de beste trainingsmethode voor jou</p>

              <div className="space-y-5">
                {/* Frequentie */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Hoeveel dagen per week kun je trainen?</label>
                  <div className="flex gap-2 flex-wrap">
                    {[2, 3, 4, 5, 6].map(f => (
                      <button key={f} onClick={() => update('training_frequentie', f)}
                        className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${data.training_frequentie === f ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                        {f}x/week
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ervaring + locatie */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Hoe lang train je al?</label>
                    <div className="space-y-1.5">
                      {[
                        { v: 'beginner', l: '🌱 Beginner', d: '< 1 jaar' },
                        { v: 'gemiddeld', l: '💪 Gemiddeld', d: '1-3 jaar' },
                        { v: 'gevorderd', l: '🏆 Gevorderd', d: '3+ jaar' },
                      ].map(({ v, l, d }) => (
                        <button key={v} onClick={() => update('training_ervaring', v)}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${data.training_ervaring === v ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}>
                          <p className={`font-medium text-xs ${data.training_ervaring === v ? 'text-primary' : 'text-foreground'}`}>{l}</p>
                          <p className="text-xs text-muted-foreground">{d}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Waar train je?</label>
                    <div className="space-y-1.5">
                      {[
                        { v: 'gym', l: '🏋️ Gym', d: 'Met apparatuur' },
                        { v: 'thuis', l: '🏠 Thuis', d: 'Geen apparatuur' },
                      ].map(({ v, l, d }) => (
                        <button key={v} onClick={() => update('training_locatie', v)}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${data.training_locatie === v ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}>
                          <p className={`font-medium text-xs ${data.training_locatie === v ? 'text-primary' : 'text-foreground'}`}>{l}</p>
                          <p className="text-xs text-muted-foreground">{d}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI melding */}
                <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">De AI bepaalt automatisch de beste trainingsmethode (kracht, hypertrofie, HIIT of Tabata) op basis van jouw profiel.</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: TDEE */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Jouw TDEE</h2>
              <p className="text-muted-foreground mb-6 text-sm">Totale dagelijkse energiebehoefte</p>
              <div className="flex gap-3 mb-6">
                {[
                  { value: 'berekend', label: 'Automatisch' },
                  { value: 'handmatig', label: 'Handmatig invoeren' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => update('tdee_source', opt.value)}
                    className={`flex-1 py-3 rounded-xl border font-medium text-sm transition-all ${data.tdee_source === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {data.tdee_source === 'berekend' ? (
                <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6 text-center">
                  <p className="text-muted-foreground text-sm mb-1">Berekende TDEE</p>
                  <p className="text-5xl font-bold text-primary">{computedTDEE()}</p>
                  <p className="text-muted-foreground text-sm mt-1">kcal/dag</p>
                  <p className="text-xs text-muted-foreground mt-3">Cut doel: <span className="text-primary font-medium">{Math.round(computedTDEE() * 0.8)} kcal (-20%)</span></p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Vul je TDEE in van een externe calculator (bijv. MyFitnessPal, TDEE Calculator.net)</p>
                  <input type="number" value={data.tdee} onChange={e => update('tdee', e.target.value)}
                    placeholder="bijv. 2800"
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-2" />
                  {data.tdee && (
                    <p className="text-xs text-muted-foreground">Cut doel: <span className="text-primary font-medium">{Math.round(parseInt(data.tdee) * 0.8)} kcal (-20%)</span></p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Voedingsmodus */}
          {step === 5 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Voeding bijhouden</h2>
              <p className="text-muted-foreground mb-6 text-sm">Hoe wil je je voeding tracken?</p>
              <div className="space-y-3 mb-6">
                {[
                  { value: 'in_app', label: '🥗 In deze app', desc: 'Gebruik onze voedingsplannen en database' },
                  { value: 'externe_app', label: '📱 Externe app', desc: 'Gebruik MyFitnessPal, Cronometer of andere app' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => update('nutrition_mode', opt.value)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${data.nutrition_mode === opt.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}>
                    <p className={`font-medium text-sm ${data.nutrition_mode === opt.value ? 'text-primary' : 'text-foreground'}`}>{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>
              {data.nutrition_mode === 'externe_app' && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Welke app gebruik je?</label>
                  <input type="text" value={data.external_app_name} onChange={e => update('external_app_name', e.target.value)}
                    placeholder="bijv. MyFitnessPal"
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all text-sm font-medium">
                <ChevronLeft className="w-4 h-4" /> Terug
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all">
                Volgende <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={finish} disabled={finishing}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                {finishing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> AI analyseert jouw profiel...</>
                ) : (
                  <><Check className="w-4 h-4" /> Profiel opslaan & starten</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}