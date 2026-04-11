import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { ChevronRight, ChevronLeft, Loader2, Sparkles, Dumbbell } from 'lucide-react';
import { StepHeader, OptionCard, ToggleChip, SliderField, NumberInput } from '@/components/onboarding/OnboardingStep';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { UserProfile, Supplement, KennisArtikel } from '@/api/entities';
import { supabase } from '@/api/supabaseClient';

// ─── Validatieschema's per stap ───────────────────────────────────────────────

const stepSchemas = {
  doel: z.object({
    hoofd_doel: z.string({ required_error: 'Selecteer een hoofddoel' }).min(1, 'Selecteer een hoofddoel'),
  }),
  profiel: z.object({
    gender:     z.string({ required_error: 'Selecteer een geslacht' }).min(1, 'Selecteer een geslacht'),
    age:        z.coerce.number({ required_error: 'Leeftijd verplicht' }).int().min(10, 'Min. 10 jaar').max(120, 'Max. 120 jaar'),
    weight_kg:  z.coerce.number({ required_error: 'Gewicht verplicht' }).min(20, 'Min. 20 kg').max(500, 'Max. 500 kg'),
    height_cm:  z.coerce.number({ required_error: 'Lengte verplicht' }).min(50, 'Min. 50 cm').max(280, 'Max. 280 cm'),
  }),
  leefstijl: z.object({
    activity_level: z.string().min(1, 'Selecteer een activiteitsniveau'),
  }),
  training: z.object({
    training_frequentie: z.coerce.number().min(1, 'Minimaal 1x per week').max(14, 'Maximaal 14x per week'),
  }),
  welzijn: z.object({
    slaap_uren:    z.coerce.number().min(1, 'Min. 1 uur').max(24, 'Max. 24 uur'),
    stress_niveau: z.coerce.number().min(1, 'Min. 1').max(10, 'Max. 10'),
  }),
  voeding: z.object({
    voedingspatroon: z.string().min(1, 'Selecteer een voedingspatroon'),
  }),
  tdee: z.object({}), // TDEE stap heeft geen verplichte velden
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MAIN_GOALS = {
  nl: [
    { value: 'afslanken', icon: '🔥', label: 'Afslanken', desc: 'Vetverlies en een strakker lichaam' },
    { value: 'spieropbouw', icon: '💪', label: 'Spieropbouw', desc: 'Meer spiermassa en kracht' },
    { value: 'gezond_blijven', icon: '❤️', label: 'Gezond blijven', desc: 'Preventie en algemene gezondheid' },
    { value: 'klachten_verminderen', icon: '🩹', label: 'Klachten verminderen', desc: 'Pijn, vermoeidheid of beperkingen aanpakken' },
    { value: 'prestatie_verbeteren', icon: '🏅', label: 'Sportprestatie verbeteren', desc: 'Sneller, sterker, verder' },
    { value: 'energie_verhogen', icon: '⚡', label: 'Meer energie', desc: 'Vitaler en minder moe' },
    { value: 'welzijn', icon: '🧘', label: 'Welzijn & balans', desc: 'Minder stress, beter slapen, meer rust' },
  ],
  en: [
    { value: 'afslanken', icon: '🔥', label: 'Lose fat', desc: 'Fat loss and a leaner body' },
    { value: 'spieropbouw', icon: '💪', label: 'Build muscle', desc: 'More muscle mass and strength' },
    { value: 'gezond_blijven', icon: '❤️', label: 'Stay healthy', desc: 'Prevention and general wellbeing' },
    { value: 'klachten_verminderen', icon: '🩹', label: 'Reduce complaints', desc: 'Address pain, fatigue or limitations' },
    { value: 'prestatie_verbeteren', icon: '🏅', label: 'Improve performance', desc: 'Faster, stronger, further' },
    { value: 'energie_verhogen', icon: '⚡', label: 'More energy', desc: 'More vitality, less fatigue' },
    { value: 'welzijn', icon: '🧘', label: 'Wellbeing & balance', desc: 'Less stress, better sleep, more calm' },
  ],
};

const SUB_GOALS = {
  nl: ['😴 Betere slaap', '🧠 Focus & concentratie', '🛡️ Immuunsysteem', '⚖️ Hormoonbalans', '🔄 Sneller herstel', '🏃 Conditie verbeteren', '🦴 Sterke botten & gewrichten', '🌿 Minder stress'],
  en: ['😴 Better sleep', '🧠 Focus & concentration', '🛡️ Immune system', '⚖️ Hormone balance', '🔄 Faster recovery', '🏃 Improve fitness', '🦴 Strong bones & joints', '🌿 Less stress'],
};

const ACTIVITY_OPTIONS = {
  nl: [
    { value: 'sedentair', label: 'Zittend leven', desc: 'Weinig of geen beweging' },
    { value: 'licht_actief', label: 'Licht actief', desc: '1-3x beweging per week' },
    { value: 'matig_actief', label: 'Matig actief', desc: '3-5x sport per week' },
    { value: 'zeer_actief', label: 'Zeer actief', desc: '6-7x sport per week' },
    { value: 'extreem_actief', label: 'Extreem actief', desc: 'Zwaar werk + dagelijks sporten' },
  ],
  en: [
    { value: 'sedentair', label: 'Sedentary', desc: 'Little or no exercise' },
    { value: 'licht_actief', label: 'Lightly active', desc: 'Exercise 1-3x per week' },
    { value: 'matig_actief', label: 'Moderately active', desc: 'Exercise 3-5x per week' },
    { value: 'zeer_actief', label: 'Very active', desc: 'Exercise 6-7x per week' },
    { value: 'extreem_actief', label: 'Extremely active', desc: 'Hard work + daily exercise' },
  ],
};

const LIFESTYLE_OPTIONS = {
  nl: [
    { value: 'student', icon: '🎓', label: 'Student', desc: 'Veel zitten of fietsen' },
    { value: 'kantoorwerk', icon: '💼', label: 'Kantoorwerk', desc: 'Bureau job, weinig bewegen' },
    { value: 'drukke_baan', icon: '⚡', label: 'Drukke baan', desc: 'Weinig tijd, hoog stress' },
    { value: 'handarbeid', icon: '🔧', label: 'Handarbeid', desc: 'Fysiek werk overdag' },
    { value: 'ouder_thuis', icon: '👶', label: 'Ouder / thuis', desc: 'Thuis, zorgtaken' },
  ],
  en: [
    { value: 'student', icon: '🎓', label: 'Student', desc: 'Lots of sitting or cycling' },
    { value: 'kantoorwerk', icon: '💼', label: 'Office work', desc: 'Desk job, little movement' },
    { value: 'drukke_baan', icon: '⚡', label: 'Busy job', desc: 'Little time, high stress' },
    { value: 'handarbeid', icon: '🔧', label: 'Manual labour', desc: 'Physical work during the day' },
    { value: 'ouder_thuis', icon: '👶', label: 'Parent / home', desc: 'At home, care tasks' },
  ],
};

const FOOD_PATTERNS = {
  nl: [
    { v: 'omnivoor', l: '🍖 Omnivoor' }, { v: 'vegetarisch', l: '🥗 Vegetarisch' },
    { v: 'veganistisch', l: '🌱 Veganistisch' }, { v: 'pescotarisch', l: '🐟 Pescotarisch' },
    { v: 'keto', l: '🥑 Keto' }, { v: 'anders', l: '🍽️ Anders' },
  ],
  en: [
    { v: 'omnivoor', l: '🍖 Omnivore' }, { v: 'vegetarisch', l: '🥗 Vegetarian' },
    { v: 'veganistisch', l: '🌱 Vegan' }, { v: 'pescotarisch', l: '🐟 Pescatarian' },
    { v: 'keto', l: '🥑 Keto' }, { v: 'anders', l: '🍽️ Other' },
  ],
};

const ALLERGIES = {
  nl: ['Gluten', 'Lactose', 'Noten', 'Soja', 'Ei', 'Schaaldieren'],
  en: ['Gluten', 'Lactose', 'Nuts', 'Soy', 'Egg', 'Shellfish'],
};

const RELAXATION_METHODS = {
  nl: ['🧘 Meditatie', '🌳 Wandelen in natuur', '🐾 Yoga', '📚 Lezen', '🎵 Muziek', '🛁 Bad / sauna', '🎨 Creatief bezig zijn', '💆 Massage'],
  en: ['🧘 Meditation', '🌳 Walking in nature', '🐾 Yoga', '📚 Reading', '🎵 Music', '🛁 Bath / sauna', '🎨 Creative hobbies', '💆 Massage'],
};

const SUPPLEMENT_GOALS = {
  nl: ['💪 Spieropbouw', '🔥 Vetverbranding', '🔄 Herstel', '⚡ Energie & focus', '😴 Slaapkwaliteit', '🧘 Stressreductie', '🛡️ Immuunsysteem', '⚖️ Hormoonbalans'],
  en: ['💪 Muscle building', '🔥 Fat burning', '🔄 Recovery', '⚡ Energy & focus', '😴 Sleep quality', '🧘 Stress reduction', '🛡️ Immune system', '⚖️ Hormone balance'],
};

function calcTDEE({ gender, age, weight_kg, height_cm, activity_level }) {
  if (!weight_kg || !height_cm || !age) return 0;
  const bmr = gender === 'vrouw'
    ? 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    : 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  const f = { sedentair: 1.2, licht_actief: 1.375, matig_actief: 1.55, zeer_actief: 1.725, extreem_actief: 1.9 };
  return Math.round(bmr * (f[activity_level] || 1.2));
}

// Step IDs — some are conditionally shown
const ALL_STEPS = ['doel', 'profiel', 'leefstijl', 'training', 'welzijn', 'voeding', 'tdee'];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Onboarding() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { refreshProfile } = useAuth();
  const lang = language || 'en';

  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [finishStatus, setFinishStatus] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const [data, setData] = useState({
    // Doel
    hoofd_doel: null,
    sub_doelen: [],
    // Profiel
    gender: null,
    age: '',
    weight_kg: '',
    height_cm: '',
    // Leefstijl
    activity_level: 'matig_actief',
    lifestyle: 'kantoorwerk',
    sport_type: '',
    // Training
    training_frequentie: 3,
    training_locatie: 'gym',
    training_ervaring: 'beginner',
    // Welzijn
    slaap_uren: 7,
    slaap_kwaliteit: 'matig',
    stress_niveau: 5,
    meditatie_of_ontspanning: false,
    ontspanning_methode: '',
    herstel_prioriteit: false,
    // Gezondheid & voeding
    voedingspatroon: 'omnivoor',
    allergieën: [],
    blessures_klachten: '',
    chronische_aandoeningen: '',
    gezondheids_doelen: [],
    // Supplementen
    supplement_doelen: [],
    huidige_supplementen: '',
    // TDEE
    tdee_source: 'berekend',
    tdee: '',
    nutrition_mode: 'in_app',
    external_app_name: '',
    cut_weeks: 12,
  });

  function up(key, val) {
    setData(p => ({ ...p, [key]: val }));
    // Verwijder validatiefout zodra gebruiker het veld aanpast
    setValidationErrors(e => { const next = { ...e }; delete next[key]; return next; });
  }

  function toggleArr(key, val) {
    setData(p => {
      const arr = p[key] || [];
      return { ...p, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  }

  function validateCurrentStep() {
    const schema = stepSchemas[currentStepId];
    if (!schema) return true;
    const result = schema.safeParse(data);
    if (!result.success) {
      const errors = {};
      result.error.errors.forEach(err => {
        errors[err.path[0]] = err.message;
      });
      setValidationErrors(errors);
      return false;
    }
    setValidationErrors({});
    return true;
  }

  function handleNext() {
    if (!validateCurrentStep()) return;
    setStep(s => Math.min(s + 1, totalSteps - 1));
  }

  // Which steps to show (adaptive)
  const steps = ALL_STEPS;
  const totalSteps = steps.length;
  const currentStepId = steps[step];

  const tdeeCalc = calcTDEE(data);

  const stepLabels = {
    nl: ['Doel', 'Profiel', 'Leefstijl', 'Training', 'Welzijn', 'Voeding', 'TDEE'],
    en: ['Goal', 'Profile', 'Lifestyle', 'Training', 'Wellbeing', 'Nutrition', 'TDEE'],
  };

  const T = {
    nl: {
      title: 'Sportfit Plus',
      stepOf: (s, t) => `Step ${s} of ${t}`,
      back: '← Terug',
      next: 'Volgende →',
      finish: 'Mijn programma starten',
      finishing: 'Programma aanmaken...',
    },
    en: {
      title: 'Sportfit Plus',
      stepOf: (s, t) => `Step ${s} of ${t}`,
      back: '← Back',
      next: 'Next →',
      finish: 'Start my programme',
      finishing: 'Creating your programme...',
    },
  }[lang] || {
    title: 'Sportfit Plus',
    stepOf: (s, t) => `Step ${s} of ${t}`,
    back: '← Back', next: 'Next →', finish: 'Start my programme', finishing: 'Creating...',
  };

  async function finish() {
    if (!validateCurrentStep()) return;
    setFinishing(true);
    setFinishStatus(lang === 'nl' ? 'Kennisbank ophalen...' : 'Loading knowledge base...');

    try {
      const [supplementen, goedgekeurdeArtikelen] = await Promise.all([
        Supplement.list(),
        KennisArtikel.list('approved', 8),
      ]);

      const suppKennis = (supplementen || []).map(s =>
        `${s.naam} (${s.categorie}, Evidence: ${s.evidence_level || '?'}, Dosering: ${s.dosering || '?'}, Timing: ${s.timing || '?'}, Doelen: ${s.doelen?.join(', ') || '-'})`
      ).join('\n');

      const nieuws = (goedgekeurdeArtikelen || []).slice(0, 8).map(a =>
        `[${a.evidence_level || '?'}] ${a.title_en}${a.summary_nl ? ': ' + a.summary_nl.substring(0, 200) : ''}`
      ).join('\n');

      setFinishStatus(lang === 'nl' ? 'AI analyseert jouw profiel...' : 'AI analysing your profile...');

      // Roep de AI aan via Netlify Function
      const { data: { session } } = await supabase.auth.getSession();
      let aiResult = null;
      try {
        const res = await fetch('/api/generateOnboardingAdvice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ profile: data, suppKennis, nieuws, lang }),
        });
        if (res.ok) aiResult = await res.json();
      } catch (aiErr) {
        console.warn('AI advies ophalen mislukt, doorgaan zonder:', aiErr);
      }

      setFinishStatus(lang === 'nl' ? 'Profiel opslaan...' : 'Saving profile...');

      const tdee = data.tdee_source === 'berekend' ? tdeeCalc : parseInt(data.tdee) || tdeeCalc;
      const target = data.hoofd_doel === 'afslanken'
        ? Math.round(tdee * 0.8)
        : data.hoofd_doel === 'spieropbouw'
          ? Math.round(tdee * 1.1)
          : tdee;
      const protein  = Math.round(parseFloat(data.weight_kg) * 2.0);
      const fatCals  = Math.round(target * 0.25);
      const fat      = Math.round(fatCals / 9);
      const carbCals = target - (protein * 4) - fatCals;
      const carbs    = Math.round(carbCals / 4);

      const profileData = {
        gender:          data.gender,
        age:             parseInt(data.age),
        weight_kg:       parseFloat(data.weight_kg),
        height_cm:       parseFloat(data.height_cm),
        activity_level:  data.activity_level,
        slaap_uren:      parseFloat(data.slaap_uren),
        stress_niveau:   parseInt(data.stress_niveau),
        tdee,
        target_calories:  target,
        protein_target_g: protein,
        carbs_target_g:   carbs,
        fat_target_g:     fat,
        onboarding_complete: true,
        ai_welzijn_advies: aiResult?.welzijn_advies || '',
        goal_group: data.gender === 'vrouw'
          ? 'vrouw'
          : parseInt(data.age) >= 50
            ? '50plus'
            : data.training_ervaring === 'gevorderd'
              ? 'gevorderd'
              : 'beginner',
      };

      await UserProfile.upsert(profileData);
      // Forceer dat AuthContext de nieuwe profile-state ophaalt voordat
      // we naar het dashboard navigeren — anders ziet Dashboard nog de
      // oude profile zonder onboarding_complete en stuurt ons terug.
      await refreshProfile();
      navigate('/');
    } catch (err) {
      console.error('Onboarding afronden mislukt:', err);
      setFinishStatus(lang === 'nl' ? 'Er ging iets mis. Probeer opnieuw.' : 'Something went wrong. Please try again.');
      setFinishing(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl text-foreground">{T.title}</span>
        </div>

        {/* Progress bar */}
        <div className="mb-2 flex gap-1">
          {steps.map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-primary' : 'bg-secondary'}`} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mb-6">
          {T.stepOf(step + 1, totalSteps)}: <span className="text-foreground font-medium">{stepLabels[lang]?.[step] || stepLabels.en[step]}</span>
        </p>

        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">

          {/* ── STEP 0: DOEL ─────────────────────────────────────── */}
          {currentStepId === 'doel' && (
            <div>
              <StepHeader
                icon="🎯"
                title={lang === 'nl' ? 'Wat is jouw hoofddoel?' : "What's your main goal?"}
                subtitle={lang === 'nl' ? 'Kies wat het beste bij jou past. Je kunt straks nog meer doelen toevoegen.' : 'Choose what fits you best. You can add more goals later.'}
              />
              <div className="space-y-2 mb-5">
                {(MAIN_GOALS[lang] || MAIN_GOALS.en).map(g => (
                  <OptionCard key={g.value} icon={g.icon} label={g.label} desc={g.desc}
                    selected={data.hoofd_doel === g.value}
                    onClick={() => up('hoofd_doel', g.value)} />
                ))}
              </div>
              {data.hoofd_doel && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">{lang === 'nl' ? 'Aanvullende doelen (optioneel)' : 'Additional goals (optional)'}</p>
                  <div className="flex flex-wrap gap-2">
                    {(SUB_GOALS[lang] || SUB_GOALS.en).map(d => (
                      <ToggleChip key={d} label={d} selected={data.sub_doelen.includes(d)} onClick={() => toggleArr('sub_doelen', d)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 1: PROFIEL ──────────────────────────────────── */}
          {currentStepId === 'profiel' && (
            <div>
              <StepHeader
                icon="👤"
                title={lang === 'nl' ? 'Jouw profiel' : 'Your profile'}
                subtitle={lang === 'nl' ? 'Basisgegevens voor nauwkeurige berekeningen' : 'Basic data for accurate calculations'}
              />
              <div className="space-y-4">
                {/* Gender */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">{lang === 'nl' ? 'Geslacht' : 'Gender'}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { v: 'man', l: lang === 'nl' ? '👨 Man' : '👨 Male' },
                      { v: 'vrouw', l: lang === 'nl' ? '👩 Vrouw' : '👩 Female' },
                      { v: 'anders', l: lang === 'nl' ? '🏳️ Anders' : '🏳️ Other' },
                    ].map(g => (
                      <button key={g.v} onClick={() => up('gender', g.v)}
                        className={`py-3 rounded-xl border font-medium text-sm transition-all ${data.gender === g.v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                        {g.l}
                      </button>
                    ))}
                  </div>
                </div>

                <NumberInput label={lang === 'nl' ? 'Leeftijd' : 'Age'} value={data.age} onChange={v => up('age', v)} placeholder="30" unit={lang === 'nl' ? 'jaar' : 'yrs'} />
                <NumberInput label={lang === 'nl' ? 'Gewicht' : 'Weight'} value={data.weight_kg} onChange={v => up('weight_kg', v)} placeholder="75" unit="kg" />
                <NumberInput label={lang === 'nl' ? 'Lengte' : 'Height'} value={data.height_cm} onChange={v => up('height_cm', v)} placeholder="175" unit="cm" />
              </div>
            </div>
          )}

          {/* ── STEP 2: LEEFSTIJL ────────────────────────────────── */}
          {currentStepId === 'leefstijl' && (
            <div>
              <StepHeader
                icon="🌱"
                title={lang === 'nl' ? 'Leefstijl & activiteit' : 'Lifestyle & activity'}
                subtitle={lang === 'nl' ? 'Hoe actief ben je op een gemiddelde dag?' : 'How active are you on an average day?'}
              />
              <div className="space-y-2 mb-5">
                {(ACTIVITY_OPTIONS[lang] || ACTIVITY_OPTIONS.en).map(opt => (
                  <OptionCard key={opt.value} label={opt.label} desc={opt.desc}
                    selected={data.activity_level === opt.value}
                    onClick={() => up('activity_level', opt.value)} />
                ))}
              </div>
              <p className="text-sm font-medium text-foreground mb-2">{lang === 'nl' ? 'Levensstijl' : 'Lifestyle'}</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {(LIFESTYLE_OPTIONS[lang] || LIFESTYLE_OPTIONS.en).map(opt => (
                  <button key={opt.value} onClick={() => up('lifestyle', opt.value)}
                    className={`text-left p-3 rounded-xl border transition-all ${data.lifestyle === opt.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}>
                    <p className={`font-medium text-xs ${data.lifestyle === opt.value ? 'text-primary' : 'text-foreground'}`}>{opt.icon} {opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'nl' ? 'Welke sport(en) doe je? (optioneel)' : 'Which sport(s) do you do? (optional)'}</label>
                <input type="text" value={data.sport_type} onChange={e => up('sport_type', e.target.value)}
                  placeholder={lang === 'nl' ? 'bijv. hardlopen, zwemmen, fietsen...' : 'e.g. running, swimming, cycling...'}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
          )}

          {/* ── STEP 3: TRAINING ─────────────────────────────────── */}
          {currentStepId === 'training' && (
            <div>
              <StepHeader
                icon="🏋️"
                title={lang === 'nl' ? 'Training' : 'Training'}
                subtitle={lang === 'nl' ? 'AI kiest de beste methode op basis van jouw profiel' : 'AI will select the best method based on your profile'}
              />
              <div className="space-y-5">
                {/* Frequentie */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {lang === 'nl' ? 'Hoeveel dagen per week wil je trainen?' : 'How many days per week do you want to train?'}
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5, 6].map(f => (
                      <button key={f} onClick={() => up('training_frequentie', f)}
                        className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${data.training_frequentie === f ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                        {f}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Ervaring */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">{lang === 'nl' ? 'Hoe lang train je al?' : 'How long have you been training?'}</label>
                    <div className="space-y-1.5">
                      {[
                        { v: 'beginner', l: lang === 'nl' ? '🌱 Beginner' : '🌱 Beginner', d: lang === 'nl' ? '< 1 jaar' : '< 1 year' },
                        { v: 'gemiddeld', l: lang === 'nl' ? '💪 Gemiddeld' : '💪 Intermediate', d: lang === 'nl' ? '1–3 jaar' : '1–3 years' },
                        { v: 'gevorderd', l: lang === 'nl' ? '🏆 Gevorderd' : '🏆 Advanced', d: lang === 'nl' ? '3+ jaar' : '3+ years' },
                      ].map(({ v, l, d }) => (
                        <button key={v} onClick={() => up('training_ervaring', v)}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${data.training_ervaring === v ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}>
                          <p className={`font-medium text-xs ${data.training_ervaring === v ? 'text-primary' : 'text-foreground'}`}>{l}</p>
                          <p className="text-xs text-muted-foreground">{d}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Locatie */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">{lang === 'nl' ? 'Waar train je?' : 'Where do you train?'}</label>
                    <div className="space-y-1.5">
                      {[
                        { v: 'gym', l: '🏋️ Gym', d: lang === 'nl' ? 'Met apparatuur' : 'With equipment' },
                        { v: 'thuis', l: lang === 'nl' ? '🏠 Thuis' : '🏠 Home', d: lang === 'nl' ? 'Zonder apparatuur' : 'Without equipment' },
                      ].map(({ v, l, d }) => (
                        <button key={v} onClick={() => up('training_locatie', v)}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${data.training_locatie === v ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}>
                          <p className={`font-medium text-xs ${data.training_locatie === v ? 'text-primary' : 'text-foreground'}`}>{l}</p>
                          <p className="text-xs text-muted-foreground">{d}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Blessures */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'nl' ? 'Blessures of lichamelijke klachten? (optioneel)' : 'Injuries or physical complaints? (optional)'}</label>
                  <input type="text" value={data.blessures_klachten} onChange={e => up('blessures_klachten', e.target.value)}
                    placeholder={lang === 'nl' ? 'bijv. knieklacht, rugpijn...' : 'e.g. knee pain, back pain...'}
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>

                <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    {lang === 'nl'
                      ? 'AI bepaalt automatisch de beste trainingsmethode (kracht, hypertrofie, HIIT of tabata) op basis van jouw volledige profiel.'
                      : 'AI will automatically determine the best training method (strength, hypertrophy, HIIT or tabata) based on your complete profile.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: WELZIJN ──────────────────────────────────── */}
          {currentStepId === 'welzijn' && (
            <div>
              <StepHeader
                icon="🧘"
                title={lang === 'nl' ? 'Herstel & Welzijn' : 'Recovery & Wellbeing'}
                subtitle={lang === 'nl' ? 'Slaap, stress en ontspanning zijn cruciaal voor resultaat' : 'Sleep, stress and relaxation are crucial for results'}
              />
              <div className="space-y-5">
                {/* Slaap */}
                <SliderField
                  label={lang === 'nl' ? 'Gemiddeld aantal uren slaap' : 'Average hours of sleep'}
                  value={`${data.slaap_uren} ${lang === 'nl' ? 'uur' : 'hrs'}`}
                  min={3} max={12} step={0.5}
                  onChange={v => up('slaap_uren', v)}
                  leftLabel="3h" rightLabel="12h"
                />

                {/* Slaapkwaliteit */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">{lang === 'nl' ? 'Hoe slaap je?' : 'How do you sleep?'}</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { v: 'slecht', l: lang === 'nl' ? '😫 Slecht' : '😫 Poor' },
                      { v: 'matig', l: lang === 'nl' ? '😐 Matig' : '😐 Fair' },
                      { v: 'goed', l: lang === 'nl' ? '😊 Goed' : '😊 Good' },
                      { v: 'uitstekend', l: lang === 'nl' ? '😴 Super' : '😴 Great' },
                    ].map(({ v, l }) => (
                      <button key={v} onClick={() => up('slaap_kwaliteit', v)}
                        className={`py-2.5 rounded-xl border text-xs font-medium transition-all text-center ${data.slaap_kwaliteit === v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stress */}
                <SliderField
                  label={lang === 'nl' ? 'Stressniveau' : 'Stress level'}
                  value={`${data.stress_niveau}/10`}
                  min={1} max={10} step={1}
                  onChange={v => up('stress_niveau', v)}
                  leftLabel={lang === 'nl' ? 'Ontspannen' : 'Relaxed'}
                  rightLabel={lang === 'nl' ? 'Veel stress' : 'High stress'}
                  valueColor={data.stress_niveau >= 7 ? 'text-destructive' : data.stress_niveau >= 5 ? 'text-accent' : 'text-primary'}
                />

                {/* Ontspanning */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {lang === 'nl' ? 'Doe je al aan actieve ontspanning of meditatie?' : 'Do you already practise active relaxation or meditation?'}
                  </label>
                  <div className="flex gap-2 mb-3">
                    {[
                      { v: true, l: lang === 'nl' ? '✅ Ja' : '✅ Yes' },
                      { v: false, l: lang === 'nl' ? '❌ Nee' : '❌ No' },
                    ].map(({ v, l }) => (
                      <button key={String(v)} onClick={() => up('meditatie_of_ontspanning', v)}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${data.meditatie_of_ontspanning === v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                  {data.meditatie_of_ontspanning && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">{lang === 'nl' ? 'Wat doe je? (meerdere mogelijk)' : 'What do you do? (multiple possible)'}</p>
                      <div className="flex flex-wrap gap-2">
                        {(RELAXATION_METHODS[lang] || RELAXATION_METHODS.en).map(m => (
                          <ToggleChip key={m} label={m}
                            selected={data.ontspanning_methode?.includes(m)}
                            onClick={() => {
                              const cur = data.ontspanning_methode ? data.ontspanning_methode.split(',').map(s => s.trim()).filter(Boolean) : [];
                              const updated = cur.includes(m) ? cur.filter(x => x !== m) : [...cur, m];
                              up('ontspanning_methode', updated.join(', '));
                            }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Herstel prioriteit */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {lang === 'nl' ? 'Is sneller herstel een belangrijk thema voor jou?' : 'Is faster recovery an important theme for you?'}
                  </label>
                  <div className="flex gap-2">
                    {[
                      { v: true, l: lang === 'nl' ? '✅ Ja, absoluut' : '✅ Yes, definitely' },
                      { v: false, l: lang === 'nl' ? 'Niet speciaal' : 'Not particularly' },
                    ].map(({ v, l }) => (
                      <button key={String(v)} onClick={() => up('herstel_prioriteit', v)}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${data.herstel_prioriteit === v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 5: VOEDING ──────────────────────────────────── */}
          {currentStepId === 'voeding' && (
            <div>
              <StepHeader
                icon="🥗"
                title={lang === 'nl' ? 'Voeding & supplementen' : 'Nutrition & supplements'}
                subtitle={lang === 'nl' ? 'Voor gepersonaliseerde maaltijden en supplementadvies' : 'For personalised meals and supplement advice'}
              />
              <div className="space-y-5">
                {/* Voedingspatroon */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">{lang === 'nl' ? 'Eetpatroon' : 'Dietary pattern'}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(FOOD_PATTERNS[lang] || FOOD_PATTERNS.en).map(({ v, l }) => (
                      <button key={v} onClick={() => up('voedingspatroon', v)}
                        className={`p-2.5 rounded-xl border text-xs font-medium transition-all text-center ${data.voedingspatroon === v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Allergieën */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">{lang === 'nl' ? 'Allergieën of intoleranties?' : 'Allergies or intolerances?'}</label>
                  <div className="flex flex-wrap gap-2">
                    {(ALLERGIES[lang] || ALLERGIES.en).map(a => (
                      <ToggleChip key={a} label={a} selected={data.allergieën.includes(a)} onClick={() => toggleArr('allergieën', a)} />
                    ))}
                  </div>
                </div>

                {/* Supplement doelen */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">{lang === 'nl' ? 'Wat wil je bereiken met supplementen?' : 'What do you want to achieve with supplements?'}</label>
                  <div className="flex flex-wrap gap-2">
                    {(SUPPLEMENT_GOALS[lang] || SUPPLEMENT_GOALS.en).map(d => (
                      <ToggleChip key={d} label={d} selected={data.supplement_doelen.includes(d)} onClick={() => toggleArr('supplement_doelen', d)} />
                    ))}
                  </div>
                </div>

                {/* Huidige supplementen */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'nl' ? 'Welke supplementen gebruik je al? (optioneel)' : 'Which supplements do you already use? (optional)'}</label>
                  <textarea value={data.huidige_supplementen} onChange={e => up('huidige_supplementen', e.target.value)}
                    placeholder={lang === 'nl' ? 'bijv. whey, creatine, vitamine D...' : 'e.g. whey, creatine, vitamin D...'}
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground resize-none h-16 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>

                {/* Chronische aandoeningen */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{lang === 'nl' ? 'Chronische aandoeningen? (optioneel)' : 'Chronic conditions? (optional)'}</label>
                  <input type="text" value={data.chronische_aandoeningen} onChange={e => up('chronische_aandoeningen', e.target.value)}
                    placeholder={lang === 'nl' ? 'bijv. diabetes, hypertensie, hypothyreoïdie...' : 'e.g. diabetes, hypertension, hypothyroidism...'}
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 6: TDEE ─────────────────────────────────────── */}
          {currentStepId === 'tdee' && (
            <div>
              <StepHeader
                icon="⚡"
                title={lang === 'nl' ? 'Energiebehoefte' : 'Energy needs'}
                subtitle={lang === 'nl' ? 'Je dagelijkse caloriebehoefte (TDEE) en voedingsdoel' : 'Your daily calorie needs (TDEE) and nutrition target'}
              />
              <div className="flex gap-3 mb-5">
                {[
                  { value: 'berekend', label: lang === 'nl' ? '🤖 Automatisch' : '🤖 Automatic' },
                  { value: 'handmatig', label: lang === 'nl' ? '✍️ Handmatig' : '✍️ Manual' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => up('tdee_source', opt.value)}
                    className={`flex-1 py-3 rounded-xl border font-medium text-sm transition-all ${data.tdee_source === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>

              {data.tdee_source === 'berekend' ? (
                <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6 text-center mb-5">
                  <p className="text-muted-foreground text-sm mb-1">{lang === 'nl' ? 'Berekende TDEE' : 'Calculated TDEE'}</p>
                  <p className="text-5xl font-bold text-primary">{tdeeCalc}</p>
                  <p className="text-muted-foreground text-sm mt-1">kcal / {lang === 'nl' ? 'dag' : 'day'}</p>
                  {data.hoofd_doel === 'afslanken' && (
                    <p className="text-xs text-muted-foreground mt-3">{lang === 'nl' ? 'Cut doel:' : 'Cut goal:'} <span className="text-primary font-medium">{Math.round(tdeeCalc * 0.8)} kcal (-20%)</span></p>
                  )}
                  {data.hoofd_doel === 'spieropbouw' && (
                    <p className="text-xs text-muted-foreground mt-3">{lang === 'nl' ? 'Bulk doel:' : 'Bulk goal:'} <span className="text-primary font-medium">{Math.round(tdeeCalc * 1.1)} kcal (+10%)</span></p>
                  )}
                </div>
              ) : (
                <div className="mb-5">
                  <p className="text-sm text-muted-foreground mb-3">{lang === 'nl' ? 'Vul je TDEE in van een externe calculator' : 'Enter your TDEE from an external calculator'}</p>
                  <input type="number" value={data.tdee} onChange={e => up('tdee', e.target.value)}
                    placeholder="2500"
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-2" />
                </div>
              )}

              {/* Voedingsmodus */}
              <p className="text-sm font-medium text-foreground mb-2">{lang === 'nl' ? 'Hoe wil je voeding bijhouden?' : 'How do you want to track nutrition?'}</p>
              <div className="space-y-2 mb-4">
                {[
                  { value: 'in_app', label: lang === 'nl' ? '🥗 In deze app' : '🥗 In this app', desc: lang === 'nl' ? 'Onze voedingsplannen en database' : 'Our meal plans and database' },
                  { value: 'externe_app', label: lang === 'nl' ? '📱 Externe app' : '📱 External app', desc: 'MyFitnessPal, Cronometer, ...' },
                ].map(opt => (
                  <OptionCard key={opt.value} label={opt.label} desc={opt.desc}
                    selected={data.nutrition_mode === opt.value}
                    onClick={() => up('nutrition_mode', opt.value)} />
                ))}
              </div>
              {data.nutrition_mode === 'externe_app' && (
                <input type="text" value={data.external_app_name} onChange={e => up('external_app_name', e.target.value)}
                  placeholder="MyFitnessPal"
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4" />
              )}

              {/* Samenvatting */}
              <div className="bg-secondary/40 rounded-xl p-4 space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground mb-2">📋 {lang === 'nl' ? 'SAMENVATTING' : 'SUMMARY'}</p>
                {[
                  { l: lang === 'nl' ? 'Doel' : 'Goal', v: data.hoofd_doel?.replace(/_/g, ' ') },
                  { l: lang === 'nl' ? 'Geslacht' : 'Gender', v: data.gender },
                  { l: lang === 'nl' ? 'Leeftijd' : 'Age', v: data.age ? `${data.age} ${lang === 'nl' ? 'jaar' : 'yrs'}` : '-' },
                  { l: lang === 'nl' ? 'Activiteit' : 'Activity', v: data.activity_level?.replace(/_/g, ' ') },
                  { l: lang === 'nl' ? 'Training' : 'Training', v: `${data.training_frequentie}x/wk, ${data.training_locatie}` },
                  { l: lang === 'nl' ? 'Slaap' : 'Sleep', v: `${data.slaap_uren}h (${data.slaap_kwaliteit})` },
                  { l: lang === 'nl' ? 'Stress' : 'Stress', v: `${data.stress_niveau}/10` },
                  { l: lang === 'nl' ? 'Eetpatroon' : 'Diet', v: data.voedingspatroon },
                ].filter(x => x.v).map(({ l, v }) => (
                  <div key={l} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{l}</span>
                    <span className="text-foreground font-medium capitalize">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Validatiefouten ──────────────────────────────────── */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="mt-4 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 space-y-1">
              {Object.values(validationErrors).map((msg, i) => (
                <p key={i} className="text-sm text-destructive">{msg}</p>
              ))}
            </div>
          )}

          {/* ── Navigation ───────────────────────────────────────── */}
          <div className="flex gap-3 mt-6">
            {step > 0 && !finishing && (
              <button onClick={() => { setValidationErrors({}); setStep(s => s - 1); }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all text-sm font-medium">
                <ChevronLeft className="w-4 h-4" /> {T.back}
              </button>
            )}
            {step < totalSteps - 1 ? (
              <button onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all">
                {T.next} <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={finish} disabled={finishing}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all disabled:opacity-70">
                {finishing ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{T.finishing}</span>
                    </div>
                    {finishStatus && <p className="text-xs opacity-70">{finishStatus}</p>}
                  </div>
                ) : (
                  <><Sparkles className="w-4 h-4" /> {T.finish}</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}