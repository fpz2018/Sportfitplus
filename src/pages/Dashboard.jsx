import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import DagTraining from '@/components/dashboard/DagTraining';
import DagVoeding from '@/components/dashboard/DagVoeding';
import DagWelzijn from '@/components/dashboard/DagWelzijn';
import DagHeader from '@/components/dashboard/DagHeader';
import { Zap, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const u = await base44.auth.me();
    setUser(u);
    const [profiles, logs] = await Promise.all([
      base44.entities.UserProfile.filter({ created_by: u.email }),
      base44.entities.DailyLog.filter({ created_by: u.email, log_date: today }),
    ]);
    if (profiles.length > 0) setProfile(profiles[0]);
    if (logs.length > 0) setTodayLog(logs[0]);
    setLoading(false);
  }

  function refreshLog() {
    base44.auth.me().then(u =>
      base44.entities.DailyLog.filter({ created_by: u.email, log_date: today }).then(logs => {
        if (logs.length > 0) setTodayLog(logs[0]);
      })
    );
  }

  // Onboarding nog niet gedaan
  if (!loading && !profile?.onboarding_done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl">👋</div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Welkom bij Sportfit Plus</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Beantwoord een paar vragen over jouw doelen, leefstijl en gezondheid. We maken dan direct een persoonlijk programma voor je — training, voeding én welzijn.
          </p>
          <Link to="/onboarding"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold text-base hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            <Zap className="w-5 h-5" /> Start mijn programma <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-xs text-muted-foreground mt-4">Duurt ongeveer 3 minuten</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-10 space-y-5">
      <DagHeader user={user} profile={profile} loading={loading} />

      {!loading && profile && (
        <>
          <DagTraining profile={profile} todayLog={todayLog} onLogUpdate={refreshLog} />
          <DagVoeding profile={profile} todayLog={todayLog} today={today} />
          <DagWelzijn profile={profile} todayLog={todayLog} onLogUpdate={refreshLog} />
        </>
      )}

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-card border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}