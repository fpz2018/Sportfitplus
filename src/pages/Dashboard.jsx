import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Dumbbell, TrendingDown, Zap, Target, ChevronRight } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const u = await base44.auth.me();
    setUser(u);
    const profiles = await base44.entities.UserProfile.filter({ created_by: u.email });
    if (profiles.length > 0) setProfile(profiles[0]);
    const today = format(new Date(), 'yyyy-MM-dd');
    const logs = await base44.entities.DailyLog.filter({ created_by: u.email, log_date: today });
    if (logs.length > 0) setTodayLog(logs[0]);
    const recent = await base44.entities.DailyLog.filter({ created_by: u.email }, '-log_date', 7);
    setRecentLogs(recent);
  }

  const cutDaysLeft = profile?.cut_start_date
    ? (profile.cut_weeks * 7) - differenceInDays(new Date(), new Date(profile.cut_start_date))
    : null;

  const calorieProgress = todayLog && profile
    ? Math.min((todayLog.calories_eaten / profile.target_calories) * 100, 100)
    : 0;

  const proteinProgress = todayLog && profile
    ? Math.min((todayLog.protein_g / profile.protein_target_g) * 100, 100)
    : 0;

  const avgWeightLoss = recentLogs.length >= 2
    ? (recentLogs[recentLogs.length - 1].weight_kg - recentLogs[0].weight_kg).toFixed(1)
    : null;

  return (
    <div className="p-6 pb-24 md:pb-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-muted-foreground text-sm mb-1">{format(new Date(), 'EEEE d MMMM', { locale: nl })}</p>
        <h1 className="text-3xl font-bold text-foreground">Goedemorgen{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''} 👋</h1>
        {!profile?.onboarding_done && (
          <Link to="/onboarding" className="mt-4 flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/30 text-primary hover:bg-primary/15 transition-all">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Stel je profiel in</p>
              <p className="text-xs text-primary/70">Bereken je TDEE en start je cut →</p>
            </div>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Stats row */}
      {profile && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Doel calorieën"
            value={`${profile.target_calories} kcal`}
            icon={<Flame className="w-4 h-4" />}
            color="text-orange-400"
          />
          <StatCard
            label="Eiwit doel"
            value={`${profile.protein_target_g}g`}
            icon={<Dumbbell className="w-4 h-4" />}
            color="text-primary"
          />
          <StatCard
            label="TDEE"
            value={`${profile.tdee} kcal`}
            icon={<Zap className="w-4 h-4" />}
            color="text-accent"
          />
          {cutDaysLeft !== null && (
            <StatCard
              label="Dagen resterend"
              value={cutDaysLeft > 0 ? `${cutDaysLeft} dagen` : 'Cut afgerond!'}
              icon={<Target className="w-4 h-4" />}
              color="text-purple-400"
            />
          )}
        </div>
      )}

      {/* Vandaag loggen */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-foreground">Vandaag</h2>
            <Link to="/voortgang" className="text-xs text-primary hover:underline flex items-center gap-1">
              Loggen <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {todayLog ? (
            <div className="space-y-3">
              <ProgressBar label="Calorieën" value={todayLog.calories_eaten} max={profile?.target_calories} color="bg-orange-400" />
              <ProgressBar label="Eiwit" value={todayLog.protein_g} max={profile?.protein_target_g} color="bg-primary" />
              {todayLog.training_done && (
                <div className="flex items-center gap-2 text-sm text-primary mt-2">
                  <Dumbbell className="w-4 h-4" />
                  Training voltooid ✓
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm mb-3">Nog niets gelogd vandaag</p>
              <Link to="/voortgang" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all">
                Dag loggen
              </Link>
            </div>
          )}
        </div>

        {/* Snelle links */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Snelle toegang</h2>
          <div className="space-y-2">
            {[
              { to: '/schemas', label: 'Trainingsschema bekijken', icon: Dumbbell },
              { to: '/calculator', label: 'TDEE herberekenen', icon: Zap },
              { to: '/voeding', label: 'Voedingsplan bekijken', icon: Flame },
              { to: '/gids', label: 'Droogtrainen gids', icon: TrendingDown },
            ].map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-all group">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/20 transition-all">
                  <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                </div>
                <span className="text-sm text-foreground">{label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recente logs */}
      {recentLogs.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Gewicht deze week</h2>
          <div className="flex items-end gap-2 overflow-x-auto pb-2">
            {recentLogs.slice(0, 7).map((log) => (
              <div key={log.id} className="flex flex-col items-center gap-1 min-w-[44px]">
                <span className="text-xs font-medium text-foreground">{log.weight_kg}kg</span>
                <div className="w-full bg-secondary rounded-sm" style={{ height: '40px' }}>
                  <div className="bg-primary/60 rounded-sm w-full" style={{ height: '100%' }} />
                </div>
                <span className="text-xs text-muted-foreground">{format(new Date(log.log_date), 'dd/MM')}</span>
              </div>
            ))}
          </div>
          {avgWeightLoss && (
            <p className="text-sm text-muted-foreground mt-3">
              Afgelopen week: <span className={parseFloat(avgWeightLoss) <= 0 ? 'text-primary font-medium' : 'text-destructive font-medium'}>{avgWeightLoss}kg</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

function ProgressBar({ label, value, max, color }) {
  const pct = max ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{label}</span>
        <span>{value} / {max}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}