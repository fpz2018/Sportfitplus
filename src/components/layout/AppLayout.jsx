import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Calculator, Dumbbell, BookOpen, BarChart2, Utensils, User, Lock, ChefHat, FlaskConical, Lightbulb, Upload, Newspaper, CalendarDays, TrendingUp, Menu, X, Pill, Brain, HeartPulse, Bell, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import NotificationBell from '../NotificationBell';
import LanguageSwitcher from '../LanguageSwitcher';

const navItemsConfig = [
  { to: '/', icon: LayoutDashboard, label: 'Vandaag' },
  { to: '/schemas', icon: Dumbbell, label: 'Training' },
  { to: '/weekmenu', icon: CalendarDays, label: 'Weekmenu' },
  { to: '/voeding', icon: Utensils, label: 'Voeding' },
  { to: '/recepten', icon: ChefHat, label: 'Recepten' },
  { to: '/supplementen', icon: Pill, label: 'Supplementen' },
  { to: '/welzijn', icon: HeartPulse, label: 'Welzijn' },
  { to: '/voortgang', icon: BarChart2, label: 'Voortgang' },
  { to: '/mijn-voortgang', icon: TrendingUp, label: 'Mijn voortgang' },
  { to: '/gids', icon: BookOpen, label: 'Gids' },
  { to: '/nieuws', icon: Newspaper, label: 'Nieuws' },
  { to: '/calculator', icon: Calculator, label: 'Calculator' },
  { to: '/profiel', icon: User, label: 'Profiel' },
];

const adminNavItemsConfig = [
  { to: '/kennis', icon: FlaskConical, label: 'Literatuurmonitor' },
  { to: '/voorstellen', icon: Lightbulb, label: 'Inhoudsvoorstellen' },
  { to: '/bronnen', icon: Upload, label: 'Bronbeheer' },
  { to: '/coach-analytics', icon: TrendingUp, label: 'Coach Analytics' },
  { to: '/nieuwsbeheer', icon: Newspaper, label: 'Nieuwsbeheer' },
  { to: '/recepten-beheer', icon: ChefHat, label: 'Recepten beheer' },
  { to: '/supplementen-beheer', icon: Pill, label: 'Supplementen beheer' },
  { to: '/kennis-update', icon: Brain, label: 'Kennis Update' },
];

export default function AppLayout() {
  const location = useLocation();
  const { t } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => setIsAdmin(u?.role === 'admin'));
  }, []);

  // Sluit menu bij navigatie
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isDashboard = location.pathname === '/';

  // Breadcrumb
  const getBreadcrumb = () => {
    const allItems = [...navItemsConfig, ...adminNavItemsConfig];
    const current = allItems.find(item => item.to === location.pathname);
    return current ? current.label : null;
  };

  return (
    <div className="min-h-screen bg-background">

      {/* ── Minimalistische topbalk ── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo / terug naar vandaag + Breadcrumb */}
              <div className="flex items-center gap-2">
                <Link to="/" className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                    <Dumbbell className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                  {!isDashboard && (
                    <span className="font-semibold text-sm text-foreground">Sportfit Plus</span>
                  )}
                  {isDashboard && (
                    <span className="font-semibold text-sm text-foreground">Sportfit Plus</span>
                  )}
                </Link>
                {!isDashboard && getBreadcrumb() && (
                  <>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{getBreadcrumb()}</span>
                  </>
                )}
              </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <LanguageSwitcher />
            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-secondary transition-all text-muted-foreground hover:text-foreground"
              aria-label="Menu openen"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Drawer overlay ── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute top-0 right-0 h-full w-72 bg-card border-l border-border flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Dumbbell className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">Sportfit Plus</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {navItemsConfig.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    location.pathname === to
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              ))}

              {/* Admin sectie */}
              {isAdmin && (
                <div className="pt-4 mt-2 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Kennissysteem</p>
                  {adminNavItemsConfig.map(({ to, icon: Icon, label }) => (
                    <Link
                      key={to}
                      to={to}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all mb-0.5',
                        location.pathname === to
                          ? 'bg-primary/15 text-primary'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </nav>

            {/* Premium badge */}
            <div className="p-4 border-t border-border">
              <Link to="/premium"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-all">
                <Lock className="w-4 h-4" />
                Upgrade naar Premium
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Pagina-inhoud ── */}
      <main className="pt-14 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}