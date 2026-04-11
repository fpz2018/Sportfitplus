import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import { FoodLog } from '@/api/entities';
import { MACROS, MACRO_KEYS, getLogTotal, getTarget } from '@/lib/macros';

function Tile({ macroKey, value, target }) {
  const macro = MACROS[macroKey];
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  const remaining = Math.max(target - value, 0);

  return (
    <Link
      to={`/voeding/${macroKey}`}
      className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between min-h-[140px] hover:border-primary/40 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-base font-semibold text-foreground">{macro.label}</p>
          <p className="text-xs text-muted-foreground">Vandaag</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>

      <div className="space-y-2">
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden relative">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: macro.cssVar }}
          />
          {target > 0 && (
            <div className="absolute top-0 bottom-0 w-px bg-foreground/30" style={{ left: '100%' }} />
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-foreground tabular-nums">
            {target > 0 ? Math.round(remaining) : Math.round(value)}
          </span>
          <span className="text-xs text-muted-foreground">
            {macro.unit} {target > 0 ? 'over' : 'gegeten'}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function MacroTiles({ profile }) {
  const [todayLog, setTodayLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    let cancelled = false;
    FoodLog.getByDate(today)
      .then(log => { if (!cancelled) setTodayLog(log); })
      .catch(err => console.error('MacroTiles load error', err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [today]);

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-bold text-foreground mb-3 px-1">Voeding</h2>
        <div className="grid grid-cols-2 gap-3">
          {MACRO_KEYS.map(k => (
            <div key={k} className="h-[140px] bg-secondary/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-3 px-1">Voeding</h2>
      <div className="grid grid-cols-2 gap-3">
        {MACRO_KEYS.map(macroKey => (
          <Tile
            key={macroKey}
            macroKey={macroKey}
            value={getLogTotal(todayLog, macroKey)}
            target={getTarget(profile, macroKey)}
          />
        ))}
      </div>
    </div>
  );
}
