import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Brain, Loader2, ChevronDown, ChevronUp, CheckCircle, XCircle, Zap, Clock, BookOpen, FlaskConical, Dumbbell, Utensils, Calculator, User, Sparkles, ArrowRight, FileText, Code, Square, CheckSquare } from 'lucide-react';

const DOMEIN_ICONEN = {
  gids: BookOpen, calculator: Calculator, supplementen: FlaskConical,
  onboarding: User, training: Dumbbell, voeding: Utensils, algemeen: Brain,
};
const DOMEIN_LABELS = {
  gids: 'Gids', calculator: 'Calculator', supplementen: 'Supplementen',
  onboarding: 'Onboarding', training: 'Training', voeding: 'Voeding', algemeen: 'Algemeen',
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
  const [voorstellen, setVoorstellen] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyseren, setAnalyseren] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [filterDomein, setFilterDomein] = useState('alle');
  const [filterStatus, setFilterStatus] = useState('nieuw');
  const [actiefTab, setActiefTab] = useState('inzichten'); // 'inzichten' | 'voorstellen'
  const [codeTaken, setCodeTaken] = useState([]);
  const [bezig, setBezig] = useState({}); // { [inzicht_id]: boolean }
  const [verwerkBezig, setVerwerkBezig] = useState({}); // { [voorstel_id]: boolean }

  useEffect(() => {
    base44.auth.me().then(u => {
      setIsAdmin(u?.role === 'admin');
      if (u?.role === 'admin') laadData();
    });
  }, []);

  async function laadData() {
    setLoading(true);
    const [ins, rs, vs, taken] = await Promise.all([
      base44.entities.AppInzicht.list('-created_date', 100),
      base44.entities.KennisAnalyseRun.list('-created_date', 10),
      base44.entities.WijzigingsVoorstel.filter({ bron_type: 'pubmed' }, '-created_date', 50),
      base44.entities.CodeTaak.list('-created_date', 100),
    ]);
    setInzichten(ins);
    setRuns(rs);
    setVoorstellen(vs);
    setCodeTaken(taken);
    setLoading(false);
  }

  async function startAnalyse() {
    setAnalyseren(true);
    await base44.functions.invoke('kennisAnalyse', {});
    await laadData();
    setAnalyseren(false);
  }

  async function genereerVoorstel(inzicht) {
    setBezig(prev => ({ ...prev, [inzicht.id]: true }));
    const res = await base44.functions.invoke('verwerkInzicht', {
      actie: 'genereer_voorstel',
      inzicht_id: inzicht.id,
    });
    await laadData();
    setBezig(prev => ({ ...prev, [inzicht.id]: false }));
    // Schakel naar voorstellen-tab en toon het nieuwe voorstel
    setActiefTab('voorstellen');
    setExpanded(res.data?.voorstel_id || null);
  }

  async function afwijzenInzicht(inzicht) {
    await base44.entities.AppInzicht.update(inzicht.id, { status: 'afgewezen' });
    setInzichten(prev => prev.map(i => i.id === inzicht.id ? { ...i, status: 'afgewezen' } : i));
  }

  async function toepassenVoorstel(voorstel) {
    setVerwerkBezig(prev => ({ ...prev, [voorstel.id]: 'toepassen' }));
    await base44.functions.invoke('verwerkInzicht', { actie: 'toepassen', voorstel_id: voorstel.id });
    await laadData();
    setVerwerkBezig(prev => ({ ...prev, [voorstel.id]: null }));
  }

  async function afwijzenVoorstel(voorstel) {
    setVerwerkBezig(prev => ({ ...prev, [voorstel.id]: 'afwijzen' }));
    await base44.functions.invoke('verwerkInzicht', { actie: 'afwijzen', voorstel_id: voorstel.id });
    await laadData();
    setVerwerkBezig(prev => ({ ...prev, [voorstel.id]: null }));
  }

  const gefilterdInzichten = inzichten.filter(i => {
    const matchDomein = filterDomein === 'alle' || i.domein === filterDomein;
    const matchStatus = filterStatus === 'alle' || i.status === filterStatus;
    return matchDomein && matchStatus;
  });

  const pendingVoorstellen = voorstellen.filter(v => v.status === 'pending');
  const nieuw = inzichten.filter(i => i.status === 'nieuw').length;
  const openTaken = codeTaken.filter(t => t.status === 'open').length;
  const laasteRun = runs[0];

  async function vinkAfTaak(taak) {
    const nieuweStatus = taak.status === 'open' ? 'gedaan' : 'open';
    await base44.entities.CodeTaak.update(taak.id, {
      status: nieuweStatus,
      gedaan_op: nieuweStatus === 'gedaan' ? new Date().toISOString() : null,
    });
    setCodeTaken(prev => prev.map(t => t.id === taak.id ? { ...t, status: nieuweStatus } : t));
  }

  if (!isAdmin) return (
    <div className="p-6 text-center text-muted-foreground">Geen toegang. Alleen admins.</div>
  );

  return (
    <div className="p-4 pb-24 md:pb-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" /> Kennis Analyse
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Inzichten → concept-wijzigingen → jij keurt goed → automatisch doorgevoerd
            </p>
          </div>
          <button onClick={startAnalyse} disabled={analyseren}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60 shrink-0">
            {analyseren ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {analyseren ? 'Analyseren...' : 'Nu analyseren'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {[
            { l: 'Nieuwe inzichten', v: nieuw, color: nieuw > 0 ? 'text-primary' : 'text-muted-foreground' },
            { l: 'Wacht op review', v: pendingVoorstellen.length, color: pendingVoorstellen.length > 0 ? 'text-accent' : 'text-muted-foreground' },
            { l: 'Code taken open', v: openTaken, color: openTaken > 0 ? 'text-orange-400' : 'text-muted-foreground' },
            { l: 'Laatste analyse', v: laasteRun ? new Date(laasteRun.gestart_op).toLocaleDateString('nl-NL') : '—', color: 'text-muted-foreground' },
          ].map(({ l, v, color }) => (
            <div key={l} className="bg-card border border-border rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">{l}</p>
              <p className={`text-xl font-bold ${color}`}>{v}</p>
            </div>
          ))}
        </div>

        {laasteRun && (
          <div className="rounded-xl p-3 border text-xs flex items-center gap-2 bg-green-500/5 border-green-500/20 text-green-400">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Laatste run: {new Date(laasteRun.gestart_op).toLocaleString('nl-NL')} · {laasteRun.aantal_inzichten || 0} inzichten gegenereerd</span>
          </div>
        )}

        {analyseren && (
          <div className="mt-3 bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">AI analyseert kennisbank en literatuur...</p>
              <p className="text-xs text-muted-foreground">Dit kan 30–60 seconden duren.</p>
            </div>
          </div>
        )}
      </div>

      {/* Workflow uitleg */}
      <div className="bg-secondary/30 border border-border rounded-xl p-4 mb-5 flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><Brain className="w-3.5 h-3.5 text-primary" /> <strong className="text-foreground">1. Inzicht</strong></span>
        <ArrowRight className="w-3.5 h-3.5" />
        <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-accent" /> <strong className="text-foreground">2. AI genereert concept</strong></span>
        <ArrowRight className="w-3.5 h-3.5" />
        <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-blue-400" /> <strong className="text-foreground">3. Jij reviewt</strong></span>
        <ArrowRight className="w-3.5 h-3.5" />
        <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-green-400" /> <strong className="text-foreground">4. Automatisch doorgevoerd</strong></span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/40 rounded-xl p-1 mb-5">
        <button onClick={() => setActiefTab('inzichten')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${actiefTab === 'inzichten' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          Inzichten {nieuw > 0 && <span className="ml-1.5 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">{nieuw}</span>}
        </button>
        <button onClick={() => setActiefTab('voorstellen')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${actiefTab === 'voorstellen' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          Concept-wijzigingen {pendingVoorstellen.length > 0 && <span className="ml-1.5 bg-accent text-accent-foreground text-xs px-1.5 py-0.5 rounded-full">{pendingVoorstellen.length}</span>}
        </button>
        <button onClick={() => setActiefTab('taken')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${actiefTab === 'taken' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          Code taken {openTaken > 0 && <span className="ml-1.5 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">{openTaken}</span>}
        </button>
      </div>

      {/* Tab: Inzichten */}
      {actiefTab === 'inzichten' && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {['alle', 'nieuw', 'bekeken', 'toegepast', 'afgewezen'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all capitalize ${filterStatus === s ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                {s} {s === 'nieuw' && nieuw > 0 && <span className="ml-1 bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full text-xs">{nieuw}</span>}
              </button>
            ))}
            <div className="h-5 w-px bg-border self-center" />
            {['alle', ...Object.keys(DOMEIN_LABELS)].map(d => (
              <button key={d} onClick={() => setFilterDomein(d)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${filterDomein === d ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground'}`}>
                {d === 'alle' ? 'Alle' : DOMEIN_LABELS[d]}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : gefilterdInzichten.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
              <Brain className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground text-sm">{inzichten.length === 0 ? 'Klik "Nu analyseren" om te starten.' : 'Geen inzichten voor deze filters.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {gefilterdInzichten.map(inzicht => {
                const Icon = DOMEIN_ICONEN[inzicht.domein] || Brain;
                const isOpen = expanded === inzicht.id;
                const isGenereren = bezig[inzicht.id];
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-foreground text-sm leading-snug">{inzicht.titel}</p>
                            {inzicht.aanbevolen_wijziging?.startsWith('[CODE') && (
                              <span className="flex items-center gap-1 text-xs bg-orange-500/15 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-medium shrink-0">
                                <Code className="w-3 h-3" /> code
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{inzicht.samenvatting}</p>
                        </div>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />}
                    </button>

                    {isOpen && (
                      <div className="border-t border-border p-5 space-y-4">
                        {inzicht.huidige_waarde && (
                          <div className="bg-secondary/40 rounded-xl p-4">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">📌 HUIDIGE APP INHOUD</p>
                            <p className="text-sm text-muted-foreground">{inzicht.huidige_waarde}</p>
                          </div>
                        )}
                        {inzicht.aanbevolen_wijziging && (
                          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
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
                                <li key={i} className="text-xs text-muted-foreground flex gap-2"><span className="text-primary">•</span> {b}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Acties — alleen voor nieuw/bekeken */}
                        {(inzicht.status === 'nieuw' || inzicht.status === 'bekeken') && (
                          <div className="flex gap-2 pt-2">
                            <button onClick={() => afwijzenInzicht(inzicht)}
                              className="flex items-center gap-1.5 px-3 py-2 border border-destructive/30 text-destructive/70 rounded-lg text-xs font-medium hover:bg-destructive/10 transition-all">
                              <XCircle className="w-3.5 h-3.5" /> Afwijzen
                            </button>
                            <button onClick={() => genereerVoorstel(inzicht)} disabled={isGenereren}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:bg-primary/90 transition-all disabled:opacity-60">
                              {isGenereren
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> AI genereert concept...</>
                                : <><Sparkles className="w-3.5 h-3.5" /> Stel wijziging voor</>}
                            </button>
                          </div>
                        )}

                        {inzicht.status === 'toegepast' && (
                          <div className="flex items-center gap-2 text-xs text-green-400">
                            <CheckCircle className="w-4 h-4" /> Wijziging is doorgevoerd
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground">Gegenereerd op {new Date(inzicht.created_date).toLocaleString('nl-NL')}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab: Code Taken */}
      {actiefTab === 'taken' && (
        <>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : codeTaken.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
              <Code className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground text-sm">Geen code taken. Wanneer een voorstel handmatige code-aanpassing vereist, verschijnt het hier.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Open taken eerst */}
              {['open', 'gedaan'].map(statusGroep => {
                const gefilterdeItems = codeTaken.filter(t => t.status === statusGroep);
                if (gefilterdeItems.length === 0) return null;
                return (
                  <div key={statusGroep}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                      {statusGroep === 'open' ? `📋 Open (${gefilterdeItems.length})` : `✅ Gedaan (${gefilterdeItems.length})`}
                    </p>
                    <div className="space-y-2">
                      {gefilterdeItems.map(taak => {
                        const isOpen = expanded === taak.id;
                        const isDone = taak.status === 'gedaan';
                        return (
                          <div key={taak.id} className={`bg-card border rounded-2xl overflow-hidden transition-all ${isDone ? 'border-border opacity-60' : 'border-orange-500/30'}`}>
                            <div className="flex items-start gap-3 p-4">
                              <button onClick={() => vinkAfTaak(taak)} className="mt-0.5 shrink-0 hover:scale-110 transition-transform">
                                {isDone
                                  ? <CheckSquare className="w-5 h-5 text-green-400" />
                                  : <Square className="w-5 h-5 text-orange-400" />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <p className={`font-semibold text-sm ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{taak.titel}</p>
                                  {taak.prioriteit && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITEIT_STIJL[taak.prioriteit]}`}>{taak.prioriteit}</span>
                                  )}
                                </div>
                                {taak.bestand && (
                                  <p className="text-xs font-mono text-orange-400/80 bg-orange-500/10 px-2 py-0.5 rounded inline-block mb-1">
                                    {taak.bestand}
                                  </p>
                                )}
                                {taak.beschrijving && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">{taak.beschrijving}</p>
                                )}
                              </div>
                              <button onClick={() => setExpanded(isOpen ? null : taak.id)} className="shrink-0 mt-0.5">
                                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                              </button>
                            </div>

                            {isOpen && (
                              <div className="border-t border-border p-4 space-y-3">
                                {taak.huidige_waarde && (
                                  <div className="bg-secondary/40 rounded-xl p-3">
                                    <p className="text-xs font-semibold text-muted-foreground mb-1">📌 HUIDIGE WAARDE</p>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap font-mono text-xs">{taak.huidige_waarde}</p>
                                  </div>
                                )}
                                {taak.beschrijving && (
                                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3">
                                    <p className="text-xs font-semibold text-orange-400 mb-1">✏️ WAT AANPASSEN</p>
                                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{taak.beschrijving}</p>
                                  </div>
                                )}
                                {taak.onderbouwing && (
                                  <div className="bg-secondary/30 rounded-xl p-3">
                                    <p className="text-xs font-semibold text-muted-foreground mb-1">🔬 ONDERBOUWING</p>
                                    <p className="text-sm text-muted-foreground">{taak.onderbouwing}</p>
                                  </div>
                                )}
                                {isDone && taak.gedaan_op && (
                                  <p className="text-xs text-green-400">✅ Afgevinkt op {new Date(taak.gedaan_op).toLocaleString('nl-NL')}</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab: Concept-wijzigingen */}
      {actiefTab === 'voorstellen' && (
        <>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : voorstellen.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground text-sm">Nog geen concept-wijzigingen. Klik op "Stel wijziging voor" bij een inzicht.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {voorstellen.map(voorstel => {
                const isOpen = expanded === voorstel.id;
                const isBezigV = verwerkBezig[voorstel.id];
                const isPending = voorstel.status === 'pending';

                let parsedWaarde = null;
                try { parsedWaarde = JSON.parse(voorstel.voorgestelde_waarde); } catch {}

                return (
                  <div key={voorstel.id} className={`bg-card border rounded-2xl overflow-hidden ${isPending ? 'border-accent/40' : 'border-border'}`}>
                    <button onClick={() => setExpanded(isOpen ? null : voorstel.id)}
                      className="w-full flex items-start justify-between p-5 text-left hover:bg-secondary/20 transition-all gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isPending ? 'bg-accent/10' : 'bg-secondary'}`}>
                          <FileText className={`w-4 h-4 ${isPending ? 'text-accent' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{voorstel.entity_naam}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              isPending ? 'bg-accent/15 text-accent' :
                              voorstel.status === 'applied' ? 'bg-green-500/15 text-green-400' :
                              'bg-destructive/10 text-destructive/70'
                            }`}>
                              {isPending ? '⏳ Wacht op review' : voorstel.status === 'applied' ? '✓ Toegepast' : '✗ Afgewezen'}
                            </span>
                          </div>
                          <p className="font-semibold text-foreground text-sm leading-snug">{voorstel.bron_naam}</p>
                          {voorstel.huidige_waarde && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">Huidig: {voorstel.huidige_waarde}</p>
                          )}
                        </div>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />}
                    </button>

                    {isOpen && (
                      <div className="border-t border-border p-5 space-y-4">
                        {voorstel.huidige_waarde && (
                          <div className="bg-secondary/40 rounded-xl p-4">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">📌 HUIDIG</p>
                            <p className="text-sm text-muted-foreground">{voorstel.huidige_waarde}</p>
                          </div>
                        )}

                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                          <p className="text-xs font-semibold text-primary mb-3">✏️ VOORGESTELDE WIJZIGING</p>
                          {parsedWaarde && typeof parsedWaarde === 'object' ? (
                            <div className="space-y-2">
                              {Object.entries(parsedWaarde).map(([k, v]) => (
                                <div key={k}>
                                  <p className="text-xs font-medium text-muted-foreground capitalize mb-0.5">{k.replace(/_/g, ' ')}</p>
                                  {Array.isArray(v) ? (
                                    <ul className="space-y-0.5">
                                      {v.map((item, i) => (
                                        <li key={i} className="text-sm text-foreground flex gap-2"><span className="text-primary">•</span>{item}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-sm text-foreground">{String(v)}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{voorstel.voorgestelde_waarde}</p>
                          )}
                        </div>

                        {voorstel.onderbouwing_nl && (
                          <div className="bg-secondary/30 rounded-xl p-4">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">🔬 ONDERBOUWING</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">{voorstel.onderbouwing_nl}</p>
                          </div>
                        )}

                        {voorstel.review_notes && (
                          <div className="bg-secondary/20 rounded-xl p-3">
                            <p className="text-xs text-muted-foreground">{voorstel.review_notes}</p>
                          </div>
                        )}

                        {isPending && (
                          <div className="flex gap-2 pt-2">
                            <button onClick={() => afwijzenVoorstel(voorstel)} disabled={!!isBezigV}
                              className="flex items-center gap-1.5 px-3 py-2 border border-destructive/30 text-destructive/70 rounded-lg text-xs font-medium hover:bg-destructive/10 transition-all disabled:opacity-60">
                              {isBezigV === 'afwijzen' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                              Afwijzen
                            </button>
                            <button onClick={() => toepassenVoorstel(voorstel)} disabled={!!isBezigV}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-xs font-medium hover:bg-green-600/90 transition-all disabled:opacity-60">
                              {isBezigV === 'toepassen'
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Toepassen...</>
                                : <><CheckCircle className="w-3.5 h-3.5" /> Goedkeuren & doorvoeren</>}
                            </button>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground">Aangemaakt op {new Date(voorstel.created_date).toLocaleString('nl-NL')}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}