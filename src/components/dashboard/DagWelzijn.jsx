import { useState } from 'react';
import { DailyLog } from '@/api/entities';
import { Link } from 'react-router-dom';
import { HeartPulse, ChevronRight, CheckCircle2, Moon, Zap } from 'lucide-react';

export default function DagWelzijn({ profile, todayLog, onLogUpdate }) {
  const [saving, setSaving] = useState(false);
  const [mood, setMood] = useState(todayLog?.mood || null);
  const [slaap, setSlaap] = useState(todayLog?.slaap_uren || null);

  const heeftWelzijnData = todayLog?.mood || todayLog?.water_ml > 0;

  async function slaWelzijnOp(nieuweData) {
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    const existing = await DailyLog.getByDate(today);
    if (existing) {
      await DailyLog.update(existing.id, nieuweData);
    } else {
      await DailyLog.create({ log_date: today, ...nieuweData });
    }
    onLogUpdate();
    setSaving(false);
  }

  const moodOpties = [
    { v: 1, label: '😴', desc: 'Uitgeput' },
    { v: 2, label: '😕', desc: 'Moe' },
    { v: 3, label: '😐', desc: 'Neutraal' },
    { v: 4, label: '😊', desc: 'Goed' },
    { v: 5, label: '🔥', desc: 'Top!' },
  ];

  const huidigeEnergie = todayLog?.mood;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
            <HeartPulse className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Welzijn & herstel</h2>
            <p className="text-xs text-muted-foreground">Hoe voel jij je vandaag?</p>
          </div>
        </div>
        <Link to="/welzijn" className="text-xs text-primary flex items-center gap-1 hover:underline shrink-0">
          HRV & trends <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Energieniveau */}
      <div className="mb-4">
        <p className="text-xs font-medium text-muted-foreground mb-2">Energieniveau vandaag</p>
        <div className="flex gap-2">
          {moodOpties.map(({ v, label, desc }) => (
            <button
              key={v}
              onClick={() => {
                setMood(v);
                slaWelzijnOp({ mood: v });
              }}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all ${
                huidigeEnergie === v
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <span className="text-xl">{label}</span>
              <span className="text-xs text-muted-foreground hidden sm:block">{desc}</span>
            </button>
          ))}
        </div>
        {huidigeEnergie && (
          <p className="text-xs text-primary mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Energieniveau opgeslagen
          </p>
        )}
      </div>

      {/* AI welzijns-tip */}
      {profile?.ai_welzijn_advies && (
        <div className="bg-secondary/50 rounded-xl p-4 mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-primary" /> Persoonlijk hersteladvies
          </p>
          <p className="text-sm text-foreground leading-relaxed line-clamp-3">{profile.ai_welzijn_advies}</p>
        </div>
      )}

      <Link to="/welzijn"
        className="block text-center py-2.5 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:border-primary/40 transition-all">
        HRV meten & trends bekijken
      </Link>
    </div>
  );
}
