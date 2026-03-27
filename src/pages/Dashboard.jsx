import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Dumbbell, TrendingDown, Zap, Target, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import KennisHighlightsWidget from '@/components/dashboard/KennisHighlightsWidget';
import WeekMenuWidget from '@/components/dashboard/WeekMenuWidget';
import WaterTracker from '@/components/dashboard/WaterTracker';
import { format, differenceInDays } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';

export default function Dashboard() {
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const u = await base44.auth.me();
    setUser(u);
    setIsAdmin(u?.role === 'admin');
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
    <div className="w-full px-4 md:px-6 py-6 pb-24 md:pb-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-muted-foreground text-xs md:text-sm mb-1">{format(new Date(), 'EEEE d MMMM', { locale: language === 'nl' ? nl : enUS })}</p>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{language === 'nl' ? 'Goedemorgen' : 'Good morning'}{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''} 👋</h1>
        {!profile?.onboarding_done && (
          <Link to="/onboarding" className="mt-4 flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/30 text-primary hover:bg-primary/15 transition-all">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{t('stelJeProfiel')}</p>
              <p className="text-xs text-primary/70">{t('berekenJeTdee')}</p>
            </div>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Stats row */}
      {profile && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label={t('doelCalorieën')}
            value={`${profile.target_calories} kcal`}
            icon={<Flame className="w-4 h-4" />}
            color="text-orange-400"
          />
          <StatCard
            label={t('ewitDoel')}
            value={`${profile.protein_target_g}g`}
            icon={<Dumbbell className="w-4 h-4" />}
            color="text-primary"
          />
          <StatCard
            label={t('tdee')}
            value={`${profile.tdee} kcal`}
            icon={<Zap className="w-4 h-4" />}
            color="text-accent"
          />
          {cutDaysLeft !== null && (
            <StatCard
              label={t('dagenResterend')}
              value={cutDaysLeft > 0 ? `${cutDaysLeft} ${language === 'nl' ? 'dagen' : 'days'}` : t('cutAfgerond')}
              icon={<Target className="w-4 h-4" />}
              color="text-purple-400"
            />
          )}
        </div>
      )}

      {/* Vandaag loggen */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-2xl p-4 md:p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-sm md:text-base text-foreground">{t('vandaag')}</h2>
            <Link to="/voortgang" className="text-xs text-primary hover:underline flex items-center gap-1">
              {t('vandaagLoggen')} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {todayLog ? (
            <div className="space-y-3">
              <ProgressBar label={t('calorieën')} value={todayLog.calories_eaten} max={profile?.target_calories} color="bg-orange-400" />
              <ProgressBar label={t('proteïne')} value={todayLog.protein_g} max={profile?.protein_target_g} color="bg-primary" />
              {todayLog.training_done && (
                <div className="flex items-center gap-2 text-sm text-primary mt-2">
                  <Dumbbell className="w-4 h-4" />
                  {t('trainingVoltooid')}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm mb-3">{t('vandaagLoggen')}</p>
              <Link to="/voortgang" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all">
                {t('dagLoggen')}
              </Link>
            </div>
          )}
        </div>

        {/* Snelle links */}
        <div className="bg-card border border-border rounded-2xl p-4 md:p-5">
          <h2 className="font-semibold text-sm md:text-base text-foreground mb-4">{t('snelleToegeng')}</h2>
          <div className="space-y-2">
            {[
              { to: '/schemas', labelKey: 'trainingsschemaBezkijken', icon: Dumbbell },
              { to: '/calculator', labelKey: 'tdeeHerberekenen', icon: Zap },
              { to: '/voeding', labelKey: 'voedingsplanBezkijken', icon: Flame },
              { to: '/gids', labelKey: 'droograinenGids', icon: TrendingDown },
            ].map(({ to, labelKey, icon: Icon }) => (
              <Link key={to} to={to} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-all group">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/20 transition-all">
                  <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                </div>
                <span className="text-sm text-foreground">{t(labelKey)}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Water tracker */}
      <div className="mb-8">
        <WaterTracker />
      </div>

      {/* Weekmenu widget */}
      <div className="mb-8">
        <WeekMenuWidget />
      </div>

      {/* Kennis Highlights + SEO */}
      <div className="mb-8">
        <KennisHighlightsWidget isAdmin={isAdmin} />
      </div>

      {/* Recente logs */}
      {recentLogs.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 md:p-5">
          <h2 className="font-semibold text-sm md:text-base text-foreground mb-4">{t('gewichtDezeWeek')}</h2>
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
              {t('aflgelopenWeek')}: <span className={parseFloat(avgWeightLoss) <= 0 ? 'text-primary font-medium' : 'text-destructive font-medium'}>{avgWeightLoss}kg</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-3 md:p-4">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-xs text-muted-foreground mb-1 truncate">{label}</p>
      <p className="text-base md:text-lg font-bold text-foreground truncate">{value}</p>
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