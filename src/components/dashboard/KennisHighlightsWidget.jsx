import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { FlaskConical, Sparkles, ChevronRight, TrendingUp, ArrowRight, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EVIDENCE_COLORS = {
  A: 'bg-green-500/20 text-green-400 border-green-500/30',
  B: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  C: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  D: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const CAT_COLORS = {
  voeding: 'text-orange-400',
  training: 'text-primary',
  herstel: 'text-blue-400',
  supplementen: 'text-purple-400',
  hormonen: 'text-pink-400',
  overig: 'text-muted-foreground',
};

export default function KennisHighlightsWidget({ isAdmin }) {
  const [nieuws, setNieuws] = useState([]);
  const [seoSuggesties, setSeoSuggesties] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generatingSeo, setGeneratingSeo] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [gepubliceerd, kennisArtikelen, voorstellen] = await Promise.all([
      base44.entities.Nieuwsbericht.filter({ status: 'gepubliceerd' }, '-gepubliceerd_op', 3),
      base44.entities.KennisArtikel.filter({ status: 'approved' }, '-created_date', 3),
      isAdmin ? base44.entities.WijzigingsVoorstel.filter({ entity_naam: 'SEO', status: 'pending' }, '-created_date', 5) : Promise.resolve([]),
    ]);

    setNieuws(gepubliceerd);
    setSeoSuggesties(voorstellen);

    if (isAdmin) {
      const pending = await base44.entities.KennisArtikel.filter({ status: 'pending' });
      setPendingCount(pending.length);
    }

    // Use approved articles as highlights if no published news yet
    if (gepubliceerd.length === 0) {
      setNieuws(kennisArtikelen.map(a => ({
        id: a.id,
        titel: a.title_nl || a.title_en,
        intro: a.summary_nl,
        categorie: a.category,
        evidence_level: a.evidence_level,
        relevance_score: a.relevance_score,
        _isKennisArtikel: true,
      })));
    }

    setLoading(false);
  }

  async function handleApplySeo(voorstel) {
    setGeneratingSeo(true);
    // Apply to index.html meta tags via update proposal
    await base44.entities.WijzigingsVoorstel.update(voorstel.id, {
      status: 'applied',
      applied_at: new Date().toISOString(),
    });
    // Refresh
    setSeoSuggesties(prev => prev.filter(v => v.id !== voorstel.id));
    setGeneratingSeo(false);
  }

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Wetenschap Highlights */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Wetenschappelijke highlights</h2>
          </div>
          {isAdmin && pendingCount > 0 && (
            <Link to="/kennis">
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-medium">
                {pendingCount} wachten op review
              </span>
            </Link>
          )}
        </div>

        {nieuws.length === 0 ? (
          <div className="text-center py-6">
            <FlaskConical className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nog geen highlights beschikbaar.</p>
            {isAdmin && (
              <Link to="/kennis">
                <Button variant="outline" size="sm" className="mt-3 gap-2">
                  <Search className="w-3 h-3" /> PubMed ophalen
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {nieuws.map((item) => (
              <div key={item.id} className="group p-3 rounded-xl bg-secondary/40 hover:bg-secondary/70 transition-all">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {item.evidence_level && (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${EVIDENCE_COLORS[item.evidence_level]}`}>
                          Level {item.evidence_level}
                        </span>
                      )}
                      {item.categorie && (
                        <span className={`text-xs font-medium ${CAT_COLORS[item.categorie] || 'text-muted-foreground'}`}>
                          {item.categorie}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">{item.titel}</p>
                    {item.intro && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.intro}</p>
                    )}
                  </div>
                  {!item._isKennisArtikel && (
                    <Link to="/nieuws" className="shrink-0">
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
            <Link to="/nieuws" className="flex items-center gap-2 text-xs text-primary hover:underline pt-1">
              Alle nieuwsberichten <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>

      {/* SEO Suggesties — alleen voor admins */}
      {isAdmin && seoSuggesties.length > 0 && (
        <div className="bg-card border border-primary/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-accent" />
            <h2 className="font-semibold text-foreground">SEO-voorstellen</h2>
            <span className="ml-auto text-xs text-muted-foreground">{seoSuggesties.length} nieuw</span>
          </div>

          <div className="space-y-3">
            {seoSuggesties.map((v) => (
              <div key={v.id} className="rounded-xl border border-border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {v.veld_naam === 'homepage_title' ? 'Paginatitel' : 'Meta-beschrijving'}
                  </span>
                  <span className="ml-auto text-xs text-primary font-medium">{v.betrouwbaarheid}% relevantie</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {v.huidige_waarde && (
                    <div className="text-xs bg-secondary/50 rounded-lg p-2">
                      <span className="text-muted-foreground block mb-0.5">Huidig:</span>
                      <span className="text-foreground">{v.huidige_waarde}</span>
                    </div>
                  )}
                  <div className="text-xs bg-primary/10 border border-primary/20 rounded-lg p-2">
                    <span className="text-primary block mb-0.5">Voorstel:</span>
                    <span className="text-foreground">{v.voorgestelde_waarde}</span>
                  </div>
                </div>
                {v.onderbouwing_nl && (
                  <p className="text-xs text-muted-foreground italic">{v.onderbouwing_nl}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="h-7 text-xs flex-1"
                    onClick={() => handleApplySeo(v)}
                    disabled={generatingSeo}
                  >
                    Toepassen
                  </Button>
                  <Link to="/voorstellen" className="flex-1">
                    <Button size="sm" variant="outline" className="h-7 text-xs w-full">
                      Bekijk details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}