import { Link } from 'react-router-dom';
import { FlaskConical, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function DagSupplementen({ profile }) {
  const advies = profile?.supplement_advies || [];

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Supplementen vandaag</h2>
            <p className="text-xs text-muted-foreground">
              {advies.length > 0 ? `${advies.length} aanbevolen supplementen` : 'Jouw persoonlijk advies'}
            </p>
          </div>
        </div>
        <Link to="/supplementen" className="text-xs text-primary flex items-center gap-1 hover:underline shrink-0">
          Kennisbank <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {advies.length > 0 ? (
        <div className="space-y-2 mb-4">
          {advies.map((s, i) => (
            <div key={i} className="flex items-start gap-3 bg-secondary/50 rounded-xl px-3 py-2.5">
              <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{s.naam}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                  {s.dosering && <span className="text-xs text-muted-foreground">📏 {s.dosering}</span>}
                  {s.timing && <span className="text-xs text-muted-foreground">⏰ {s.timing}</span>}
                </div>
                {s.reden && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">{s.reden}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-secondary/40 rounded-xl p-4 mb-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Nog geen persoonlijk supplement advies</p>
          <p className="text-xs text-muted-foreground">Vul de onboarding in voor een AI-advies op maat, of blader door de kennisbank.</p>
        </div>
      )}

      <Link to="/supplementen"
        className="block text-center py-2.5 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:border-primary/40 transition-all">
        Supplement kennisbank bekijken
      </Link>
    </div>
  );
}