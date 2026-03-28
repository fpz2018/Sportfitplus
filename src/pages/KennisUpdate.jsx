import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Brain, RefreshCw, Loader2, ChevronDown, ChevronUp, CheckCircle, XCircle, Eye, Zap, Clock, BookOpen, FlaskConical, Dumbbell, Utensils, Calculator, User } from 'lucide-react';

const DOMEIN_ICONEN = {
  gids: BookOpen,
  calculator: Calculator,
  supplementen: FlaskConical,
  onboarding: User,
  training: Dumbbell,
  voeding: Utensils,
  algemeen: Brain,
};

const DOMEIN_LABELS = {
  gids: 'Gids',
  calculator: 'Calculator',
  supplementen: 'Supplementen',
  onboarding: 'Onboarding',
  training: 'Training',
  voeding: 'Voeding',
  algemeen: 'Algemeen',
};

const PRIORITEIT_STIJL = {
  hoog: 'bg-destructive/15 text-destructive border-destructive/30',
  middel: 'bg-accent/15 text-accent border-accent/30',
  laag: 'bg-secondary text-muted-foreground border-border',
};

const STATUS_STIJL = {
  nieuw: 'bg-primary/10 text-primary',
  bekeken: 'bg-secondary text-muted-foreground',
  toegepast: 'bg-green-500/15 text-green-400',
  afgewezen: 'bg-destructive/10 text-destructive/70',
};

