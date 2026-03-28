import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, ChevronRight, ChevronLeft, Check, Loader2, Sparkles, Heart, FlaskConical } from 'lucide-react';

const STEPS = ['profiel', 'activiteit', 'doelgroep', 'training', 'gezondheid', 'supplementen', 'tdee', 'voeding'];

const ACTIVITY_OPTIONS = [
  { value: 'sedentair', label: 'Zittend leven', desc: 'Weinig of geen beweging' },
  { value: 'licht_actief', label: 'Licht actief', desc: '1-3x sport per week' },
  { value: 'matig_actief', label: 'Matig actief', desc: '3-5x sport per week' },
  { value: 'zeer_actief', label: 'Zeer actief', desc: '6-7x sport per week' },
  { value: 'extreem_actief', label: 'Extreem actief', desc: 'Zwaar werk + dagelijks sporten' },
];

const LIFESTYLE_OPTIONS = [
  { value: 'student', label: '🎓 Student', desc: 'Veel zitten of fietsen' },
  { value: 'kantoorwerk', label: '💼 Kantoorwerk', desc: 'Bureau job, weinig bewegen' },
  { value: 'drukke_baan', label: '⚡ Drukke baan', desc: 'Weinig tijd, hoog stress' },
  { value: 'handarbeid', label: '🔧 Handarbeid', desc: 'Fysiek werk overdag' },
  { value: 'ouder_thuis', label: '👶 Ouder/thuis', desc: 'Thuis, zorgtaken' },
];

const GOAL_GROUPS = [
  { value: 'beginner', label: '🌱 Beginner', desc: 'Minder dan 1 jaar trainen' },
  { value: 'gevorderd', label: '💪 Gevorderd', desc: '1+ jaar consistent trainen' },
  { value: 'vrouw', label: '👩 Vrouw specifiek', desc: 'Schema op maat voor vrouwen' },
  { value: '50plus', label: '🏅 50+ schema', desc: 'Aangepast voor 50+' },
  { value: 'atleet', label: '🏆 Atleet', desc: 'Hoge prestaties' },
];

const GEZONDHEIDS_DOELEN = [
  { value: 'spieropbouw', label: '💪 Spieropbouw' },
  { value: 'vetverlies', label: '🔥 Vetverlies' },
  { value: 'energie', label: '⚡ Meer energie' },
  { value: 'slaap', label: '😴 Betere slaap' },
  { value: 'herstel', label: '🔄 Sneller herstel' },
  { value: 'focus', label: '🧠 Focus & concentratie' },
  { value: 'immuunsysteem', label: '🛡️ Immuunsysteem' },
  { value: 'hormonen', label: '⚖️ Hormoonbalans' },
  { value: 'gezondheid', label: '❤️ Algemene gezondheid' },
  { value: 'prestatie', label: '🏅 Sportprestatie' },
];

