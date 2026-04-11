import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { DailyLog } from '@/api/entities';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import DagTraining from '@/components/dashboard/DagTraining';
import DagVoeding from '@/components/dashboard/DagVoeding';
import DagWelzijn from '@/components/dashboard/DagWelzijn';
import DagSupplementen from '@/components/dashboard/DagSupplementen';
import DagHeader from '@/components/dashboard/DagHeader';
import MacroTiles from '@/components/dashboard/MacroTiles';
import { Zap, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [todayLog, setTodayLog] = useState(null);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    try {
      const log = await DailyLog.getByDate(today);
      setTodayLog(log);
    } catch (err) {
      console.error('Dashboard loadData error', err);
      setTodayLog(null);
    } finally {
      setLoading(false);
    }
  }

  async function refreshLog() {
    try {
      const log = await DailyLog.getByDate(today);
      setTodayLog(log);
    } catch (err) {
      console.error('Dashboard refreshLog error', err);
    }
  }

  // Onboarding nog niet gedaan — accepteer beide velden (Supabase schema
  // gebruikt onboarding_complete, sommige legacy rijen hebben onboarding_done)
  const onboardingDone = profile?.onboarding_complete ?? profile?.onboarding_done;
  if (!loading && !onboardingDone) {
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
    <div className="w-full max-w-3xl mx-auto px-4 py-6 pb-8 space-y-5">
      <DagHeader user={user} profile={profile} loading={loading} />

      {!loading && profile && (
        <>
          <DagTraining profile={profile} todayLog={todayLog} onLogUpdate={refreshLog} />
          <MacroTiles profile={profile} />
          <DagVoeding profile={profile} todayLog={todayLog} today={today} />
          <DagSupplementen profile={profile} />
          <DagWelzijn profile={profile} todayLog={todayLog} onLogUpdate={refreshLog} />
        </>
      )}

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-14 rounded-2xl" />
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      )}
    </div>
  );
}
