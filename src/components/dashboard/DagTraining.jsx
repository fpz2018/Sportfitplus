import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Dumbbell, CheckCircle2, Circle, ChevronRight, ArrowRight } from 'lucide-react';

// Welke dag van de week is het? (0=ma, 6=zo)
function dagVanDeWeek() {
  const d = new Date().getDay(); // 0=zo
  return d === 0 ? 6 : d - 1; // omzetten naar 0=ma
}

function bepaalTrainingsdag(profile) {
  const freq = profile?.training_frequentie || 3;
  const methode = profile?.training_methode || 'kracht';
  const dag = dagVanDeWeek(); // 0=ma ... 6=zo

  // Bepaal of het een trainingsdag is op basis van frequentie
  // Verdeel trainingen gelijkmatig over de week
  const trainDagen = [];
  if (freq === 2) trainDagen.push(0, 3); // ma, do
  else if (freq === 3) trainDagen.push(0, 2, 4); // ma, wo, vr
  else if (freq === 4) trainDagen.push(0, 1, 3, 4); // ma, di, do, vr
  else if (freq === 5) trainDagen.push(0, 1, 2, 4, 5); // ma-wo, vr, za
  else if (freq === 6) trainDagen.push(0, 1, 2, 3, 4, 5);
  else if (freq >= 7) trainDagen.push(0, 1, 2, 3, 4, 5, 6);
  else trainDagen.push(0); // 1x per week

  const isTrainingsdag = trainDagen.includes(dag);
  const trainingNummer = trainDagen.indexOf(dag) + 1; // bijv. training 2 van 3

  return { isTrainingsdag, trainingNummer, totaalTrainingen: freq };
}

const METHODE_LABELS = {
  kracht: 'Krachttraining',
  hypertrofie: 'Hypertrofie training',
  hiit: 'HIIT',
  tabata: 'Tabata',
};

export default function DagTraining({ profile, todayLog, onLogUpdate }) {
  const [schema, setSchema] = useState(null);
  const [marking, setMarking] = useState(false);

  const { isTrainingsdag, trainingNummer, totaalTrainingen } = bepaalTrainingsdag(profile);
  const trainingsVoltooid = todayLog?.training_done;

  useEffect(() => {
    // Laad eigen schema als die bestaat
    base44.auth.me().then(u =>
      base44.entities.CustomSchema.filter({ created_by: u.email }, '-created_date', 1).then(schemas => {
        if (schemas.length > 0) setSchema(schemas[0]);
      })
    );
  }, []);

  async function markeerVoltooid() {
    setMarking(true);
    const u = await base44.auth.me();
    const today = new Date().toISOString().split('T')[0];
    const logs = await base44.entities.DailyLog.filter({ created_by: u.email, log_date: today });
    if (logs.length > 0) {
      await base44.entities.DailyLog.update(logs[0].id, { training_done: true, training_type: profile?.training_methode === 'hiit' || profile?.training_methode === 'tabata' ? 'cardio_hiit' : 'kracht' });
    } else {
      await base44.entities.DailyLog.create({ log_date: today, training_done: true, training_type: 'kracht', created_by: u.email });
    }
    onLogUpdate();
    setMarking(false);
  }

  return (
    <div className={`bg-card border rounded-2xl p-5 transition-all ${trainingsVoltooid ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isTrainingsdag ? 'bg-primary/15' : 'bg-secondary'}`}>
            <Dumbbell className={`w-5 h-5 ${isTrainingsdag ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Training vandaag</h2>
            <p className="text-xs text-muted-foreground">
              {isTrainingsdag
                ? `Training ${trainingNummer} van ${totaalTrainingen} · ${METHODE_LABELS[profile?.training_methode] || 'Kracht'}`
                : 'Rustdag — herstel is net zo belangrijk'}
            </p>
          </div>
        </div>
        <Link to="/schemas" className="text-xs text-primary flex items-center gap-1 hover:underline shrink-0">
          Schema <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {isTrainingsdag ? (
        <div>
          {/* Eigen schema preview */}
          {schema?.days?.[0]?.oefeningen?.slice(0, 4).length > 0 && (
            <div className="space-y-2 mb-4">
              {schema.days[0].oefeningen.slice(0, 4).map((oe, i) => (
                <div key={i} className="flex items-center justify-between bg-secondary/50 rounded-xl px-3 py-2 text-sm">
                  <span className="text-foreground font-medium">{oe.naam}</span>
                  <span className="text-xs text-primary font-mono">{oe.sets}</span>
                </div>
              ))}
              {schema.days[0].oefeningen.length > 4 && (
                <p className="text-xs text-muted-foreground text-center">+{schema.days[0].oefeningen.length - 4} oefeningen meer</p>
              )}
            </div>
          )}

          {trainingsVoltooid ? (
            <div className="flex items-center gap-2 text-primary font-medium text-sm bg-primary/10 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-5 h-5" /> Training voltooid! Goed gedaan 💪
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={markeerVoltooid}
                disabled={marking}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-all disabled:opacity-60"
              >
                <Circle className="w-4 h-4" />
                {marking ? 'Opslaan...' : 'Training afgerond'}
              </button>
              <Link to="/schemas"
                className="flex items-center gap-1.5 px-4 py-3 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:border-primary/40 transition-all">
                Bekijk <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-secondary/50 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">
            🛌 <span className="text-foreground font-medium">Rust en herstel.</span> Ga wandelen, slaap goed en eet voldoende eiwitten. Je spieren groeien juist op rustdagen.
          </p>
          {profile?.ai_welzijn_advies && (
            <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">"{profile.ai_welzijn_advies}"</p>
          )}
        </div>
      )}
    </div>
  );
}