import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import {
  FlaskConical, Lightbulb, Upload, TrendingUp, Newspaper,
  ChefHat, Pill, Brain, Users, FileText, BookOpen,
  ShieldCheck, Loader2
} from 'lucide-react';

// ─── Stats ophalen via Supabase count ─────────────────────────────────────

const fetchStats = async () => {
  const queries = await Promise.all([
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('recipes').select('*', { count: 'exact', head: true }),
    supabase.from('nieuwsberichten').select('*', { count: 'exact', head: true }),
    supabase.from('supplements').select('*', { count: 'exact', head: true }),
    supabase.from('kennis_artikelen').select('*', { count: 'exact', head: true }),
    supabase.from('bron_bestanden').select('*', { count: 'exact', head: true }),
  ]);

  const [users, recepten, nieuws, supplementen, artikelen, bronnen] = queries;
  return {
    users: users.count ?? 0,
    recepten: recepten.count ?? 0,
    nieuws: nieuws.count ?? 0,
    supplementen: supplementen.count ?? 0,
    artikelen: artikelen.count ?? 0,
    bronnen: bronnen.count ?? 0,
  };
};

// ─── Config ────────────────────────────────────────────────────────────────

const adminSections = [
  {
    to: '/recepten-beheer',
    icon: ChefHat,
    label: 'Recepten beheer',
    description: 'Recepten aanmaken, bewerken en publiceren',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    to: '/nieuwsbeheer',
    icon: Newspaper,
    label: 'Nieuwsbeheer',
    description: 'Nieuwsberichten schrijven en publiceren',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    to: '/supplementen-beheer',
    icon: Pill,
    label: 'Supplementen beheer',
    description: 'Supplementen en producten beheren',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    to: '/kennis',
    icon: FlaskConical,
    label: 'Literatuurmonitor',
    description: 'Wetenschappelijke artikelen monitoren',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    to: '/kennis-update',
    icon: Brain,
    label: 'Kennis Update',
    description: 'AI-kennisbank bijwerken',
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
  },
  {
    to: '/voorstellen',
    icon: Lightbulb,
    label: 'Inhoudsvoorstellen',
    description: 'AI-gegenereerde inhoudsuggesties',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
  {
    to: '/bronnen',
    icon: Upload,
    label: 'Bronbeheer',
    description: 'Bronbestanden uploaden en beheren',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
  {
    to: '/coach-analytics',
    icon: TrendingUp,
    label: 'Coach Analytics',
    description: 'Gebruikersdata en voortgang inzien',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
];

const statCards = [
  { key: 'users', label: 'Gebruikers', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { key: 'recepten', label: 'Recepten', icon: ChefHat, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { key: 'nieuws', label: 'Nieuwsberichten', icon: Newspaper, color: 'text-green-500', bg: 'bg-green-500/10' },
  { key: 'supplementen', label: 'Supplementen', icon: Pill, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { key: 'artikelen', label: 'Kennisartikelen', icon: BookOpen, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  { key: 'bronnen', label: 'Bronbestanden', icon: FileText, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
];

// ─── Component ─────────────────────────────────────────────────────────────

export default function Admin() {
  const { profile, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoadingAuth && profile?.role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [isLoadingAuth, profile, navigate]);

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchStats,
    enabled: profile?.role === 'admin',
  });

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (profile?.role !== 'admin') return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Admin</h1>
          <p className="text-sm text-muted-foreground">Beheer van content en gebruikers</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {statCards.map(({ key, label, icon: Icon, color, bg }) => (
          <div key={key} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{label}</p>
              <p className="text-lg font-bold text-foreground leading-tight">
                {isLoadingStats ? <span className="text-muted-foreground text-sm">…</span> : stats?.[key]}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Beheer-modules */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Beheer</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {adminSections.map(({ to, icon: Icon, label, description, color, bg }) => (
            <Link
              key={to}
              to={to}
              className="rounded-xl border border-border bg-card p-4 flex items-start gap-3 hover:bg-secondary/50 transition-colors"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
