import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Dumbbell, Clock, BarChart2, ChevronDown, ChevronUp, Lock, PlayCircle, User } from 'lucide-react';
import WorkoutLogger from '@/components/schemas/WorkoutLogger';
import AiSchemaGenerator from '@/components/schemas/AiSchemaGenerator';
import CustomSchemaList from '@/components/schemas/CustomSchemaList';

const SCHEMAS = {
  beginner: {
    label: 'Beginner',
    emoji: '🌱',
    desc: 'Full-body 3x per week, perfect voor wie net begint met droogtrainen',
    weken: '8-12 weken',
    schema: [
      {
        dag: 'Dag A – Full Body', oefeningen: [
          { naam: 'Squat', sets: '3x8-10', rust: '2 min', tip: 'Focus op techniek, niet gewicht' },
          { naam: 'Bankdrukken', sets: '3x8-10', rust: '90s', tip: 'Schouderbladen samenknijpen' },
          { naam: 'Deadlift', sets: '3x6-8', rust: '2-3 min', tip: 'Rug recht houden' },
          { naam: 'Lat-pulldown', sets: '3x10-12', rust: '90s', tip: 'Ellebogen naar beneden trekken' },
          { naam: 'Dumbbell Lunges', sets: '3x10/been', rust: '90s', tip: 'Knie raakt bijna de grond' },
          { naam: 'Plank', sets: '3x30-45s', rust: '60s', tip: 'Kern aanspannen, niet doorzakken' },
        ]
      },
      {
        dag: 'Dag B – Full Body', oefeningen: [
          { naam: 'Goblet Squat', sets: '3x10-12', rust: '90s', tip: 'Dumbell voor borst houden' },
          { naam: 'Cable Row', sets: '3x10-12', rust: '90s', tip: 'Rug recht, ellebogen langs lichaam' },
          { naam: 'DB Shoulder Press', sets: '3x10-12', rust: '90s', tip: 'Geen nekpijn, ellebogen 45°' },
          { naam: 'Leg Press', sets: '3x10-15', rust: '90s', tip: 'Niet te diep met pijn in knie' },
          { naam: 'DB Bicep Curl', sets: '3x12', rust: '60s', tip: 'Bewust langzaam neerlaten' },
          { naam: 'Tricep Pushdown', sets: '3x12', rust: '60s', tip: 'Ellebogen langs het lichaam' },
        ]
      },
    ],
    cardio: 'LISS cardio 2-3x per week, 30-45 min wandelen/fietsen op lage intensiteit (60-70% max HF)',
    vrijIsPremium: false,
  },
  gevorderd: {
    label: 'Gevorderd',
    emoji: '💪',
    desc: 'Upper/Lower split 4x per week, ideaal voor wie al 1+ jaar traint',
    weken: '10-16 weken',
    schema: [
      {
        dag: 'Dag 1 – Upper (Kracht)', oefeningen: [
          { naam: 'Barbell Bench Press', sets: '4x4-6', rust: '3 min', tip: 'Progressieve overbelasting prioriteit' },
          { naam: 'Weighted Pull-ups', sets: '4x4-6', rust: '3 min', tip: 'Volledig uitstrekken onderaan' },
          { naam: 'Overhead Press', sets: '3x6-8', rust: '2 min', tip: 'Core aanspannen, neutraal rug' },
          { naam: 'Barbell Row', sets: '3x6-8', rust: '2 min', tip: 'Borst naar de bar, niet andersom' },
          { naam: 'Incline DB Press', sets: '3x8-10', rust: '90s', tip: '30° hoek voor borstdeel' },
        ]
      },
      {
        dag: 'Dag 2 – Lower (Kracht)', oefeningen: [
          { naam: 'Back Squat', sets: '4x4-6', rust: '3-4 min', tip: 'Diep gaan indien mobiliteit het toelaat' },
          { naam: 'Romanian Deadlift', sets: '4x6-8', rust: '2-3 min', tip: 'Rug recht, hamstrings voelen rekken' },
          { naam: 'Leg Press', sets: '3x8-10', rust: '2 min', tip: 'Voeten schouderbreedte uit elkaar' },
          { naam: 'Walking Lunges', sets: '3x10/been', rust: '90s', tip: 'Dumbbells voor extra weerstand' },
          { naam: 'Calf Raises', sets: '4x15-20', rust: '60s', tip: 'Langzaam neerlaten = beter resultaat' },
        ]
      },
    ],
    cardio: '2x LISS (40-60 min) + optioneel 1x HIIT (20 min, 30s sprint / 90s rust) per week',
    vrijIsPremium: false,
  },
  vrouw: {
    label: 'Vrouw specifiek',
    emoji: '👩',
    desc: 'Glute-focus 3-4x per week, hormonaal aangepast voor vrouwen',
    weken: '10-14 weken',
    schema: [
      {
        dag: 'Dag 1 – Lower Body Focus', oefeningen: [
          { naam: 'Hip Thrust', sets: '4x10-12', rust: '90s', tip: 'Kin op borst, core strak' },
          { naam: 'Bulgarian Split Squat', sets: '3x10/been', rust: '2 min', tip: 'Achterste voet op bank' },
          { naam: 'Cable Kickback', sets: '3x15', rust: '60s', tip: 'Controlled movement' },
          { naam: 'Romanian Deadlift', sets: '3x10-12', rust: '90s', tip: 'Voel de hamstrings strekken' },
          { naam: 'Adductor Machine', sets: '3x15', rust: '60s', tip: 'Langzaam bewegen' },
        ]
      },
      {
        dag: 'Dag 2 – Upper Body', oefeningen: [
          { naam: 'Lat Pulldown', sets: '4x10-12', rust: '90s', tip: 'Ellebogen naar beneden' },
          { naam: 'DB Shoulder Press', sets: '3x10-12', rust: '90s', tip: 'Halters niet te zwaar' },
          { naam: 'Cable Row', sets: '3x12', rust: '90s', tip: 'Schouderbladen samenknijpen' },
          { naam: 'DB Lateral Raise', sets: '3x15', rust: '60s', tip: 'Ellebogen licht gebogen' },
          { naam: 'Push-ups', sets: '3x max', rust: '60s', tip: 'Borst naar de grond' },
        ]
      },
    ],
    cardio: 'Wandelen 8000-10.000 stappen/dag is effectiever dan intensieve cardio voor vetverbranding tijdens hormoon-fluctuaties',
    vrijIsPremium: false,
  },
  '50plus': {
    label: '50+ Schema',
    emoji: '🏅',
    desc: 'Veilig en effectief, hogere rust, behoud van spiermassa met leeftijd',
    weken: '12-20 weken',
    schema: [
      {
        dag: 'Dag 1 – Full Body Kracht', oefeningen: [
          { naam: 'Leg Press (machine)', sets: '3x10-12', rust: '2-3 min', tip: 'Veiliger dan squat voor rug/knie' },
          { naam: 'Chest Press (machine)', sets: '3x10-12', rust: '2 min', tip: 'Controleer beweging' },
          { naam: 'Seated Row', sets: '3x10-12', rust: '2 min', tip: 'Rug recht houden' },
          { naam: 'Leg Curl', sets: '3x12', rust: '90s', tip: 'Behoud van hamstringkracht' },
          { naam: 'Core: Dead Bug', sets: '3x8/kant', rust: '60s', tip: 'Essentieel voor rugpijn preventie' },
        ]
      },
    ],
    cardio: 'LISS wandelen 30-45 min, 4-5x per week. Let op herstel: minimaal 48u tussen krachttraining',
    vrijIsPremium: false,
  },
  atleet: {
    label: 'Atleet',
    emoji: '🏆',
    desc: 'Behoud prestaties, minimaal spierverlies, periodisering',
    weken: 'Per competitieseizoen',
    schema: [
      {
        dag: 'Dag 1 – Kracht + Power', oefeningen: [
          { naam: 'Power Clean', sets: '4x4', rust: '3 min', tip: 'Explosiviteit behouden tijdens cut' },
          { naam: 'Front Squat', sets: '4x4-5', rust: '3-4 min', tip: 'Upright torso voor sport-specificiteit' },
          { naam: 'Bench Press', sets: '3x5', rust: '3 min', tip: 'Kracht behouden' },
          { naam: 'Pull-ups', sets: '4x5-6', rust: '2-3 min', tip: 'Gewicht toevoegen indien nodig' },
          { naam: 'Bulgarian Split Squat', sets: '3x8/been', rust: '2 min', tip: 'Functionaliteit en balans' },
        ]
      },
    ],
    cardio: 'Sport-specifieke cardio behouden. Voeg geen extra steady-state toe — atleten hebben al voldoende NEAT/activiteit',
    vrijIsPremium: false,
  },
};