const SUPPLEMENT_DOELEN = [
  { value: 'spieropbouw', label: '💪 Meer spiermassa' },
  { value: 'vetverlies', label: '🔥 Vetverbranding' },
  { value: 'herstel', label: '🔄 Sneller herstel' },
  { value: 'energie', label: '⚡ Energie & focus' },
  { value: 'slaap', label: '😴 Slaapkwaliteit' },
  { value: 'stress', label: '🧘 Stressreductie' },
  { value: 'immuunsysteem', label: '🛡️ Immuunsysteem' },
  { value: 'hormonen', label: '⚖️ Testosteron/hormonen' },
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

function ToggleChip({ label, selected, onClick }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all flex items-center gap-1.5 ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}>
      {selected && <Check className="w-3 h-3" />}
      {label}
    </button>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [finishStatus, setFinishStatus] = useState('');
  const [data, setData] = useState({
    gender: 'man', age: '', weight_kg: '', height_cm: '',
    activity_level: 'matig_actief', lifestyle: 'kantoorwerk',
    goal_group: 'beginner', tdee_source: 'berekend',
    tdee: '', nutrition_mode: 'in_app', external_app_name: '',
    cut_weeks: 12, training_frequentie: 3,
    training_locatie: 'gym', training_ervaring: 'beginner',
    training_methode: null,
    // Gezondheid
    slaap_uren: 7, stress_niveau: 5,
    gezondheids_doelen: [],
    blessures_klachten: '',
    voedingspatroon: 'omnivoor',
    // Supplementen
    supplement_doelen: [],
    huidige_supplementen: '',
  });

  function update(key, val) {
    setData(prev => ({ ...prev, [key]: val }));
  }

  function toggleArray(key, val) {
    setData(prev => {
      const arr = prev[key] || [];
      return { ...prev, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  }

  function computedTDEE() {
    return calcTDEE(data);
  }

  async function finish() {
    setFinishing(true);

    // Haal kennisbank op om advies te baseren op actuele kennis
    setFinishStatus('Kennisbank ophalen...');
    const [supplementen, kennisartikelen] = await Promise.all([
      base44.entities.Supplement.filter({ status: 'gepubliceerd' }),
      base44.entities.SupplementNieuws.filter({ status: 'gepubliceerd' }),
    ]);

    const suppKennis = supplementen.map(s =>
      `${s.naam} (${s.categorie}, Evidence: ${s.evidence_level || '?'}, Dosering: ${s.dosering || '?'}, Timing: ${s.timing || '?'}, Doelen: ${s.doelen?.join(', ') || '-'})`
    ).join('\n');

    const nieuws = kennisartikelen.slice(0, 5).map(a => `${a.titel}: ${a.intro || ''}`).join('\n');

    setFinishStatus('AI analyseert jouw profiel...');

    // AI bepaalt trainingsmethode + supplement advies op basis van kennisbank
    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Je bent een expert personal trainer en sportvoedingsdeskundige. Analyseer dit gebruikersprofiel en geef gepersonaliseerde aanbevelingen.

GEBRUIKERSPROFIEL:
- Geslacht: ${data.gender}, Leeftijd: ${data.age} jaar, Gewicht: ${data.weight_kg} kg
- Activiteit: ${data.activity_level}, Levensstijl: ${data.lifestyle}
- Doelgroep/niveau: ${data.goal_group}, Trainingservaring: ${data.training_ervaring}
- Trainingsfrequentie: ${data.training_frequentie}x/week, Locatie: ${data.training_locatie}
- Slaap: ${data.slaap_uren} uur/nacht, Stressniveau: ${data.stress_niveau}/10
- Voedingspatroon: ${data.voedingspatroon}
- Gezondheids­doelen: ${data.gezondheids_doelen.join(', ') || 'geen'}
- Blessures/klachten: ${data.blessures_klachten || 'geen'}
- Supplement doelen: ${data.supplement_doelen.join(', ') || 'geen'}
- Huidige supplementen: ${data.huidige_supplementen || 'geen'}

BESCHIKBARE SUPPLEMENTEN IN KENNISBANK:
${suppKennis || 'Geen supplementen gevonden'}

RECENTE KENNISARTIKELEN:
${nieuws || 'Geen artikelen'}

Geef:
1. De beste trainingsmethode (kracht/hypertrofie/hiit/tabata) met motivatie
2. Top 3-5 supplement aanbevelingen, ALLEEN uit de kennisbank, prioritair op basis van het profiel
3. Specifieke timing/dosering adviezen per supplement op basis van het profiel (bijv. magnesium 's avonds voor iemand met slaapproblemen)

Schrijf in het Nederlands. Wees specifiek en praktisch.`,
      response_json_schema: {
        type: 'object',
        properties: {
          trainings_methode: { type: 'string', enum: ['kracht', 'hypertrofie', 'hiit', 'tabata'] },
          trainings_motivatie: { type: 'string' },
          supplement_advies: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                naam: { type: 'string' },
                prioriteit: { type: 'number' },
                reden: { type: 'string' },
                dosering: { type: 'string' },
                timing: { type: 'string' }
              }
            }
          }
        }
      }
    });

    setFinishStatus('Profiel opslaan...');
    const tdee = data.tdee_source === 'berekend' ? computedTDEE() : parseInt(data.tdee);
    const target = Math.round(tdee * 0.8);
    const protein = Math.round(parseFloat(data.weight_kg) * 2.0);
    const fatCals = Math.round(target * 0.25);
    const fat = Math.round(fatCals / 9);
    const carbCals = target - (protein * 4) - fatCals;
    const carbs = Math.round(carbCals / 4);

    const u = await base44.auth.me();
    const existing = await base44.entities.UserProfile.filter({ created_by: u.email });
    const profileData = {
      ...data,
      tdee, target_calories: target,
      protein_target_g: protein, carbs_target_g: carbs, fat_target_g: fat,
      age: parseInt(data.age),
      weight_kg: parseFloat(data.weight_kg),
      height_cm: parseFloat(data.height_cm),
      slaap_uren: parseFloat(data.slaap_uren),
      stress_niveau: parseInt(data.stress_niveau),
      cut_start_date: new Date().toISOString().split('T')[0],
      onboarding_done: true,
      training_methode: aiResult?.trainings_methode || 'kracht',
      supplement_advies: aiResult?.supplement_advies || [],
      supplement_advies_gegenereerd_op: new Date().toISOString(),
    };

    if (existing.length > 0) {
      await base44.entities.UserProfile.update(existing[0].id, profileData);
    } else {
      await base44.entities.UserProfile.create(profileData);
    }
    navigate('/');
  }

  const stepLabels = ['Profiel', 'Activiteit', 'Doelgroep', 'Training', 'Gezondheid', 'Supplementen', 'TDEE', 'Voeding'];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl text-foreground">Sportfit Plus</span>
        </div>

        {/* Progress */}
        <div className="mb-2 flex gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-primary' : 'bg-secondary'}`} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mb-6">
          Stap {step + 1} van {STEPS.length}: <span className="text-foreground font-medium">{stepLabels[step]}</span>
        </p>

        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">

          {/* Step 0: Profiel */}
          {step === 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-1">Jouw profiel</h2>
              <p className="text-muted-foreground mb-6 text-sm">Basisgegevens voor nauwkeurige TDEE-berekening</p>
              <div className="space-y-4">
                <div className="flex gap-3">
                  {['man', 'vrouw'].map(g => (
                    <button key={g} onClick={() => update('gender', g)}
                      className={`flex-1 py-3 rounded-xl border font-medium transition-all ${data.gender === g ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
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
                        className="flex-1 bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
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
              <h2 className="text-2xl font-bold mb-1">Activiteitsniveau</h2>
              <p className="text-muted-foreground mb-4 text-sm">Sport, beweging en dagelijkse levensstijl</p>
              <div className="space-y-2 mb-5">
                {ACTIVITY_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => update('activity_level', opt.value)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${data.activity_level === opt.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}>
                    <p className={`font-medium text-sm ${data.activity_level === opt.value ? 'text-primary' : 'text-foreground'}`}>{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>
              <p className="text-sm font-medium text-foreground mb-2">Levensstijl</p>
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
              <h2 className="text-2xl font-bold mb-1">Jouw niveau</h2>
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

          {/* Step 3: Training */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-1">Jouw training</h2>
              <p className="text-muted-foreground mb-5 text-sm">AI kiest de beste trainingsmethode voor jou</p>
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Hoeveel dagen per week?</label>
                  <div className="flex gap-2 flex-wrap">
                    {[2, 3, 4, 5, 6].map(f => (
                      <button key={f} onClick={() => update('training_frequentie', f)}
                        className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${data.training_frequentie === f ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                        {f}x/week
                      </button>
                    ))}
                  </div>
                </div>
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
                <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">AI bepaalt automatisch de beste trainingsmethode op basis van jouw volledige profiel.</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Gezondheid */}
          {step === 4 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Heart className="w-5 h-5 text-destructive" />
                <h2 className="text-2xl font-bold">Gezondheid & doelen</h2>
              </div>
              <p className="text-muted-foreground mb-5 text-sm">Dit helpt ons gepersonaliseerd advies te geven</p>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Slaap: <span className="text-primary">{data.slaap_uren} uur</span>
                    </label>
                    <input type="range" min={4} max={12} step={0.5} value={data.slaap_uren}
                      onChange={e => update('slaap_uren', parseFloat(e.target.value))}
                      className="w-full accent-primary" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>4u</span><span>8u (ideaal)</span><span>12u</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Stress: <span className={data.stress_niveau >= 7 ? 'text-destructive' : data.stress_niveau >= 5 ? 'text-accent' : 'text-primary'}>{data.stress_niveau}/10</span>
                    </label>
                    <input type="range" min={1} max={10} step={1} value={data.stress_niveau}
                      onChange={e => update('stress_niveau', parseInt(e.target.value))}
                      className="w-full accent-primary" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Laag</span><span>Hoog</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Voedingspatroon</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { v: 'omnivoor', l: '🍖 Omnivoor' },
                      { v: 'vegetarisch', l: '🥗 Vegetarisch' },
                      { v: 'veganistisch', l: '🌱 Veganistisch' },
                      { v: 'pescotarisch', l: '🐟 Pescotarisch' },
                      { v: 'keto', l: '🥑 Keto' },
                      { v: 'anders', l: '🍽️ Anders' },
                    ].map(({ v, l }) => (
                      <button key={v} onClick={() => update('voedingspatroon', v)}
                        className={`p-2.5 rounded-xl border text-xs font-medium transition-all text-center ${data.voedingspatroon === v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Jouw doelen (meerdere mogelijk)</label>
                  <div className="flex flex-wrap gap-2">
                    {GEZONDHEIDS_DOELEN.map(d => (
                      <ToggleChip key={d.value} label={d.label}
                        selected={(data.gezondheids_doelen || []).includes(d.value)}
                        onClick={() => toggleArray('gezondheids_doelen', d.value)} />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Blessures of klachten (optioneel)</label>
                  <input type="text" value={data.blessures_klachten}
                    onChange={e => update('blessures_klachten', e.target.value)}
                    placeholder="Bijv. knieklacht, rugpijn, tennisarm..."
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Supplementen */}
          {step === 5 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FlaskConical className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-bold">Supplementen</h2>
              </div>
              <p className="text-muted-foreground mb-5 text-sm">Op basis hiervan + onze kennisbank genereert de AI jouw persoonlijk supplementadvies</p>

              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Wat wil je bereiken met supplementen?</label>
                  <div className="flex flex-wrap gap-2">
                    {SUPPLEMENT_DOELEN.map(d => (
                      <ToggleChip key={d.value} label={d.label}
                        selected={(data.supplement_doelen || []).includes(d.value)}
                        onClick={() => toggleArray('supplement_doelen', d.value)} />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Welke supplementen gebruik je al? (optioneel)</label>
                  <textarea value={data.huidige_supplementen}
                    onChange={e => update('huidige_supplementen', e.target.value)}
                    placeholder="Bijv. whey proteïne, creatine, vitamine D..."
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>

                <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-foreground mb-1">Hoe werkt het persoonlijk supplementadvies?</p>
                    <p className="text-xs text-muted-foreground">Na het afronden analyseert AI jouw volledige profiel én onze actuele supplementen-kennisbank. Je krijgt een geprioriteerde lijst met aanbevelingen, inclusief timing en dosering — specifiek op jou afgestemd.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: TDEE */}
          {step === 6 && (
            <div>
              <h2 className="text-2xl font-bold mb-1">Jouw TDEE</h2>
              <p className="text-muted-foreground mb-6 text-sm">Totale dagelijkse energiebehoefte</p>
              <div className="flex gap-3 mb-6">
                {[
                  { value: 'berekend', label: 'Automatisch' },
                  { value: 'handmatig', label: 'Handmatig' },
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
                  <p className="text-sm text-muted-foreground mb-3">Vul je TDEE in van een externe calculator</p>
                  <input type="number" value={data.tdee} onChange={e => update('tdee', e.target.value)}
                    placeholder="bijv. 2800"
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-2" />
                  {data.tdee && (
                    <p className="text-xs text-muted-foreground">Cut doel: <span className="text-primary font-medium">{Math.round(parseInt(data.tdee) * 0.8)} kcal (-20%)</span></p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 7: Voedingsmodus */}
          {step === 7 && (
            <div>
              <h2 className="text-2xl font-bold mb-1">Voeding bijhouden</h2>
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
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              )}

              {/* Samenvatting */}
              <div className="mt-6 bg-secondary/40 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground mb-2">📋 JOUW PROFIEL SAMENVATTING</p>
                {[
                  { l: 'Geslacht', v: data.gender },
                  { l: 'Leeftijd', v: `${data.age} jaar` },
                  { l: 'Activiteit', v: data.activity_level?.replace('_', ' ') },
                  { l: 'Doelgroep', v: data.goal_group },
                  { l: 'Training', v: `${data.training_frequentie}x/week, ${data.training_locatie}` },
                  { l: 'Slaap', v: `${data.slaap_uren} uur` },
                  { l: 'Doelen', v: data.gezondheids_doelen?.slice(0, 3).join(', ') || '-' },
                  { l: 'Suppl. doelen', v: data.supplement_doelen?.slice(0, 3).join(', ') || '-' },
                ].map(({ l, v }) => (
                  <div key={l} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{l}</span>
                    <span className="text-foreground font-medium capitalize">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && !finishing && (
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
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all disabled:opacity-70">
                {finishing ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Profiel aanmaken...</span>
                    </div>
                    {finishStatus && <p className="text-xs opacity-70">{finishStatus}</p>}
                  </div>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Profiel opslaan & starten</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}