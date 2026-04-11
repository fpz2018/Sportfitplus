import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, BarChart3, Info } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, ReferenceLine, Tooltip, Cell,
} from 'recharts';
import { useAuth } from '@/lib/AuthContext';
import { FoodLog } from '@/api/entities';
import {
  MACROS,
  MACRO_KEYS,
  getLogTotal,
  getTopContributors,
  getTarget,
  buildDailySeries,
  aggregateWeekly,
  aggregateMonthly,
  average,
  TIMEFRAMES,
} from '@/lib/macros';

const MACRO_DESCRIPTIONS = {
  calories: 'Calorieën zijn een maat voor de energie die je via voeding binnenkrijgt. Voor een stabiel gewicht moet je inname ongeveer gelijk zijn aan je verbruik. Voor afvallen creëer je een licht tekort, voor spieropbouw een licht overschot.',
  protein: 'Eiwit (proteïne) is een van de drie macronutriënten en levert de bouwstenen voor spieren, hormonen en enzymen. Voor sporters is een inname van 1,6–2,2 g per kg lichaamsgewicht aanbevolen om herstel en spiergroei te ondersteunen.',
  carbs: 'Koolhydraten zijn de belangrijkste energiebron voor intensieve inspanning. Ze worden opgeslagen als glycogeen in spieren en lever, en zijn essentieel voor sportprestaties en mentale focus.',
  fat: 'Vetten zijn nodig voor hormoonproductie, opname van vitaminen (A, D, E, K) en als langdurige energiebron. Een gezonde inname zit meestal tussen de 0,8 en 1,2 g per kg lichaamsgewicht.',
};

function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-2 bg-secondary rounded-full overflow-hidden relative">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
      {max > 0 && (
        <div className="absolute top-0 bottom-0 w-px bg-foreground/40" style={{ left: '100%' }} />
      )}
    </div>
  );
}

