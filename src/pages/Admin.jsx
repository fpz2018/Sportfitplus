import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import {
  FlaskConical, Lightbulb, Upload, TrendingUp, Newspaper,
  ChefHat, Pill, Brain, Users, FileText, BookOpen,
  ShieldCheck, Loader2, LogOut, Eye, EyeOff, Database
} from 'lucide-react';

// ─── Supabase stats ────────────────────────────────────────────────────────

const fetchStats = async () => {
  const results = await Promise.all([
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('recipes').select('*', { count: 'exact', head: true }),
    supabase.from('nieuwsberichten').select('*', { count: 'exact', head: true }),
    supabase.from('supplements').select('*', { count: 'exact', head: true }),
    supabase.from('kennis_artikelen').select('*', { count: 'exact', head: true }),
    supabase.from('bron_bestanden').select('*', { count: 'exact', head: true }),
  ]);
  const [users, recepten, nieuws, supplementen, artikelen, bronnen] = results;
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
  { to: '/recepten-beheer',    icon: ChefHat,      label: 'Recepten beheer',      description: 'Recepten aanmaken, bewerken en publiceren',  color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { to: '/nieuwsbeheer',       icon: Newspaper,    label: 'Nieuwsbeheer',         description: 'Nieuwsberichten schrijven en publiceren',     color: 'text-blue-500',   bg: 'bg-blue-500/10'   },
  { to: '/supplementen-beheer',icon: Pill,         label: 'Supplementen beheer',  description: 'Supplementen en producten beheren',           color: 'text-green-500',  bg: 'bg-green-500/10'  },
  { to: '/kennis',             icon: FlaskConical, label: 'Literatuurmonitor',    description: 'Wetenschappelijke artikelen monitoren',       color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { to: '/kennis-update',      icon: Brain,        label: 'Kennis Update',        description: 'AI-kennisbank bijwerken',                     color: 'text-pink-500',   bg: 'bg-pink-500/10'   },
  { to: '/voorstellen',        icon: Lightbulb,    label: 'Inhoudsvoorstellen',   description: 'AI-gegenereerde inhoudsuggesties',            color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { to: '/bronnen',            icon: Upload,       label: 'Bronbeheer',           description: 'Bronbestanden uploaden en beheren',           color: 'text-cyan-500',   bg: 'bg-cyan-500/10'   },
  { to: '/coach-analytics',    icon: TrendingUp,   label: 'Coach Analytics',      description: 'Gebruikersdata en voortgang inzien',          color: 'text-red-500',    bg: 'bg-red-500/10'    },
  { to: '/content-bronnen',   icon: Database,     label: 'Content Bronnen',      description: 'Configureer nachtelijke artikel-sync bronnen', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { to: '/gebruikers',        icon: Users,        label: 'Gebruikersbeheer',     description: 'Gebruikers bekijken, wijzigen en activiteit inzien', color: 'text-teal-500',   bg: 'bg-teal-500/10'   },
];

const statCards = [
  { key: 'users',       label: 'Gebruikers',      icon: Users,      color: 'text-blue-500',   bg: 'bg-blue-500/10'   },
  { key: 'recepten',    label: 'Recepten',         icon: ChefHat,    color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { key: 'nieuws',      label: 'Nieuwsberichten',  icon: Newspaper,  color: 'text-green-500',  bg: 'bg-green-500/10'  },
  { key: 'supplementen',label: 'Supplementen',     icon: Pill,       color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { key: 'artikelen',   label: 'Kennisartikelen',  icon: BookOpen,   color: 'text-pink-500',   bg: 'bg-pink-500/10'   },
  { key: 'bronnen',     label: 'Bronbestanden',    icon: FileText,   color: 'text-cyan-500',   bg: 'bg-cyan-500/10'   },
];

// ─── Login form ────────────────────────────────────────────────────────────

function AdminLogin({ onLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('Ongeldig e-mailadres of wachtwoord.');
      setLoading(false);
      return;
    }

    // Controleer of de gebruiker admin-rol heeft
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      await supabase.auth.signOut();
      setError('Je hebt geen beheerderstoegang.');
      setLoading(false);
      return;
    }

    onLogin(data.user);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">Sportfit Plus beheer</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">E-mailadres</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="admin@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Wachtwoord</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Inloggen
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────

function AdminDashboard({ user, onLogout }) {
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchStats,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Topbalk */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm text-foreground">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">{user.email}</span>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Uitloggen</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-20 pb-8 space-y-8">
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
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function Admin() {
  const [adminUser, setAdminUser] = useState(null);
  const [checking, setChecking]  = useState(true);

  // Controleer bij mount of er al een actieve admin-sessie is
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role === 'admin') {
          setAdminUser(session.user);
        }
      }
      setChecking(false);
    };
    checkSession();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAdminUser(null);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!adminUser) {
    return <AdminLogin onLogin={setAdminUser} />;
  }

  return <AdminDashboard user={adminUser} onLogout={handleLogout} />;
}
