import { Link } from 'react-router-dom';
import { Dumbbell, Brain, Utensils, BarChart2, FlaskConical, HeartPulse, ChefHat, Zap, Check, Star, Lock, ArrowRight, Sparkles, Shield, Trophy, Users } from 'lucide-react';

const FEATURES = [
  {
    icon: Brain,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    title: 'Persoonlijk beweegplan',
    desc: 'Of je nu wilt wandelen, licht fitnessen, revalideren of intensief trainen — het plan past zich aan jouw tempo, leeftijd en mogelijkheden aan.',
    free: 'Bekijk 1 voorbeeldplan',
    premium: 'Onbeperkt AI-plannen op maat',
  },
  {
    icon: Utensils,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    title: 'Voeding & Macro Coaching',
    desc: 'Wekelijks menu, recepten, boodschappenlijst en dagelijkse tracking. Aangepast aan allergieën, darmklachten, diëten en calorie­doelen.',
    free: 'Zie je dagdoelen',
    premium: 'Volledige weekmenu\'s & logging',
  },
  {
    icon: FlaskConical,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    title: 'Supplement Kennisbank',
    desc: 'Wetenschappelijk onderbouwde informatie over supplementen — voor energie, darmen, immuunsysteem, slaap en meer.',
    free: 'Bekijk de kennisbank',
    premium: 'Persoonlijk AI supplement advies',
  },
  {
    icon: BarChart2,
    color: 'text-accent',
    bg: 'bg-accent/10',
    title: 'Voortgang & Inzichten',
    desc: 'Volg gewicht, energie, slaap en welzijn over weken en maanden. Begrijp welke factoren jouw gezondheid echt beïnvloeden.',
    free: 'Log je dagelijkse data',
    premium: 'Geavanceerde analytics & trends',
  },
  {
    icon: HeartPulse,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    title: 'Herstel & Welzijn',
    desc: 'Dagelijkse energiescore op basis van slaap, stress en herstel. AI geeft concreet advies over rust, ontspanning en leefstijl.',
    free: 'Check je energiescore',
    premium: 'AI welzijnsadvies & trendanalyse',
  },
  {
    icon: ChefHat,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    title: 'Recepten & Weekmenu',
    desc: 'Honderden gezonde recepten — ook voor gevoelige darmen, ouderen of specifieke diëten. AI stelt een weekmenu samen dat echt bij je past.',
    free: 'Blader door recepten',
    premium: 'AI weekmenu generator',
  },
];

const TESTIMONIALS = [
  {
    name: 'Ria de Vries',
    role: '67 jaar, meer energie & minder gewrichtsklachten',
    avatar: '🌿',
    text: 'Ik dacht dat dit soort apps alleen voor jonge sporters was. Maar Sportfit Plus stelde een beweeg- en voedingsplan op dat écht bij mij past. In 10 weken voel ik me fitter dan in jaren.',
    stars: 5,
  },
  {
    name: 'Thomas H.',
    role: '34 jaar, darmproblemen & vermoeidheid',
    avatar: '🌱',
    text: 'Na jarenlang last van mijn darmen eindelijk een aanpak die werkt. Het voedingsplan houdt rekening met mijn intoleranties en de supplementadviezen zijn wetenschappelijk onderbouwd.',
    stars: 5,
  },
  {
    name: 'Sandra B.',
    role: '45 jaar, afslanken & meer energie',
    avatar: '✨',
    text: 'Geen dieet maar een leefstijlverandering. De weekmenu\'s zijn lekker, realistisch en passen bij mijn drukke leven. De AI past het plan steeds aan op basis van mijn voortgang.',
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
            <Sparkles className="w-3 h-3" /> Wetenschappelijk onderbouwde gezondheids- & leefstijlcoach
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-tight mb-6">
            Jouw persoonlijke{' '}
            <span className="text-primary">totaalcoach</span>{' '}
            —<br />
            voor iedereen
          </h1>

          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto leading-relaxed">
            Sportfit Plus is geen fitness-app. Het is een slimme gezondheidscoach die zich aanpast aan <em>jou</em> — of je nu 25 of 70 bent, wilt afslanken, last hebt van je darmen, meer energie wilt of gewoon gezonder wilt leven.
          </p>

          {/* Voor wie */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {['60+ & vitaal blijven', 'Darmklachten', 'Meer energie', 'Afvallen', 'Stress & slaap', 'Beginners', 'Sporters', 'Chronische klachten'].map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full bg-secondary border border-border text-xs text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>

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
            { n: 'Alle leeftijden', l: 'Van 18 tot 80+' },
            { n: '4.9 ⭐', l: 'Gemiddelde beoordeling' },
          ].map(({ n, l }) => (
            <div key={l} className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{n}</p>
              <p className="text-xs text-muted-foreground mt-1">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── VOOR WIE ────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-card/50 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Voor iedereen die gezonder wil leven</h2>
            <p className="text-muted-foreground">Sportfit Plus is geen sportschoolapp. Het is een persoonlijke gezondheidscoach — voor elke levensfase en elk lichaam.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '👴', title: '60+ & vitaal', desc: 'Meer energie, sterkere spieren en gewrichten. Op jouw tempo, veilig en verantwoord.' },
              { icon: '🩺', title: 'Klachten & herstel', desc: 'Darmklachten, vermoeidheid, hormonale schommelingen — het plan houdt er rekening mee.' },
              { icon: '🌱', title: 'Beginners', desc: 'Geen ervaring nodig. De coach legt alles uit en begeleidt je stap voor stap.' },
              { icon: '🏃', title: 'Actieve sporters', desc: 'Optimaliseer prestaties, herstel en voeding met wetenschappelijke onderbouwing.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-2xl p-5 text-center hover:border-primary/30 transition-all">
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-semibold text-foreground text-sm mb-2">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Alles wat je nodig hebt</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Van beweegplan tot voedingscoaching — één slimme coach, volledig afgestemd op jóuw situatie, klachten en doelen.</p>
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
              { step: '01', icon: '🎯', title: 'Vertel wie je bent', desc: 'Vul de slimme onboarding in: je leeftijd, klachten, doelen, eetpatroon, slaap en activiteitsniveau. Geen oordeel, geen aannames.' },
              { step: '02', icon: '🤖', title: 'AI maakt jouw plan', desc: 'Op basis van wetenschappelijke literatuur en jouw unieke profiel krijg je direct een persoonlijk beweeg-, voedings- en welzijnsplan.' },
              { step: '03', icon: '📈', title: 'Log, volg & verbeter', desc: 'Dagelijks bijhouden is makkelijk. De coach leert van jouw data en past het plan aan naarmate je vordert.' },
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
            <p className="text-muted-foreground">Begin gratis. Upgrade wanneer je klaar bent voor meer. Voor minder dan een kop koffie per week.</p>
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
                <span className="text-4xl font-extrabold text-foreground">€4,99</span>
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
              <p className="text-xs text-muted-foreground text-center mt-3">14 dagen gratis proberen · Minder dan €0,17/dag</p>
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
          <p className="text-muted-foreground mb-8 text-lg">Vul in 2 minuten de onboarding in en krijg direct jouw persoonlijk gezondheids- en leefstijlplan — volledig op maat.</p>
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