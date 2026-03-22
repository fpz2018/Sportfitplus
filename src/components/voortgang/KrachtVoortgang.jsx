import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { TrendingUp, Dumbbell, ChevronDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function KrachtVoortgang() {
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [selectedOefening, setSelectedOefening] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    const u = await base44.auth.me();
    const logs = await base44.entities.WorkoutLog.filter({ created_by: u.email }, '-log_date', 60);
    setWorkoutLogs(logs);
    setLoading(false);

    // Auto-select first exercise found
    if (logs.length > 0) {
      const oefeningen = getUniekeOefeningen(logs);
      if (oefeningen.length > 0) setSelectedOefening(oefeningen[0]);
    }
  }

  function getUniekeOefeningen(logs) {
    const set = new Set();
    logs.forEach(log => log.exercises?.forEach(ex => set.add(ex.naam)));
    return Array.from(set).sort();
  }

  function getChartData(oefening) {
    return workoutLogs
      .filter(log => log.exercises?.some(ex => ex.naam === oefening))
      .map(log => {
        const ex = log.exercises.find(e => e.naam === oefening);
        const voltooidesets = ex?.sets?.filter(s => s.voltooid && s.gewicht_kg > 0) || [];
        const maxGewicht = voltooidesets.length > 0
          ? Math.max(...voltooidesets.map(s => parseFloat(s.gewicht_kg) || 0))
          : null;
        const totaalVolume = voltooidesets.reduce((sum, s) => sum + ((parseFloat(s.gewicht_kg) || 0) * (parseInt(s.reps) || 0)), 0);
        return {
          date: format(new Date(log.log_date), 'dd/MM'),
          maxGewicht,
          volume: totaalVolume,
          rawDate: log.log_date,
        };
      })
      .filter(d => d.maxGewicht !== null)
      .sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  }

  const oefeningen = getUniekeOefeningen(workoutLogs);
  const chartData = selectedOefening ? getChartData(selectedOefening) : [];
  const pr = chartData.length > 0 ? Math.max(...chartData.map(d => d.maxGewicht)) : null;
  const laastste = chartData[chartData.length - 1];
  const eerste = chartData[0];
  const toename = (laastste && eerste && laastste.maxGewicht !== eerste.maxGewicht)
    ? (laastste.maxGewicht - eerste.maxGewicht).toFixed(1)
    : null;

  if (loading) return null;
  if (oefeningen.length === 0) return (
    <div className="bg-card border border-border rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>
        <h2 className="font-semibold text-foreground">Krachtvoortgang</h2>
      </div>
      <p className="text-sm text-muted-foreground text-center py-4">
        Nog geen trainingen gelogd. Start een training via <strong className="text-foreground">Trainingsschema's</strong> om je krachtvoortgang te volgen.
      </p>
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Krachtvoortgang</h2>
            <p className="text-xs text-muted-foreground">Max gewicht per oefening over de tijd</p>
          </div>
        </div>
      </div>

      {/* Oefening selector */}
      <div className="relative mb-5">
        <select
          value={selectedOefening}
          onChange={e => setSelectedOefening(e.target.value)}
          className="w-full appearance-none bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary pr-10"
        >
          {oefeningen.map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>

      {/* Stats */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-secondary rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Huidig max</p>
            <p className="text-xl font-bold text-primary">{laastste?.maxGewicht}</p>
            <p className="text-xs text-muted-foreground">kg</p>
          </div>
          <div className="bg-secondary rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Personal Record</p>
            <p className="text-xl font-bold text-accent">{pr}</p>
            <p className="text-xs text-muted-foreground">kg</p>
          </div>
          <div className="bg-secondary rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Toename</p>
            <p className={`text-xl font-bold ${toename && parseFloat(toename) > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
              {toename ? `+${toename}` : '—'}
            </p>
            <p className="text-xs text-muted-foreground">kg</p>
          </div>
        </div>
      )}

      {/* Grafiek */}
      {chartData.length >= 2 ? (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} domain={['auto', 'auto']} unit="kg" />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }}
              formatter={(val) => [`${val} kg`, 'Max gewicht']}
            />
            <Line
              type="monotone"
              dataKey="maxGewicht"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              activeDot={{ r: 6 }}
              name="Max gewicht"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : chartData.length === 1 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          <Dumbbell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
          Nog maar 1 sessie gelogd voor <strong className="text-foreground">{selectedOefening}</strong>.<br />
          Log meer trainingen om je progressie te zien.
        </div>
      ) : (
        <div className="text-center py-6 text-sm text-muted-foreground">
          Geen data voor deze oefening.
        </div>
      )}

      {/* Volume grafiek als bonus */}
      {chartData.length >= 2 && (
        <div className="mt-5 pt-5 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-3">Totaal volume per sessie (kg × reps)</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }}
                formatter={(val) => [`${val} kg`, 'Volume']}
              />
              <Line type="monotone" dataKey="volume" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="Volume" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}