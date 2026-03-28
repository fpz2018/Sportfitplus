import { Lock, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * PremiumGate — wrap premium content with this component.
 *
 * Usage:
 *   <PremiumGate isPremium={profile?.is_premium} feature="AI weekmenu generator">
 *     <MyPremiumContent />
 *   </PremiumGate>
 *
 * Props:
 *   isPremium  — boolean, whether the user has premium access
 *   feature    — string, name of the feature being locked (shown in the overlay)
 *   preview    — boolean (default true), if true shows blurred children behind the gate
 *   children   — the premium content
 */
export default function PremiumGate({ isPremium, feature = 'deze functie', preview = true, children }) {
  if (isPremium) return <>{children}</>;

  return (
    <div className="relative">
      {/* Blurred preview */}
      {preview && (
        <div className="pointer-events-none select-none">
          <div className="blur-sm opacity-40 max-h-64 overflow-hidden">
            {children}
          </div>
          {/* Fade out bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card to-transparent" />
        </div>
      )}

      {/* Lock overlay */}
      <div className={`${preview ? 'absolute inset-0 flex items-end justify-center pb-6' : 'py-12'}`}>
        <div className="bg-card border border-primary/30 rounded-2xl p-6 mx-4 text-center shadow-2xl max-w-sm w-full">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-bold text-foreground mb-1">Premium functie</h3>
          <p className="text-sm text-muted-foreground mb-4">
            <span className="text-foreground font-medium capitalize">{feature}</span> is beschikbaar in Sportfit Plus Premium.
          </p>
          <div className="space-y-2">
            <Link to="/premium"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all">
              <Zap className="w-4 h-4" /> Upgrade naar Premium
            </Link>
            <p className="text-xs text-muted-foreground">Vanaf €9,99/maand · 14 dagen gratis proberen</p>
          </div>
        </div>
      </div>
    </div>
  );
}