export default function KennisUpdate() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [inzichten, setInzichten] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyseren, setAnalyseren] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [filterDomein, setFilterDomein] = useState('alle');
  const [filterStatus, setFilterStatus] = useState('nieuw');

  useEffect(() => {
    base44.auth.me().then(u => {
      setIsAdmin(u?.role === 'admin');
      if (u?.role === 'admin') laadData();
    });
  }, []);

  async function laadData() {
    setLoading(true);
    const [ins, rs] = await Promise.all([
      base44.entities.AppInzicht.list('-created_date', 100),
      base44.entities.KennisAnalyseRun.list('-created_date', 10),
    ]);
    setInzichten(ins);
    setRuns(rs);
    setLoading(false);
  }

  async function startAnalyse() {
    setAnalyseren(true);
    await base44.functions.invoke('kennisAnalyse', {});
    await laadData();
    setAnalyseren(false);
  }

  async function setStatus(inzicht, status) {
    await base44.entities.AppInzicht.update(inzicht.id, { status });
    setInzichten(prev => prev.map(i => i.id === inzicht.id ? { ...i, status } : i));
  }

  const gefilterd = inzichten.filter(i => {
    const matchDomein = filterDomein === 'alle' || i.domein === filterDomein;
    const matchStatus = filterStatus === 'alle' || i.status === filterStatus;
    return matchDomein && matchStatus;
  });

  const nieuw = inzichten.filter(i => i.status === 'nieuw').length;
  const laasteRun = runs[0];

  if (!isAdmin) return (
    <div className="p-6 text-center text-muted-foreground">Geen toegang. Alleen admins.</div>
  );

  return (
    <div className="p-4 pb-24 md:pb-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" /> Kennis Analyse
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Automatische analyse van kennisbank + literatuur → concrete verbetervoorstellen voor de hele app
            </p>
          </div>
          <button onClick={startAnalyse} disabled={analyseren}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60 shrink-0">
            {analyseren ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {analyseren ? 'Analyseren...' : 'Nu analyseren'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { l: 'Nieuwe inzichten', v: nieuw, color: nieuw > 0 ? 'text-primary' : 'text-muted-foreground' },
            { l: 'Toegepast', v: inzichten.filter(i => i.status === 'toegepast').length, color: 'text-green-400' },
            { l: 'Laatste analyse', v: laasteRun ? new Date(laasteRun.gestart_op).toLocaleDateString('nl-NL') : '—', color: 'text-muted-foreground' },
            { l: 'Totaal inzichten', v: inzichten.length, color: 'text-muted-foreground' },
          ].map(({ l, v, color }) => (
            <div key={l} className="bg-card border border-border rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">{l}</p>
              <p className={`text-xl font-bold ${color}`}>{v}</p>
            </div>
          ))}
        </div>

        {/* Laatste run info */}
        {laasteRun && (
          <div className={`rounded-xl p-3 border text-xs flex items-center gap-2 ${laasteRun.status === 'afgerond' ? 'bg-green-500/5 border-green-500/20 text-green-400' : laasteRun.status === 'bezig' ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-destructive/5 border-destructive/20 text-destructive'}`}>
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>
              Laatste run: {new Date(laasteRun.gestart_op).toLocaleString('nl-NL')} · {laasteRun.aantal_artikelen || 0} artikelen · {laasteRun.aantal_supplementen || 0} supplementen · {laasteRun.aantal_inzichten || 0} inzichten
              {laasteRun.samenvatting && <span className="ml-2 text-muted-foreground">— {laasteRun.samenvatting}</span>}
            </span>
          </div>
        )}

        {analyseren && (
          <div className="mt-3 bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">AI analyseert kennisbank en literatuur...</p>
              <p className="text-xs text-muted-foreground">Dit kan 30-60 seconden duren. De AI vergelijkt alle goedgekeurde literatuur en supplementen met de huidige app-inhoud.</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['alle', 'nieuw', 'bekeken', 'toegepast', 'afgewezen'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all capitalize ${filterStatus === s ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
            {s} {s === 'nieuw' && nieuw > 0 && <span className="ml-1 bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">{nieuw}</span>}
          </button>
        ))}
        <div className="h-5 w-px bg-border self-center" />
        {['alle', ...Object.keys(DOMEIN_LABELS)].map(d => (
          <button key={d} onClick={() => setFilterDomein(d)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${filterDomein === d ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:border-accent/40'}`}>
            {d === 'alle' ? 'Alle domeinen' : DOMEIN_LABELS[d]}
          </button>
        ))}
      </div>

      {/* Inzichten lijst */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : gefilterd.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
          <Brain className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground text-sm">
            {inzichten.length === 0
              ? 'Nog geen inzichten. Klik op "Nu analyseren" om de kennisbank te vergelijken met de app.'
              : 'Geen inzichten gevonden voor deze filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {gefilterd.map(inzicht => {
            const Icon = DOMEIN_ICONEN[inzicht.domein] || Brain;
            const isOpen = expanded === inzicht.id;
            return (
              <div key={inzicht.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : inzicht.id)}
                  className="w-full flex items-start justify-between p-5 text-left hover:bg-secondary/20 transition-all gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full capitalize">
                          {DOMEIN_LABELS[inzicht.domein] || inzicht.domein}
                        </span>
                        {inzicht.prioriteit && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${PRIORITEIT_STIJL[inzicht.prioriteit]}`}>
                            {inzicht.prioriteit}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STIJL[inzicht.status]}`}>
                          {inzicht.status}
                        </span>
                      </div>
                      <p className="font-semibold text-foreground text-sm leading-snug">{inzicht.titel}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{inzicht.samenvatting}</p>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />}
                </button>

                {isOpen && (
                  <div className="border-t border-border p-5 space-y-4">
                    <p className="text-sm text-foreground leading-relaxed">{inzicht.samenvatting}</p>

                    {inzicht.huidige_waarde && (
                      <div className="bg-secondary/40 rounded-xl p-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">📌 HUIDIGE APP INHOUD</p>
                        <p className="text-sm text-muted-foreground">{inzicht.huidige_waarde}</p>
                      </div>
                    )}

                    {inzicht.aanbevolen_wijziging && (
                      <div className="bg-primary/8 border border-primary/20 rounded-xl p-4">
                        <p className="text-xs font-semibold text-primary mb-2">✏️ AANBEVOLEN WIJZIGING</p>
                        <p className="text-sm text-foreground leading-relaxed">{inzicht.aanbevolen_wijziging}</p>
                      </div>
                    )}

                    {inzicht.onderbouwing && (
                      <div className="bg-secondary/30 rounded-xl p-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">🔬 WETENSCHAPPELIJKE ONDERBOUWING</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{inzicht.onderbouwing}</p>
                      </div>
                    )}

                    {inzicht.bron_artikelen?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">📚 BRONNEN</p>
                        <ul className="space-y-1">
                          {inzicht.bron_artikelen.map((b, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex gap-2">
                              <span className="text-primary">•</span> {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Acties */}
                    {inzicht.status === 'nieuw' && (
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => setStatus(inzicht, 'bekeken')}
                          className="flex items-center gap-1.5 px-3 py-2 border border-border text-muted-foreground rounded-lg text-xs font-medium hover:border-primary/40 hover:text-foreground transition-all">
                          <Eye className="w-3.5 h-3.5" /> Bekeken
                        </button>
                        <button onClick={() => setStatus(inzicht, 'afgewezen')}
                          className="flex items-center gap-1.5 px-3 py-2 border border-destructive/30 text-destructive/70 rounded-lg text-xs font-medium hover:bg-destructive/10 transition-all">
                          <XCircle className="w-3.5 h-3.5" /> Afwijzen
                        </button>
                        <button onClick={() => setStatus(inzicht, 'toegepast')}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-all">
                          <CheckCircle className="w-3.5 h-3.5" /> Markeer als toegepast
                        </button>
                      </div>
                    )}
                    {inzicht.status === 'bekeken' && (
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => setStatus(inzicht, 'afgewezen')}
                          className="flex items-center gap-1.5 px-3 py-2 border border-destructive/30 text-destructive/70 rounded-lg text-xs font-medium hover:bg-destructive/10 transition-all">
                          <XCircle className="w-3.5 h-3.5" /> Afwijzen
                        </button>
                        <button onClick={() => setStatus(inzicht, 'toegepast')}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-all">
                          <CheckCircle className="w-3.5 h-3.5" /> Markeer als toegepast
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Gegenereerd op {new Date(inzicht.created_date).toLocaleString('nl-NL')}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}