function TodaySection({ macro, todayLog, target, navigate, macroKey }) {
  const value = getLogTotal(todayLog, macroKey);
  const pct = target > 0 ? Math.round((value / target) * 100) : 0;
  const contributors = getTopContributors(todayLog, macroKey, 3);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">{macro.label} vandaag</h2>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-base font-medium text-foreground">{macro.label}</span>
            <div className="flex items-baseline gap-3">
              <span className="text-base text-muted-foreground tabular-nums">
                {Math.round(value * 10) / 10} / {target || '–'} {macro.unit}
              </span>
              <span className="text-base font-medium tabular-nums" style={{ color: macro.cssVar }}>
                {pct}%
              </span>
            </div>
          </div>
          <ProgressBar value={value} max={target} color={macro.cssVar} />
        </div>

        <button
          type="button"
          onClick={() => navigate('/weekmenu')}
          className="w-full text-left pt-4 border-t border-border group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground">Top 3 bijdragers</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          {contributors.length > 0 ? (
            <ul className="space-y-2">
              {contributors.map((c, idx) => (
                <li key={c.name + idx} className="flex items-center justify-between text-sm">
                  <span className="text-foreground truncate pr-3">
                    <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                    {c.name}
                  </span>
                  <span className="tabular-nums text-muted-foreground shrink-0">
                    {Math.round(c.value * 10) / 10} {macro.unit}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nog geen bijdragers vandaag</p>
          )}
        </button>
      </div>
    </section>
  );
}

function HistorySection({ logs, macro, target, macroKey, today }) {
  // Groepeer logs per maand (yyyy-MM) en sorteer aflopend
  const grouped = useMemo(() => {
    const map = new Map();
    for (const log of logs || []) {
      if (log.log_date === today) continue; // Vandaag staat in eigen sectie
      const total = getLogTotal(log, macroKey);
      if (total <= 0) continue;
      const monthKey = log.log_date.slice(0, 7);
      const arr = map.get(monthKey) || [];
      arr.push({ date: log.log_date, value: total });
      map.set(monthKey, arr);
    }
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, days]) => ({
        key,
        label: format(parseISO(key + '-01'), 'MMMM yyyy', { locale: nl }),
        days: days.sort((a, b) => (a.date < b.date ? 1 : -1)),
      }));
  }, [logs, macroKey, today]);

  if (grouped.length === 0) {
    return (
      <section className="space-y-2">
        <p className="text-sm text-muted-foreground">Nog geen geschiedenis voor deze macro.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {grouped.map(month => (
        <div key={month.key} className="space-y-3">
          <h3 className="text-xl font-bold text-foreground lowercase">{month.label}</h3>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
            {month.days.map(day => {
              const pct = target > 0 ? Math.round((day.value / target) * 100) : 0;
              return (
                <div key={day.date} className="p-4 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium text-foreground lowercase">
                      {format(parseISO(day.date), 'EEE d MMM.', { locale: nl })}
                    </span>
                    <div className="flex items-baseline gap-3">
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {Math.round(day.value * 10) / 10} / {target || '–'} {macro.unit}
                      </span>
                      <span
                        className="text-sm font-medium tabular-nums"
                        style={{ color: macro.cssVar }}
                      >
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <ProgressBar value={day.value} max={target} color={macro.cssVar} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

function ChartSection({ logs, macro, target, macroKey }) {
  const [tfKey, setTfKey] = useState('1W');
  const tf = TIMEFRAMES.find(t => t.key === tfKey) || TIMEFRAMES[0];

  const { series, label, avg } = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (tf.days - 1));
    const daily = buildDailySeries(logs, macroKey, from, to);
    let series = daily;
    if (tf.granularity === 'week') series = aggregateWeekly(daily);
    if (tf.granularity === 'month') series = aggregateMonthly(daily);

    const fmt = (d) => format(parseISO(d), 'd MMM.', { locale: nl });
    const label = `${fmt(from.toISOString().slice(0, 10))} – ${fmt(to.toISOString().slice(0, 10))}`;
    return { series, label, avg: average(daily) };
  }, [logs, macroKey, tfKey, tf]);

  const chartData = series.map(p => ({
    ...p,
    label: tf.granularity === 'day'
      ? format(parseISO(p.date), 'EEEEE', { locale: nl })
      : tf.granularity === 'week'
        ? format(parseISO(p.date), 'd MMM', { locale: nl })
        : format(parseISO(p.date), 'MMM', { locale: nl }),
  }));

  // Bepaal max voor y-axis (target of 1.2x max waarde)
  const maxValue = Math.max(...series.map(p => p.value), target || 0);
  const yMax = Math.ceil(maxValue * 1.1 / 50) * 50 || 100;

  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Gemiddeld</p>
          <p className="text-3xl font-bold text-foreground tabular-nums">
            {Math.round(avg)} <span className="text-base font-normal text-muted-foreground">{macro.unit}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
        </div>
      </div>

      <div className="h-56 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="label"
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
              style={{ fontSize: '11px' }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
              orientation="right"
              domain={[0, yMax]}
              ticks={[0, Math.round(yMax / 2), yMax]}
              style={{ fontSize: '11px' }}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
                fontSize: '12px',
              }}
              formatter={(v) => [`${Math.round(v * 10) / 10} ${macro.unit}`, macro.label]}
              labelFormatter={(_, payload) => {
                const p = payload?.[0]?.payload;
                return p ? format(parseISO(p.date), 'd MMM yyyy', { locale: nl }) : '';
              }}
            />
            {target > 0 && (
              <ReferenceLine
                y={target}
                stroke={macro.cssVar}
                strokeDasharray="3 3"
                strokeOpacity={0.7}
              />
            )}
            <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={40}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={macro.cssVar} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Timeframe selector */}
      <div className="flex items-center justify-between bg-secondary/40 rounded-full p-1">
        {TIMEFRAMES.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTfKey(t.key)}
            className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${
              tfKey === t.key
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 px-1 pt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5" style={{ color: macro.cssVar }} />
          Inname
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 border-t border-dashed" style={{ borderColor: macro.cssVar }} />
          Doel
        </div>
        <div className="ml-auto">
          <Info className="w-3.5 h-3.5" />
        </div>
      </div>
    </section>
  );
}

export default function MacroDetail() {
  const { macro: macroParam } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'chart'

  const macroKey = MACRO_KEYS.includes(macroParam) ? macroParam : 'calories';
  const macro = MACROS[macroKey];
  const target = getTarget(profile, macroKey);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        // Haal de laatste 2 jaar binnen voor de "All"-timeframe
        const to = format(new Date(), 'yyyy-MM-dd');
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 730);
        const from = format(fromDate, 'yyyy-MM-dd');
        const data = await FoodLog.listRange(from, to);
        if (!cancelled) setLogs(data || []);
      } catch (err) {
        console.error('MacroDetail load error', err);
        if (!cancelled) setLogs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const todayLog = useMemo(
    () => logs.find(l => l.log_date === today) || null,
    [logs, today]
  );

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
          aria-label="Terug"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-base font-semibold text-foreground">{macro.label}</h1>
        <button
          type="button"
          onClick={() => setView(view === 'chart' ? 'list' : 'chart')}
          className="w-10 h-10 -mr-2 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
          aria-label={view === 'chart' ? 'Lijst weergeven' : 'Grafiek weergeven'}
        >
          <BarChart3 className={`w-5 h-5 ${view === 'chart' ? 'text-primary' : 'text-foreground'}`} />
        </button>
      </div>

      {/* Switcher tabs (subtiel) */}
      <div className="flex bg-secondary/40 rounded-full p-1 mb-6 text-sm">
        <button
          type="button"
          onClick={() => setView('list')}
          className={`flex-1 py-1.5 rounded-full font-medium transition-all ${
            view === 'list' ? 'bg-foreground text-background' : 'text-muted-foreground'
          }`}
        >
          Overzicht
        </button>
        <button
          type="button"
          onClick={() => setView('chart')}
          className={`flex-1 py-1.5 rounded-full font-medium transition-all ${
            view === 'chart' ? 'bg-foreground text-background' : 'text-muted-foreground'
          }`}
        >
          Grafiek
        </button>
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="h-32 bg-secondary/50 rounded-2xl animate-pulse" />
          <div className="h-40 bg-secondary/50 rounded-2xl animate-pulse" />
        </div>
      )}

      {!loading && view === 'list' && (
        <div className="space-y-8">
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: macro.cssVarSoft }}
              >
                {macro.icon}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {MACRO_DESCRIPTIONS[macroKey]}
              </p>
            </div>
          </div>

          <TodaySection
            macro={macro}
            todayLog={todayLog}
            target={target}
            navigate={navigate}
            macroKey={macroKey}
          />

          <HistorySection
            logs={logs}
            macro={macro}
            target={target}
            macroKey={macroKey}
            today={today}
          />
        </div>
      )}

      {!loading && view === 'chart' && (
        <div className="space-y-8">
          <ChartSection
            logs={logs}
            macro={macro}
            target={target}
            macroKey={macroKey}
          />

          <div className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">Over {macro.label.toLowerCase()}</h3>
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {MACRO_DESCRIPTIONS[macroKey]}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
