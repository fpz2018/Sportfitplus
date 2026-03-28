import { Link } from 'react-router-dom';
import { Dumbbell, Brain, Utensils, BarChart2, FlaskConical, HeartPulse, ChefHat, Zap, Check, Star, Lock, ArrowRight, Sparkles, Shield, Trophy } from 'lucide-react';

const FEATURES = [
  {
    icon: Brain,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    title: 'AI Trainingsschema\'s',
    desc: 'Gepersonaliseerde schema\'s op basis van jouw doel, ervaring en beschikbare tijd. Kracht, hypertrofie, HIIT of tabata.',
    free: 'Bekijk 1 voorbeeldschema',
    premium: 'Onbeperkt AI schema\'s genereren',
  },
  {
    icon: Utensils,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    title: 'Voeding & Macro Tracking',
    desc: 'Wekelijks menu, recepten, boodschappenlijst en dagelijkse macro-tracking. Volledig afgestemd op jouw calorie- en eiwitdoel.',
    free: 'Zie je dagdoelen',
    premium: 'Volledige weekmenu\'s & logging',
  },
  {
    icon: FlaskConical,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    title: 'Supplement Kennisbank',
    desc: 'Wetenschappelijk onderbouwde supplementinformatie met evidence levels A-D, doseringen en timing.',
    free: 'Bekijk de kennisbank',
    premium: 'Persoonlijk AI supplement advies',
  },
  {
    icon: BarChart2,
    color: 'text-accent',
    bg: 'bg-accent/10',
    title: 'Voortgang & Analytics',
    desc: 'Gewichtstrend, krachtontwikkeling, calorieënbalans en correlatie-analyse over weken en maanden.',
    free: 'Log je gewicht',
    premium: 'Geavanceerde analytics & trends',
  },
  {
    icon: HeartPulse,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    title: 'HRV & Welzijn',
    desc: 'Dagelijkse energiescore op basis van HRV, slaap en stress. AI geeft hersteladvies specifiek voor jou.',
    free: 'Check je energiescore',
    premium: 'AI welzijnsadvies & trendanalyse',
  },
  {
    icon: ChefHat,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    title: 'Recepten & Weekmenu',
    desc: 'Honderden gezonde recepten met volledige voedingswaarden. AI genereert een weekmenu op basis van jouw macrodoel.',
    free: 'Blader door recepten',
    premium: 'AI weekmenu generator',
  },
];

const TESTIMONIALS = [
  {
    name: 'Sander V.',
    role: 'Gevorderd, 34 jaar',
    avatar: '💪',
    text: 'Na 3 maanden Sportfit Plus ben ik 8 kg afgevallen zonder spierverlies. De AI schema\'s en het supplement advies zijn echt op een ander niveau.',
    stars: 5,
  },
  {
    name: 'Lisa K.',
    role: 'Beginner, 28 jaar',
    avatar: '🌱',
    text: 'Eindelijk een app die écht uitlegt waarom je iets doet. Van de gids tot het weekmenu — alles klopt wetenschappelijk én is makkelijk te volgen.',
    stars: 5,
  },
  {
    name: 'Marco B.',
    role: 'Atleet, 41 jaar',
    avatar: '🏅',
    text: 'De HRV tracker en het hersteladvies hebben mijn training compleet veranderd. Ik weet nu precies wanneer ik moet pushen en wanneer ik moet rusten.',
    stars: 5,
  },
];

const PLAN_FREE = [
  'TDEE calculator',
  'Trainingsschema\'s (1 voorbeeld)',
  'Supplement kennisbank bekijken',
  'Recepten bladeren',
  'Dagelijkse gewicht logging',
  'HRV energiescore (basis)',
  'Droogtrainen gids',
];

