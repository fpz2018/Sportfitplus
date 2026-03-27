import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BookOpen, CheckCircle, XCircle, ChevronDown, ChevronUp, RefreshCw, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const EVIDENCE_COLORS = { A: 'bg-green-500/20 text-green-400', B: 'bg-blue-500/20 text-blue-400', C: 'bg-yellow-500/20 text-yellow-400', D: 'bg-red-500/20 text-red-400' };
const STATUS_LABELS = { pending: 'In behandeling', approved: 'Goedgekeurd', rejected: 'Afgewezen' };

export default function KennisMonitor() {
  const [artikelen, setArtikelen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterCat, setFilterCat] = useState('all');
  const [user, setUser] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    base44.auth.me().then(setUser);
    loadArtikelen();
  }, []);

  async function loadArtikelen() {
    setLoading(true);
    const data = await base44.entities.KennisArtikel.list('-created_date', 100);
    setArtikelen(data);
    setLoading(false);
  }

  async function handleFetchPubMed() {
    setFetching(true);
    await base44.functions.invoke('pubmedFetch', { 
      customQueries: searchQuery ? searchQuery.split(',').map(q => q.trim()).filter(q => q) : null 
    });
    await loadArtikelen();
    setFetching(false);
    setSearchQuery('');
  }

  async function handleReview(artikel, status, notes = '') {
    await base44.entities.KennisArtikel.update(artikel.id, {
      status,
      reviewed_by: user?.email,
      reviewed_at: new Date().toISOString(),
      review_notes: notes
    });
    await base44.entities.AuditLog.create({
      actie: status === 'approved' ? 'artikel_goedgekeurd' : 'artikel_afgewezen',
      gebruiker: user?.email,
      entity_naam: 'KennisArtikel',
      record_id: artikel.id,
      details: `Artikel "${artikel.title_nl || artikel.title_en}" ${status}`
    });
    loadArtikelen();
  }

  async function handleGenereer(artikel) {
    setGeneratingId(artikel.id);
    await base44.functions.invoke('genereerNieuwsEnVoorstel', { artikel_id: artikel.id });
    setGeneratingId(null);
    alert('Nieuwsbericht en wijzigingsvoorstel gegenereerd! Ga naar Nieuwsbeheer om te publiceren.');
  }

  const filtered = artikelen.filter(a => {
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchCat = filterCat === 'all' || a.category === filterCat;
    return matchStatus && matchCat;
  });

  const pending = artikelen.filter(a => a.status === 'pending').length;

  return (
    <div className="p-6 pb-24 md:pb-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" /> Literatuurmonitor
            </h1>
            <p className="text-muted-foreground text-sm">{pending} artikelen wachten op review</p>
          </div>
          <Button onClick={handleFetchPubMed} disabled={fetching} className="gap-2">
            {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            PubMed ophalen
          </Button>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Zoekwoorden (gescheiden door komma's)</p>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="bijv. muscle protein synthesis, creatine monohydrate, ..."
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground mt-2">Laat leeg om de standaardzoekwoorden te gebruiken</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-5">
        {['all', 'pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${filterStatus === s ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>
            {s === 'all' ? 'Alle' : STATUS_LABELS[s]}
            {s === 'pending' && pending > 0 && <span className="ml-1.5 bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full text-xs">{pending}</span>}
          </button>
        ))}
        <div className="h-6 w-px bg-border self-center" />
        {['all', 'voeding', 'training', 'herstel', 'supplementen', 'hormonen', 'overig'].map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${filterCat === c ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground'}`}>
            {c === 'all' ? 'Alle categorieën' : c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Geen artikelen gevonden. Klik op "PubMed ophalen" om te beginnen.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <div key={a.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              <button onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                className="w-full flex items-start justify-between p-5 text-left hover:bg-secondary/30 transition-all">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {a.evidence_level && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${EVIDENCE_COLORS[a.evidence_level]}`}>Level {a.evidence_level}</span>}
                    {a.category && <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{a.category}</span>}
                    {a.relevance_score && <span className="text-xs text-muted-foreground">Relevantie: {a.relevance_score}%</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === 'approved' ? 'bg-green-500/20 text-green-400' : a.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {STATUS_LABELS[a.status]}
                    </span>
                  </div>
                  <p className="font-semibold text-foreground text-sm leading-snug">{a.title_nl || a.title_en}</p>
                  {a.journal && <p className="text-xs text-muted-foreground mt-1">{a.journal} {a.published_date?.substring(0, 4)}</p>}
                </div>
                {expanded === a.id ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />}
              </button>

              {expanded === a.id && (
                <div className="border-t border-border p-5 space-y-4">
                  {a.summary_nl && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Samenvatting (NL)</p>
                      <p className="text-sm text-foreground">{a.summary_nl}</p>
                    </div>
                  )}
                  {a.summary_en && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Summary (EN)</p>
                      <p className="text-sm text-foreground">{a.summary_en}</p>
                    </div>
                  )}
                  {a.abstract_en && (
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer hover:text-foreground">Origineel abstract</summary>
                      <p className="mt-2">{a.abstract_en}</p>
                    </details>
                  )}
                  {a.url && (
                    <a href={a.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                      <ExternalLink className="w-3.5 h-3.5" /> Bekijk op PubMed
                    </a>
                  )}
                  {a.status === 'pending' && (
                    <div className="flex gap-3 pt-2">
                      <Button onClick={() => handleReview(a, 'approved')} className="gap-2 flex-1" size="sm">
                        <CheckCircle className="w-4 h-4" /> Goedkeuren
                      </Button>
                      <Button onClick={() => handleReview(a, 'rejected')} variant="destructive" className="gap-2 flex-1" size="sm">
                        <XCircle className="w-4 h-4" /> Afwijzen
                      </Button>
                    </div>
                  )}
                  {a.status === 'approved' && (
                    <div className="pt-2">
                      <Button
                        onClick={() => handleGenereer(a)}
                        disabled={generatingId === a.id}
                        variant="outline"
                        className="gap-2 w-full border-primary/30 text-primary hover:bg-primary/10"
                        size="sm"
                      >
                        {generatingId === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {generatingId === a.id ? 'Genereren...' : 'Genereer nieuwsbericht + app-voorstel'}
                      </Button>
                    </div>
                  )}
                  {a.status !== 'pending' && a.reviewed_by && (
                    <p className="text-xs text-muted-foreground">Beoordeeld door {a.reviewed_by} op {new Date(a.reviewed_at).toLocaleDateString('nl-NL')}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}