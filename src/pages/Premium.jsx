import { Link } from 'react-router-dom';
import { Dumbbell, Zap, Check, Lock, ArrowLeft } from 'lucide-react';

const PREMIUM_FEATURES = [
  '🤖 Onbeperkt AI trainingsschema\'s genereren',
  '💊 Persoonlijk supplement advies op basis van jouw profiel',
  '🥗 Volledige weekmenu\'s met AI + boodschappenlijst',
  '📊 Macro & voeding logging',
  '📈 Geavanceerde voortgang & correlatie analytics',
  '🧘 AI welzijn & hersteladvies',
  '🏋️ AI schema aanpassingen op basis van voortgang',
  '⭐ Prioriteit klantenservice',
];

export default function Premium() {
  return (
    <div className="p-4 pb-24 md:pb-8 max-w-lg mx-auto">
      <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-all">
        <ArrowLeft className="w-4 h-4" /> Terug
      </Link>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Sportfit Plus Premium</h1>
        <p className="text-muted-foreground text-sm">Unlock alle AI-functies en haal het maximale uit je training</p>
      </div>

      {/* Prijs */}
      <div className="bg-card border-2 border-primary rounded-2xl p-7 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="text-center mb-6">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Premium plan</p>
          <div className="flex items-end justify-center gap-1 mb-1">
            <span className="text-5xl font-extrabold text-foreground">€9,99</span>
            <span className="text-muted-foreground mb-2">/maand</span>
          </div>
          <p className="text-xs text-muted-foreground">14 dagen gratis proberen · Opzeggen wanneer je wilt</p>
        </div>

        <ul className="space-y-3 mb-7">
          {PREMIUM_FEATURES.map(f => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
              <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {/* CTA — klaar voor Stripe later */}
        <div className="bg-secondary/50 border border-border rounded-xl p-4 text-center">
          <Lock className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground mb-1">Binnenkort beschikbaar</p>
          <p className="text-xs text-muted-foreground">Premium activering via betalingen komt binnenkort. Neem contact op met de beheerder voor vroege toegang.</p>
        </div>
      </div>

      {/* Back to app */}
      <div className="text-center">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-all">
          Terug naar de app →
        </Link>
      </div>
    </div>
  );
}