const PLAN_PREMIUM = [
  'Alles van Gratis',
  'Onbeperkt AI trainingsschema\'s',
  'Persoonlijk supplement advies',
  'Volledig weekmenu met AI',
  'Macro & voeding logging',
  'Geavanceerde voortgang analytics',
  'AI welzijn & hersteladvies',
  'Prioriteit klantenservice',
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">Sportfit Plus</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#prijzen" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-all">Prijzen</a>
            <Link to="/dashboard" className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground border border-border hover:border-primary/40 transition-all">
              Inloggen
            </Link>
            <Link to="/onboarding" className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
              Gratis starten
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-4 text-center relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
            <Sparkles className="w-3 h-3" /> Wetenschappelijk onderbouwde fitness & voeding AI
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-tight mb-6">
            Jouw{' '}
            <span className="text-primary">slimste</span>{' '}
            fitness<br />
            coach zit in je pocket
          </h1>

          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Sportfit Plus combineert wetenschappelijk bewijs, AI-personalisatie en praktische tools om jou te helpen afslanken, spieren opbouwen of gezonder leven — op jouw tempo.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link to="/onboarding"
              className="flex items-center gap-2 px-7 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold text-base hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
              Gratis beginnen <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features"
              className="flex items-center gap-2 px-7 py-4 border border-border text-foreground rounded-2xl font-medium text-base hover:border-primary/40 transition-all">
              Bekijk features
            </a>
          </div>

          <p className="text-xs text-muted-foreground mt-4">Geen creditcard nodig • Altijd gratis basisversie</p>
        </div>

        {/* Stats row */}
        <div className="relative max-w-2xl mx-auto mt-16 grid grid-cols-3 gap-4">
          {[
            { n: '10.000+', l: 'Actieve gebruikers' },
            { n: '95%', l: 'Behaalt doel binnen 12 weken' },
            { n: '4.9 ⭐', l: 'Gemiddelde beoordeling' },
          ].map(({ n, l }) => (
            <div key={l} className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{n}</p>
              <p className="text-xs text-muted-foreground mt-1">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Alles wat je nodig hebt</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Van trainingsschema tot supplement advies — één app, volledig gepersonaliseerd op jou.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(feat => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-all group">
                  <div className={`w-11 h-11 ${feat.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${feat.color}`} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feat.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{feat.desc}</p>
                  <div className="space-y-1.5 border-t border-border pt-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>Gratis: {feat.free}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-primary font-medium">
                      <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Premium: {feat.premium}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section className="py-20 px-4 bg-card/50 border-y border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-3">Hoe het werkt</h2>
          <p className="text-muted-foreground mb-14">In 3 stappen naar een gepersonaliseerd programma</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '🎯', title: 'Vertel je doel', desc: 'Vul de slimme onboarding in. Jouw doelen, activiteitsniveau, slaap, stress en eetpatroon.' },
              { step: '02', icon: '🤖', title: 'AI maakt jouw plan', desc: 'Op basis van wetenschappelijke literatuur en jouw profiel krijg je direct een schema, macro\'s en supplement advies.' },
              { step: '03', icon: '📈', title: 'Log, volg & verbeter', desc: 'Dagelijks bijhouden is makkelijk. De app leert van jouw data en past aanbevelingen automatisch aan.' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  {icon}
                </div>
                <p className="text-xs text-primary font-bold mb-1">{step}</p>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-3">Wat gebruikers zeggen</h2>
            <p className="text-muted-foreground">Duizenden mensen behaalden al hun doel</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIJZEN ─────────────────────────────────────────── */}
      <section id="prijzen" className="py-20 px-4 bg-card/50 border-y border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-3">Simpele, eerlijke prijzen</h2>
            <p className="text-muted-foreground">Begin gratis. Upgrade wanneer je klaar bent voor meer.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">

            {/* Gratis */}
            <div className="bg-card border border-border rounded-2xl p-7">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Gratis</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-extrabold text-foreground">€0</span>
                <span className="text-muted-foreground text-sm mb-1">/maand</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Altijd gratis. Geen creditcard.</p>
              <ul className="space-y-2.5 mb-8">
                {PLAN_FREE.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/onboarding"
                className="block w-full py-3 rounded-xl border border-border text-center font-medium text-sm hover:border-primary/40 transition-all">
                Gratis starten
              </Link>
            </div>

            {/* Premium */}
            <div className="bg-card border-2 border-primary rounded-2xl p-7 relative overflow-hidden">
              <div className="absolute top-4 right-4 flex items-center gap-1 bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                <Trophy className="w-3 h-3" /> Populair
              </div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Premium</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-extrabold text-foreground">€9,99</span>
                <span className="text-muted-foreground text-sm mb-1">/maand</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Alles unlocked. Opzeggen wanneer je wilt.</p>
              <ul className="space-y-2.5 mb-8">
                {PLAN_PREMIUM.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <Zap className="w-4 h-4 text-primary shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/onboarding"
                className="block w-full py-3 rounded-xl bg-primary text-primary-foreground text-center font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                Premium proberen →
              </Link>
              <p className="text-xs text-muted-foreground text-center mt-3">14 dagen gratis proberen</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="py-24 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Dumbbell className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Klaar om te starten?</h2>
          <p className="text-muted-foreground mb-8 text-lg">Vul in 2 minuten de onboarding in en krijg direct jouw persoonlijk programma.</p>
          <Link to="/onboarding"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold text-base hover:bg-primary/90 transition-all shadow-lg shadow-primary/25">
            Gratis beginnen <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-xs text-muted-foreground mt-4">Geen creditcard • Altijd gratis basisversie</p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Dumbbell className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm text-foreground">Sportfit Plus</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Sportfit Plus. Wetenschappelijk onderbouwd.</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5" /> Privacy-first · Geen advertenties
          </div>
        </div>
      </footer>

    </div>
  );
}