export default function Schemas() {
  const [tab, setTab] = useState('templates');
  const [selected, setSelected] = useState('beginner');
  const [openDag, setOpenDag] = useState(0);
  const [loggerDag, setLoggerDag] = useState(null);
  const { profile } = useAuth();
  const schema = SCHEMAS[selected];

  return (
    <div className="p-6 pb-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Trainingsschema's</h1>
        <p className="text-muted-foreground text-sm">Op maat gemaakte schema's gebaseerd op wetenschappelijk onderzoek</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('templates')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${tab === 'templates' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}
        >
          <Dumbbell className="w-4 h-4" /> Template schema's
        </button>
        <button
          onClick={() => setTab('eigen')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${tab === 'eigen' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}
        >
          <User className="w-4 h-4" /> Mijn schema's
        </button>
      </div>

      {tab === 'eigen' && <CustomSchemaList />}

      {tab === 'templates' && <>
      {/* AI Schema Generator */}
      <AiSchemaGenerator profile={profile} />

      {/* Doelgroep selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {Object.entries(SCHEMAS).map(([key, s]) => (
          <button key={key} onClick={() => { setSelected(key); setOpenDag(0); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium whitespace-nowrap transition-all ${selected === key ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {/* Schema info */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">{schema.emoji} {schema.label}</h2>
            <p className="text-muted-foreground text-sm mt-1">{schema.desc}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-full">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{schema.weken}</span>
          </div>
        </div>

        {/* Cardio */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">Cardio richtlijn</span>
          </div>
          <p className="text-sm text-muted-foreground">{schema.cardio}</p>
        </div>
      </div>

      {/* Trainingen */}
      {schema.schema.map((dag, i) => (
        <div key={i} className="bg-card border border-border rounded-2xl mb-4 overflow-hidden">
          <button onClick={() => setOpenDag(openDag === i ? -1 : i)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-secondary/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">{dag.dag}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={e => { e.stopPropagation(); setLoggerDag(dag); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-all"
              >
                <PlayCircle className="w-3.5 h-3.5" /> Start
              </button>
              {openDag === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </button>

          {openDag === i && (
            <div className="border-t border-border">
              <div className="grid grid-cols-4 text-xs font-medium text-muted-foreground p-4 pb-2">
                <span>Oefening</span>
                <span className="text-center">Sets × Reps</span>
                <span className="text-center">Rust</span>
                <span>Tip</span>
              </div>
              {dag.oefeningen.map((oe, j) => (
                <div key={j} className={`grid grid-cols-4 gap-2 p-4 py-3 text-sm ${j % 2 === 0 ? 'bg-secondary/30' : ''}`}>
                  <span className="font-medium text-foreground">{oe.naam}</span>
                  <span className="text-center text-primary font-mono text-xs">{oe.sets}</span>
                  <span className="text-center text-muted-foreground text-xs">{oe.rust}</span>
                  <span className="text-muted-foreground text-xs">{oe.tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Workout Logger modal */}
      {loggerDag && (
        <WorkoutLogger
          schemaName={schema.label}
          dag={loggerDag.dag}
          oefeningen={loggerDag.oefeningen}
          onClose={() => setLoggerDag(null)}
        />
      )}

      {/* Premium teaser */}
      <div className="bg-gradient-to-br from-accent/20 to-primary/20 border border-accent/30 rounded-2xl p-6 text-center">
        <Lock className="w-8 h-8 text-accent mx-auto mb-3" />
        <h3 className="font-bold text-foreground mb-2">Premium schema's</h3>
        <p className="text-sm text-muted-foreground mb-4">Krijg toegang tot periodisering-schema's, refeed-dag planning en persoonlijke aanpassingen</p>
        <button className="px-6 py-3 bg-accent text-accent-foreground rounded-xl font-medium text-sm hover:bg-accent/90 transition-all">
          Upgrade naar Premium →
        </button>
      </div>
      </>}
    </div>
  );
}