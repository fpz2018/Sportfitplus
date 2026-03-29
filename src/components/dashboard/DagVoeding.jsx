import { useState, useEffect } from 'react';
import { WeekMenu } from '@/api/entities';
import { Link } from 'react-router-dom';
import { Utensils, ChevronRight, CheckCircle2 } from 'lucide-react';

const TYPE_ICONS = { ontbijt: '🌅', lunch: '☀️', diner: '🌙', snack: '🍎' };
const TYPE_ORDER = ['ontbijt', 'lunch', 'diner', 'snack'];

function ProgressBar({ label, value, max, color }) {
  const pct = max ? Math.min((value / max) * 100, 100) : 0;
  const done = pct >= 100;
  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{label}</span>
        <span className={done ? 'text-primary font-medium' : ''}>{Math.round(value || 0)} / {max}</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function DagVoeding({ profile, todayLog, today }) {
  const [maaltijden, setMaaltijden] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    WeekMenu.getByDate(today).then(data => {
      const arr = Array.isArray(data) ? data : (data ? [data] : []);
      arr.sort((a, b) => TYPE_ORDER.indexOf(a.maaltijd_type) - TYPE_ORDER.indexOf(b.maaltijd_type));
      setMaaltijden(arr);
      setLoading(false);
    });
  }, [today]);

  const calTarget = profile?.target_calories || 0;
  const protTarget = profile?.protein_target_g || 0;
  const carbTarget = profile?.carbs_target_g || 0;
  const fatTarget = profile?.fat_target_g || 0;

  const calEaten = todayLog?.calories_eaten || 0;
  const protEaten = todayLog?.protein_g || 0;
  const carbsEaten = todayLog?.carbs_g || 0;
  const fatEaten = todayLog?.fat_g || 0;

  const geplandCal = maaltijden.reduce((s, m) => s + (m.calories || 0), 0);
  const geplandProt = maaltijden.reduce((s, m) => s + (m.protein_g || 0), 0);
  const geplandCarbs = maaltijden.reduce((s, m) => s + (m.carbs_g || 0), 0);
  const geplandFat = maaltijden.reduce((s, m) => s + (m.fat_g || 0), 0);

  const resterendCal = Math.max(calTarget - calEaten - geplandCal, 0);
  const resterendProt = Math.max(protTarget - protEaten - geplandProt, 0);
  const resterendCarbs = Math.max(carbTarget - carbsEaten - geplandCarbs, 0);
  const resterendFat = Math.max(fatTarget - fatEaten - geplandFat, 0);

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
            <Utensils className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Voeding vandaag</h2>
            <p className="text-xs text-muted-foreground">Nog nodig: {Math.round(resterendCal)} kcal · {Math.round(resterendProt)}g eiwit · {Math.round(resterendCarbs)}g koolh. · {Math.round(resterendFat)}g vet</p>
          </div>
        </div>
        <Link to="/weekmenu" className="text-xs text-primary flex items-center gap-1 hover:underline shrink-0">
          Weekmenu <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Macros progress - gegeten + gepland vs doel */}
      {(calEaten > 0 || geplandCal > 0) && (
        <div className="space-y-2.5 mb-4 p-4 bg-secondary/40 rounded-xl">
          <p className="text-xs font-medium text-muted-foreground mb-1">Gegeten + Gepland</p>
          <ProgressBar label="Calorieën" value={calEaten + geplandCal} max={calTarget} color="bg-orange-400" />
          <ProgressBar label="Eiwit" value={protEaten + geplandProt} max={protTarget} color="bg-primary" />
          <ProgressBar label="Koolhydraten" value={carbsEaten + geplandCarbs} max={carbTarget} color="bg-blue-400" />
          <ProgressBar label="Vetten" value={fatEaten + geplandFat} max={fatTarget} color="bg-accent" />
        </div>
      )}

      {/* Geplande maaltijden */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-secondary rounded-xl animate-pulse" />)}
        </div>
      ) : maaltijden.length > 0 ? (
        <div className="space-y-2 mb-4">
          {maaltijden.map(m => (
            <div key={m.id} className="flex items-center gap-3 bg-secondary/50 rounded-xl px-3 py-2.5">
              <span className="text-base">{TYPE_ICONS[m.maaltijd_type]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{m.recept_titel}</p>
                {m.calories && (
                  <p className="text-xs text-muted-foreground">{m.calories} kcal · {m.protein_g}g eiwit</p>
                )}
              </div>
            </div>
          ))}
          {geplandCal > 0 && (
            <div className="flex justify-between pt-2 border-t border-border text-xs">
              <span className="text-muted-foreground">Totaal gepland</span>
              <span className="font-medium text-foreground">{geplandCal} kcal · {geplandProt}g eiwit</span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4 mb-3">
          <p className="text-sm text-muted-foreground mb-3">Nog geen maaltijden gepland voor vandaag</p>
        </div>
      )}

      <div className="flex gap-2">
        <Link to="/weekmenu"
          className="flex-1 text-center py-2.5 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:border-primary/40 transition-all">
          Maaltijden plannen
        </Link>
        <Link to="/voortgang"
          className="flex-1 text-center py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-all">
          Voeding loggen
        </Link>
      </div>
    </div>
  );
}
