import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Calculator, Dumbbell, BookOpen, BarChart2, Utensils, User, Lock, ChefHat, FlaskConical, Lightbulb, Upload, Newspaper, CalendarDays, TrendingUp, Menu, X, Pill } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import NotificationBell from '../NotificationBell';
import LanguageSwitcher from '../LanguageSwitcher';

const navItemsConfig = [
  { to: '/', icon: LayoutDashboard, labelKey: 'dashboard' },
  { to: '/calculator', icon: Calculator, labelKey: 'calculator' },
  { to: '/schemas', icon: Dumbbell, labelKey: 'trainingsSchemas' },
  { to: '/voeding', icon: Utensils, labelKey: 'voeding' },
  { to: '/recepten', icon: ChefHat, labelKey: 'recepten' },
  { to: '/weekmenu', icon: CalendarDays, labelKey: 'weekmenu' },
  { to: '/voortgang', icon: BarChart2, labelKey: 'voortgang' },
  { to: '/mijn-voortgang', icon: TrendingUp, labelKey: 'mijnVoortgang' },
  { to: '/gids', icon: BookOpen, labelKey: 'gids' },
  { to: '/profiel', icon: User, labelKey: 'profiel' },
  { to: '/nieuws', icon: Newspaper, labelKey: 'nieuws' },
  { to: '/supplementen', icon: Pill, labelKey: 'supplementen' },
];

const adminNavItemsConfig = [
  { to: '/kennis', icon: FlaskConical, labelKey: 'literatuurmonitor' },
  { to: '/voorstellen', icon: Lightbulb, labelKey: 'inhoudsvoorstellen' },
  { to: '/bronnen', icon: Upload, labelKey: 'bronbeheer' },
  { to: '/coach-analytics', icon: TrendingUp, labelKey: 'coachAnalytics' },
  { to: '/nieuwsbeheer', icon: Newspaper, labelKey: 'nieuwsbeheer' },
  { to: '/recepten-beheer', icon: ChefHat, labelKey: 'receptenBeheer' },
  { to: '/supplementen-beheer', icon: Pill, labelKey: 'supplementenBeheer' },
];

export default function AppLayout() {
  const location = useLocation();
  const { t } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => setIsAdmin(u?.role === 'admin'));
  }, []);

  const navItems = navItemsConfig.map(item => ({ ...item, label: t(item.labelKey) }));
  const adminNavItems = adminNavItemsConfig.map(item => ({ ...item, label: t(item.labelKey) }));

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-sidebar border-b border-border z-40 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm text-foreground">Sportfit</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <LanguageSwitcher />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-black/50 z-30" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-card h-full w-64 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <nav className="p-4 space-y-1">
              {navItems.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    location.pathname === to
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              ))}
            </nav>
            {isAdmin && (
              <div className="px-4 py-2 border-t border-border mt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">{t('kennissysteem')}</p>
                {adminNavItems.map(({ to, icon: Icon, label }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all mb-1',
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
          </div>
        </div>
      )}

      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-sidebar shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-border flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-lg text-foreground tracking-tight">Sportfit Plus</span>
              <p className="text-xs text-muted-foreground">Jouw fitness app</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <LanguageSwitcher />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Admin sectie */}
        {isAdmin && (
          <div className="px-4 pb-2 border-t border-border pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Kennissysteem</p>
            {adminNavItems.map(({ to, icon: Icon, label }) => {
              const active = location.pathname === to;
              return (
                <Link key={to} to={to}
                  className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all mb-1',
                    active ? 'bg-primary/15 text-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground')}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Premium badge */}
        <div className="p-4 border-t border-border">
          <Link to="/premium" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-all">
            <Lock className="w-4 h-4" />
            {t('upgradePremium')}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen pt-16 md:pt-0">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}