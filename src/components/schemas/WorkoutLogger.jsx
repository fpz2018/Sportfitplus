import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Check, Plus, Minus, Save, X, History, ChevronDown, ChevronUp, Timer } from 'lucide-react';
import RestTimer from './RestTimer';

export default function WorkoutLogger({ schemaName, dag, oefeningen, onClose }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [exercises, setExercises] = useState(
    oefeningen.map(oe => ({
      naam: oe.naam,
      sets: Array.from({ length: 3 }, (_, i) => ({ set_nr: i + 1, gewicht_kg: '', reps: '', voltooid: false })),
    }))
  );
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [startTime] = useState(Date.now());
  const [showTimer, setShowTimer] = useState(false);
  const [rustDuur, setRustDuur] = useState(90);

  useEffect(() => {
    loadHistory();
    loadTodayLog();
  }, []);

  async function loadHistory() {
    const u = await base44.auth.me();
    const logs = await base44.entities.WorkoutLog.filter({ created_by: u.email, dag_naam: dag }, '-log_date', 5);
    setHistory(logs);
  }

  async function loadTodayLog() {
    const u = await base44.auth.me();
    const existing = await base44.entities.WorkoutLog.filter({ created_by: u.email, log_date: today, dag_naam: dag });
    if (existing.length > 0 && existing[0].exercises) {
      setExercises(existing[0].exercises);
      setNotes(existing[0].notes || '');
    }
  }

  function updateSet(exIdx, setIdx, field, value) {
    setExercises(prev => prev.map((ex, i) => i !== exIdx ? ex : {
      ...ex,
      sets: ex.sets.map((s, j) => j !== setIdx ? s : { ...s, [field]: value })
    }));
  }

  function toggleSet(exIdx, setIdx) {
    const wasVoltooid = exercises[exIdx].sets[setIdx].voltooid;
    setExercises(prev => prev.map((ex, i) => i !== exIdx ? ex : {
      ...ex,
      sets: ex.sets.map((s, j) => j !== setIdx ? s : { ...s, voltooid: !s.voltooid })
    }));
    if (!wasVoltooid) setShowTimer(true);
  }

  function addSet(exIdx) {
    setExercises(prev => prev.map((ex, i) => i !== exIdx ? ex : {
      ...ex,
      sets: [...ex.sets, { set_nr: ex.sets.length + 1, gewicht_kg: '', reps: '', voltooid: false }]
    }));
  }

  function removeSet(exIdx) {
    setExercises(prev => prev.map((ex, i) => i !== exIdx || ex.sets.length <= 1 ? ex : {
      ...ex,
      sets: ex.sets.slice(0, -1)
    }));
  }

  async function saveLog() {
    const duration = Math.round((Date.now() - startTime) / 60000);
    const u = await base44.auth.me();
    const existing = await base44.entities.WorkoutLog.filter({ created_by: u.email, log_date: today, dag_naam: dag });
    const data = { log_date: today, schema_name: schemaName, dag_naam: dag, exercises, notes, duration_min: duration };
    if (existing.length > 0) {
      await base44.entities.WorkoutLog.update(existing[0].id, data);
    } else {
      await base44.entities.WorkoutLog.create(data);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    loadHistory();
  }

  const totalVoltooid = exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.voltooid).length, 0);
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  return (
    <>
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-bold text-foreground">{dag}</h2>
            <p className="text-xs text-muted-foreground">{format(new Date(), 'EEEE d MMMM', { locale: nl })}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
              {totalVoltooid}/{totalSets} sets ✓
            </div>
            <button onClick={() => setShowTimer(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-border rounded-full text-xs text-muted-foreground hover:text-foreground transition-all">
              <Timer className="w-3.5 h-3.5" />
              {rustDuur >= 60 ? `${Math.floor(rustDuur / 60)}m${rustDuur % 60 > 0 ? rustDuur % 60 + 's' : ''}` : `${rustDuur}s`}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-all">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-secondary">
          <div className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{ width: `${totalSets > 0 ? (totalVoltooid / totalSets) * 100 : 0}%` }} />
        </div>

        <div className="p-5 space-y-4">
          {/* Oefeningen */}
          {exercises.map((ex, exIdx) => (
            <div key={exIdx} className="bg-secondary/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground text-sm">{ex.naam}</h3>
                <div className="flex items-center gap-1">
                  <button onClick={() => removeSet(exIdx)}
                    className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center hover:bg-border transition-all">
                    <Minus className="w-3 h-3 text-muted-foreground" />
                  </button>
                  <span className="text-xs text-muted-foreground px-1">{ex.sets.length} sets</span>
                  <button onClick={() => addSet(exIdx)}
                    className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center hover:bg-border transition-all">
                    <Plus className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Set headers */}
              <div className="grid grid-cols-4 text-xs text-muted-foreground mb-2 px-1">
                <span>Set</span>
                <span className="text-center">Gewicht (kg)</span>
                <span className="text-center">Reps</span>
                <span className="text-center">✓</span>
              </div>

              {ex.sets.map((set, setIdx) => (
                <div key={setIdx} className={`grid grid-cols-4 gap-2 mb-2 items-center ${set.voltooid ? 'opacity-60' : ''}`}>
                  <span className="text-xs font-medium text-muted-foreground pl-1">Set {set.set_nr}</span>
                  <input
                    type="number"
                    value={set.gewicht_kg}
                    onChange={e => updateSet(exIdx, setIdx, 'gewicht_kg', e.target.value)}
                    placeholder="0"
                    className="bg-input border border-border rounded-lg px-2 py-1.5 text-sm text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="number"
                    value={set.reps}
                    onChange={e => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                    placeholder="0"
                    className="bg-input border border-border rounded-lg px-2 py-1.5 text-sm text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="flex justify-center">
                    <button onClick={() => toggleSet(exIdx, setIdx)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${set.voltooid ? 'bg-primary text-primary-foreground' : 'bg-secondary border border-border hover:border-primary'}`}>
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Vorige sessie hint */}
              {history.length > 0 && (() => {
                const prevEx = history[0]?.exercises?.find(e => e.naam === ex.naam);
                const lastSet = prevEx?.sets?.filter(s => s.voltooid && s.gewicht_kg)?.[0];
                return lastSet ? (
                  <p className="text-xs text-muted-foreground mt-2">
                    Vorige keer: <span className="text-primary">{lastSet.gewicht_kg}kg × {lastSet.reps} reps</span>
                  </p>
                ) : null;
              })()}
            </div>
          ))}

          {/* Notities */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notities</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Hoe voelde de training?"
              className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-16" />
          </div>

          {/* Opslaan */}
          <button onClick={saveLog}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${saved ? 'bg-primary/20 text-primary' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
            <Save className="w-4 h-4" />
            {saved ? '✓ Training opgeslagen!' : 'Training opslaan'}
          </button>

          {/* Geschiedenis */}
          {history.length > 0 && (
            <div className="border-t border-border pt-4">
              <button onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all w-full">
                <History className="w-4 h-4" />
                Vorige sessies ({history.length})
                {showHistory ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
              </button>
              {showHistory && (
                <div className="mt-3 space-y-3">
                  {history.map((log, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-medium text-foreground">{format(new Date(log.log_date), 'dd MMM yyyy', { locale: nl })}</p>
                        {log.duration_min && <p className="text-xs text-muted-foreground">{log.duration_min} min</p>}
                      </div>
                      {log.exercises?.map((ex, j) => (
                        <div key={j} className="text-xs text-muted-foreground mb-1">
                          <span className="text-foreground">{ex.naam}:</span>{' '}
                          {ex.sets?.filter(s => s.voltooid && s.gewicht_kg).map((s, k) => (
                            <span key={k}>{s.gewicht_kg}kg×{s.reps}{k < ex.sets.filter(s => s.voltooid && s.gewicht_kg).length - 1 ? ', ' : ''}</span>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

    {showTimer && (
      <RestTimer
        defaultDuration={rustDuur}
        onClose={() => setShowTimer(false)}
      />
    )}
  );
}