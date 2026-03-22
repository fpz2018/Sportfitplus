import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Calculator, Dumbbell, BookOpen, BarChart2, Utensils, User, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/calculator', icon: Calculator, label: 'TDEE Calculator' },
  { to: '/schemas', icon: Dumbbell, label: 'Trainingsschema\'s' },
  { to: '/voeding', icon: Utensils, label: 'Voeding' },
  { to: '/voortgang', icon: BarChart2, label: 'Voortgang' },
  { to: '/gids', icon: BookOpen, label: 'Droog Gids' },
  { to: '/profiel', icon: User, label: 'Profiel' },
];

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-sidebar shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-lg text-foreground tracking-tight">DroogFit</span>
              <p className="text-xs text-muted-foreground">Cut Planner</p>
            </div>
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

        {/* Premium badge */}
        <div className="p-4 border-t border-border">
          <Link to="/premium" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-all">
            <Lock className="w-4 h-4" />
            Upgrade naar Premium
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around py-2 z-50">
          {navItems.slice(0, 5).map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to} className={cn(
                'flex flex-col items-center gap-1 px-2 py-1',
                active ? 'text-primary' : 'text-muted-foreground'
              )}>
                <Icon className="w-5 h-5" />
                <span className="text-xs">{label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}