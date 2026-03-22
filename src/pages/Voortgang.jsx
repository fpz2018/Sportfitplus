import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Plus, Check, TrendingDown, Scale, Flame, Dumbbell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Voortgang() {
  const [logs, setLogs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [today] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [todayLog, setTodayLog] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ weight_kg: '', calories_eaten: '', protein_g: '', carbs_g: '', fat_g: '', training_done: false, training_type: 'kracht', steps: '', notes: '', mood: 3 });
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const u = await base44.auth.me();
    const [profiles, allLogs] = await Promise.all([
      base44.entities.UserProfile.filter({ created_by: u.email }),
      base44.entities.DailyLog.filter({ created_by: u.email }, '-log_date', 30),
    ]);
    if (profiles.length > 0) setProfile(profiles[0]);
    setLogs(allLogs);
    const tl = allLogs.find(l => l.log_date === today);
    if (tl) { setTodayLog(tl); setForm({ ...tl }); }
  }

  async function saveLog() {
    const data = {
      ...form,
      log_date: today,
      weight_kg: parseFloat(form.weight_kg) || null,
      calories_eaten: parseInt(form.calories_eaten) || null,
      protein_g: parseInt(form.protein_g) || null,
      carbs_g: parseInt(form.carbs_g) || null,
      fat_g: parseInt(form.fat_g) || null,
      steps: parseInt(form.steps) || null,
    };
    if (todayLog) {
      await base44.entities.DailyLog.update(todayLog.id, data);
    } else {
      await base44.entities.DailyLog.create(data);
    }
    setSaved(true);
    setShowForm(false);
    loadData();
    setTimeout(() => setSaved(false), 3000);
  }

  const chartData = [...logs].reverse().slice(-14).map(l => ({
    date: format(new Date(l.log_date), 'dd/MM'),
    gewicht: l.weight_kg,
    cals: l.calories_eaten,
  }));

  return (
    <div className="p-6 pb-24 md:pb-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Voortgang</h1>
        <p className="text-muted-foreground text-sm">Log je dagelijkse gewicht en calorieën</p>
      </div>

      {/* Vandaag */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-foreground">Vandaag loggen</h2>
            <p className="text-xs text-muted-foreground">{format(new Date(), 'EEEE d MMMM', { locale: nl })}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all">
            <Plus className="w-4 h-4" />
            {todayLog ? 'Bewerken' : 'Loggen'}
          </button>
        </div>

        {todayLog && !showForm && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Gewicht', value: todayLog.weight_kg ? `${todayLog.weight_kg} kg` : '—', icon: <Scale className="w-4 h-4 text-primary" /> },
              { label: 'Calorieën', value: todayLog.calories_eaten ? `${todayLog.calories_eaten} kcal` : '—', icon: <Flame className="w-4 h-4 text-orange-400" /> },
              { label: 'Eiwit', value: todayLog.protein_g ? `${todayLog.protein_g}g` : '—', icon: <Dumbbell className="w-4 h-4 text-green-400" /> },
              { label: 'Training', value: todayLog.training_done ? '✓ Gedaan' : '✗ Niet', icon: <TrendingDown className="w-4 h-4 text-purple-400" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-secondary rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
                <p className="font-semibold text-sm text-foreground">{value}</p>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { k: 'weight_kg', l: 'Gewicht (kg)', p: '79.5' },
                { k: 'calories_eaten', l: 'Calorieën gegeten', p: `${profile?.target_calories || 2000}` },
                { k: 'protein_g', l: 'Eiwit (g)', p: `${profile?.protein_target_g || 160}` },
                { k: 'carbs_g', l: 'Koolhydraten (g)', p: '200' },
                { k: 'fat_g', l: 'Vetten (g)', p: '60' },
                { k: 'steps', l: 'Stappen', p: '8000' },
              ].map(({ k, l, p }) => (
                <div key={k}>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{l}</label>
                  <input type="number" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={p}
                    className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <button onClick={() => setForm(f => ({ ...f, training_done: !f.training_done }))}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${form.training_done ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                <Dumbbell className="w-4 h-4" />
                {form.training_done ? '✓ Training gedaan' : 'Training gedaan?'}
              </button>
              {form.training_done && (
                <select value={form.training_type} onChange={e => setForm(f => ({ ...f, training_type: e.target.value }))}
                  className="bg-input border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="kracht">Kracht</option>
                  <option value="cardio_liss">Cardio LISS</option>
                  <option value="cardio_hiit">Cardio HIIT</option>
                  <option value="rust">Rustdag</option>
                </select>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notities</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Hoe voelde je je vandaag?"
                className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-20" />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl border border-border text-muted-foreground text-sm hover:border-primary/40 transition-all">
                Annuleren
              </button>
              <button onClick={saveLog}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all">
                <Check className="w-4 h-4" /> Opslaan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Gewicht grafiek */}
      {chartData.filter(d => d.gewicht).length > 1 && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-foreground mb-5">Gewicht trend (14 dagen)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData.filter(d => d.gewicht)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }} />
              <Line type="monotone" dataKey="gewicht" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} name="kg" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Log history */}
      {logs.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold text-foreground">Logboek</h2>
          </div>
          <div className="divide-y divide-border">
            {logs.map(log => (
              <div key={log.id} className="p-4 flex items-center gap-4">
                <div className="text-xs text-muted-foreground w-16 shrink-0">{format(new Date(log.log_date), 'dd/MM')}</div>
                <div className="flex flex-wrap gap-3 flex-1">
                  {log.weight_kg && <span className="text-sm text-foreground">{log.weight_kg} kg</span>}
                  {log.calories_eaten && <span className="text-sm text-orange-400">{log.calories_eaten} kcal</span>}
                  {log.protein_g && <span className="text-sm text-primary">{log.protein_g}g eiwit</span>}
                  {log.training_done && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Training ✓</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}