import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Supplement, SupplementProduct, SupplementNieuws, KennisArtikel, UserProfile } from '@/api/entities';
import { callFunction } from '@/api/netlifyClient';
import { Link } from 'react-router-dom';
import { FlaskConical, ShoppingBag, BookOpen, Sparkles, ChevronRight } from 'lucide-react';

const TABS = [
  { id: 'kennisbank', label: 'Kennisbank', icon: BookOpen },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
  { id: 'advies', label: 'AI Advies', icon: Sparkles },
  { id: 'nieuws', label: 'Nieuws', icon: FlaskConical },
];

export default function Supplementen() {
  const [activeTab, setActiveTab] = useState('kennisbank');

  return (
    <div className="p-4 pb-24 md:pb-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FlaskConical className="w-7 h-7 text-primary" /> Supplementen
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Wetenschappelijk onderbouwde kennis, shop en persoonlijk advies</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center ${
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'kennisbank' && <SupplementenKennisbank />}
      {activeTab === 'shop' && <SupplementenShop />}
      {activeTab === 'advies' && <SupplementAdvies />}
      {activeTab === 'nieuws' && <SupplementenNieuws />}
    </div>
  );
}

// --- KENNISBANK ---
function SupplementenKennisbank() {
  const [supplementen, setSupplementen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoek, setZoek] = useState('');
  const [cat, setCat] = useState('alle');
  const [geselecteerd, setGeselecteerd] = useState(null);

  const CATS = ['alle', 'eiwit', 'aminozuren', 'vitaminen', 'mineralen', 'kruiden', 'adaptogenen', 'omega', 'probiotica', 'sport_performance'];

  useEffect(() => {
    Supplement.list().then(s => {
      setSupplementen(s.filter(x => x.status === 'gepubliceerd'));
      setLoading(false);
    });
  }, []);

  const gefilterd = supplementen.filter(s => {
    const matchZoek = !zoek || s.naam?.toLowerCase().includes(zoek.toLowerCase());
    const matchCat = cat === 'alle' || s.categorie === cat;
    return matchZoek && matchCat;
  });

  const EVIDENCE_KLEUR = { A: 'text-green-400', B: 'text-blue-400', C: 'text-yellow-400', D: 'text-muted-foreground' };

  if (geselecteerd) {
    return (
      <div>
        <button onClick={() => setGeselecteerd(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-all">
          ← Terug naar kennisbank
        </button>
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          {geselecteerd.image_url && (
            <img src={geselecteerd.image_url} alt={geselecteerd.naam} className="w-full h-40 object-cover rounded-xl" />
          )}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">{geselecteerd.naam}</h2>
              <span className="text-xs text-muted-foreground capitalize">{geselecteerd.categorie}</span>
            </div>
            {geselecteerd.evidence_level && (
              <div className="text-right">
                <span className={`text-lg font-bold ${EVIDENCE_KLEUR[geselecteerd.evidence_level]}`}>
                  {geselecteerd.evidence_level}
                </span>
                <p className="text-xs text-muted-foreground">Evidence</p>
              </div>
            )}
          </div>

          {geselecteerd.beschrijving && <p className="text-sm text-muted-foreground">{geselecteerd.beschrijving}</p>}

          {geselecteerd.voordelen?.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-2 text-sm">✅ Bewezen voordelen</h3>
              <ul className="space-y-1">
                {geselecteerd.voordelen.map((v, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary">•</span> {v}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {geselecteerd.dosering && (
              <div className="bg-secondary/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Dosering</p>
                <p className="text-sm font-medium text-foreground">{geselecteerd.dosering}</p>
              </div>
            )}
            {geselecteerd.timing && (
              <div className="bg-secondary/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Timing</p>
                <p className="text-sm font-medium text-foreground">{geselecteerd.timing}</p>
              </div>
            )}
          </div>

          {geselecteerd.bijwerkingen && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
              <p className="text-xs font-semibold text-destructive mb-1">⚠️ Bijwerkingen / Let op</p>
              <p className="text-sm text-muted-foreground">{geselecteerd.bijwerkingen}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Zoek supplement..."
        value={zoek}
        onChange={e => setZoek(e.target.value)}
        className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${cat === c ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
            {c.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : gefilterd.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Geen supplementen gevonden</div>
      ) : (
        <div className="grid gap-3">
          {gefilterd.map(s => (
            <button key={s.id} onClick={() => setGeselecteerd(s)}
              className="bg-card border border-border rounded-xl p-4 text-left flex items-center gap-4 hover:border-primary/40 transition-all group">
              {s.image_url ? (
                <img src={s.image_url} alt={s.naam} className="w-14 h-14 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FlaskConical className="w-6 h-6 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-foreground text-sm">{s.naam}</p>
                  {s.evidence_level && (
                    <span className={`text-xs font-bold ${EVIDENCE_KLEUR[s.evidence_level]}`}>
                      {s.evidence_level}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground capitalize mb-1">{s.categorie?.replace('_', ' ')}</p>
                {s.doelen?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {s.doelen.slice(0, 3).map(d => (
                      <span key={d} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{d}</span>
                    ))}
                  </div>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- SHOP ---
function SupplementenShop() {
  const [producten, setProducten] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('alle');

  const CATS = ['alle', 'eiwit', 'vitaminen', 'mineralen', 'kruiden', 'sport_performance'];

  useEffect(() => {
    SupplementProduct.list().then(p => {
      setProducten(p.filter(x => x.status === 'actief'));
      setLoading(false);
    });
  }, []);

  const gefilterd = producten.filter(p => cat === 'alle' || p.categorie === cat);
  const featured = gefilterd.filter(p => p.featured);
  const overig = gefilterd.filter(p => !p.featured);

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${cat === c ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
            {c.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : gefilterd.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Geen producten gevonden</div>
      ) : (
        <>
          {featured.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-3">⭐ AANBEVOLEN</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {featured.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          )}
          {overig.length > 0 && (
            <div>
              {featured.length > 0 && <p className="text-xs font-semibold text-muted-foreground mb-3 mt-2">ALLE PRODUCTEN</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {overig.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ProductCard({ product }) {
  const isAffiliate = product.type === 'affiliate';

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all">
      {product.image_url ? (
        <img src={product.image_url} alt={product.naam} className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 bg-primary/5 flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-primary/30" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <p className="font-semibold text-foreground text-sm leading-tight">{product.naam}</p>
          {product.merk && <span className="text-xs text-muted-foreground ml-2 shrink-0">{product.merk}</span>}
        </div>
        {product.beschrijving && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{product.beschrijving}</p>}
        <div className="flex items-center justify-between">
          {!isAffiliate && product.prijs ? (
            <span className="font-bold text-primary">€{product.prijs.toFixed(2)}</span>
          ) : (
            <span className="text-xs text-muted-foreground">{product.affiliate_partner || 'Extern'}</span>
          )}
          {isAffiliate && product.affiliate_url ? (
            <a href={product.affiliate_url} target="_blank" rel="noopener noreferrer"
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-all">
              Bekijk aanbieding →
            </a>
          ) : (
            <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-all">
              In winkelwagen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- AI ADVIES ---
function SupplementAdvies() {
  const { profile: authProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [advies, setAdvies] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [supplementen, setSupplementen] = useState([]);
  const [extraWensen, setExtraWensen] = useState('');
  const [toonOpgeslagen, setToonOpgeslagen] = useState(true);

  useEffect(() => {
    async function load() {
      const supps = await Supplement.list();
      setSupplementen(supps.filter(s => s.status === 'gepubliceerd'));
      setLoadingProfile(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (authProfile) setProfile(authProfile);
  }, [authProfile]);

  const opgeslaanAdvies = profile?.supplement_advies;
  const heeftOpgeslaanAdvies = opgeslaanAdvies?.length > 0;

  async function herGenereer() {
    setLoading(true);
    setAdvies(null);

    const literatuur = await KennisArtikel.list('approved');

    const suppLijst = supplementen.map(s =>
      `${s.naam} (${s.categorie}, Evidence: ${s.evidence_level || '?'}, Dosering: ${s.dosering || '?'}, Timing: ${s.timing || '?'}, Doelen: ${s.doelen?.join(', ') || '-'})`
    ).join('\n');

    const literatuurTekst = literatuur.slice(0, 8).map(a =>
      `[${a.evidence_level || '?'}] ${a.title_nl || a.title_en}${a.summary_nl ? ': ' + a.summary_nl.substring(0, 200) : ''}`
    ).join('\n');

    const profielInfo = profile ? `
      - Geslacht: ${profile.gender}, Leeftijd: ${profile.age}, Gewicht: ${profile.weight_kg} kg
      - Activiteit: ${profile.activity_level}, Levensstijl: ${profile.lifestyle}
      - Doelgroep: ${profile.goal_group}, Ervaring: ${profile.training_ervaring}
      - Slaap: ${profile.slaap_uren || '?'} uur, Stress: ${profile.stress_niveau || '?'}/10
      - Voedingspatroon: ${profile.voedingspatroon || 'omnivoor'}
      - Gezondheidsdoelen: ${profile.gezondheids_doelen?.join(', ') || '-'}
      - Supplement doelen: ${profile.supplement_doelen?.join(', ') || '-'}
      - Huidige supplementen: ${profile.huidige_supplementen || 'geen'}
      - Extra wensen: ${extraWensen || 'geen'}
    ` : 'Geen profiel';

    const res = await callFunction('invokeLLM', {
      prompt: `Je bent een expert sportvoedingsdeskundige. Geef gepersonaliseerd supplement advies op basis van het profiel, de kennisbank én wetenschappelijke literatuur.

PROFIEL:
${profielInfo}

SUPPLEMENTEN KENNISBANK (gebruik ALLEEN deze):
${suppLijst}

GOEDGEKEURDE WETENSCHAPPELIJKE LITERATUUR:
${literatuurTekst || 'Geen beschikbaar'}

Geef top 3-5 supplement aanbevelingen, ALLEEN uit de kennisbank, wetenschappelijk onderbouwd met de literatuur. Specificeer prioriteit, reden, dosering en timing specifiek voor dit profiel. Schrijf in het Nederlands.`,
      response_json_schema: {
        type: "object",
        properties: {
          aanbevolen: {
            type: "array",
            items: {
              type: "object",
              properties: {
                naam: { type: "string" },
                reden: { type: "string" },
                dosering: { type: "string" },
                timing: { type: "string" },
                prioriteit: { type: "number" }
              }
            }
          },
          samenvatting: { type: "string" }
        }
      }
    });

    setAdvies(res);
    setToonOpgeslagen(false);
    setLoading(false);
  }

  if (loadingProfile) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const toonAdvies = toonOpgeslagen && heeftOpgeslaanAdvies ? opgeslaanAdvies : advies?.aanbevolen;

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-foreground">Persoonlijk Supplement Advies</h2>
            <p className="text-xs text-muted-foreground">
              {heeftOpgeslaanAdvies && toonOpgeslagen
                ? `Gegenereerd tijdens onboarding · ${profile.supplement_advies_gegenereerd_op ? new Date(profile.supplement_advies_gegenereerd_op).toLocaleDateString('nl-NL') : ''}`
                : 'AI-analyse op basis van jouw profiel + kennisbank'}
            </p>
          </div>
        </div>

        {!profile && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4">
            <p className="text-sm text-yellow-500">⚠️ Vul eerst je profiel in voor een nauwkeurig advies.</p>
          </div>
        )}

        {profile && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {[
              { l: 'Doelgroep', v: profile.goal_group },
              { l: 'Slaap', v: profile.slaap_uren ? `${profile.slaap_uren}u` : null },
              { l: 'Stress', v: profile.stress_niveau ? `${profile.stress_niveau}/10` : null },
              { l: 'Dieet', v: profile.voedingspatroon },
            ].filter(x => x.v).map(({ l, v }) => (
              <div key={l} className="bg-secondary/50 rounded-lg p-2">
                <p className="text-xs text-muted-foreground">{l}</p>
                <p className="text-xs font-medium text-foreground capitalize">{v?.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        )}

        {!heeftOpgeslaanAdvies && (
          <div className="mb-4">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Extra wensen (optioneel)</label>
            <textarea value={extraWensen} onChange={e => setExtraWensen(e.target.value)}
              placeholder="Bijv: ik slaap slecht, ik ben vegetariër..."
              className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground resize-none h-16 focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        )}

        <div className="flex gap-2">
          {heeftOpgeslaanAdvies && toonOpgeslagen ? (
            <button onClick={() => { setToonOpgeslagen(false); herGenereer(); }} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-border text-muted-foreground rounded-xl font-medium text-sm hover:border-primary hover:text-primary transition-all disabled:opacity-60">
              {loading ? <><div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> Analyseren...</> : <><Sparkles className="w-4 h-4" /> Nieuw advies genereren</>}
            </button>
          ) : (
            <button onClick={herGenereer} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-all disabled:opacity-60">
              {loading ? <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Analyseren...</> : <><Sparkles className="w-4 h-4" /> {heeftOpgeslaanAdvies ? 'Opnieuw genereren' : 'Genereer advies'}</>}
            </button>
          )}
        </div>
      </div>

      {/* Advies resultaten */}
      {toonAdvies?.length > 0 && (
        <div className="space-y-4">
          {(toonOpgeslagen ? null : advies?.samenvatting) && (
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4">
              <p className="text-sm text-foreground">{advies.samenvatting}</p>
            </div>
          )}
          <p className="text-xs font-semibold text-muted-foreground">✅ AANBEVOLEN VOOR JOU</p>
          <div className="space-y-3">
            {[...toonAdvies].sort((a, b) => (a.prioriteit || 0) - (b.prioriteit || 0)).map((s, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-primary rounded-full text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <p className="font-semibold text-foreground">{s.naam}</p>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{s.reden}</p>
                <div className="flex flex-wrap gap-2">
                  {s.dosering && (
                    <span className="bg-secondary/50 rounded-lg px-2.5 py-1 text-xs text-muted-foreground">
                      💊 {s.dosering}
                    </span>
                  )}
                  {s.timing && (
                    <span className="bg-primary/10 rounded-lg px-2.5 py-1 text-xs text-primary">
                      ⏰ {s.timing}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- NIEUWS ---
function SupplementenNieuws() {
  const [artikelen, setArtikelen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [geselecteerd, setGeselecteerd] = useState(null);
  const [cat, setCat] = useState('alle');

  const CATS = ['alle', 'eiwit', 'vitaminen', 'mineralen', 'kruiden', 'sport_performance'];

  useEffect(() => {
    SupplementNieuws.list('gepubliceerd').then(a => {
      setArtikelen(a);
      setLoading(false);
    });
  }, []);

  const gefilterd = artikelen.filter(a => cat === 'alle' || a.categorie === cat);
  const EVIDENCE_KLEUR = { A: 'bg-green-500/20 text-green-400', B: 'bg-blue-500/20 text-blue-400', C: 'bg-yellow-500/20 text-yellow-400', D: 'bg-secondary text-muted-foreground' };

  if (geselecteerd) {
    return (
      <div>
        <button onClick={() => setGeselecteerd(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-all">
          ← Terug naar nieuws
        </button>
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {geselecteerd.afbeelding_url && (
            <img src={geselecteerd.afbeelding_url} alt={geselecteerd.titel} className="w-full h-48 object-cover" />
          )}
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {geselecteerd.evidence_level && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${EVIDENCE_KLEUR[geselecteerd.evidence_level]}`}>
                  Evidence {geselecteerd.evidence_level}
                </span>
              )}
              {geselecteerd.categorie && (
                <span className="px-2 py-0.5 bg-secondary rounded-full text-xs text-muted-foreground capitalize">{geselecteerd.categorie.replace('_', ' ')}</span>
              )}
              {geselecteerd.gepubliceerd_op && (
                <span className="text-xs text-muted-foreground">{new Date(geselecteerd.gepubliceerd_op).toLocaleDateString('nl-NL')}</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-foreground">{geselecteerd.titel}</h1>
            {geselecteerd.intro && <p className="text-muted-foreground text-sm leading-relaxed">{geselecteerd.intro}</p>}
            <div className="border-t border-border pt-4">
              <div className="prose prose-sm prose-invert max-w-none text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {geselecteerd.inhoud}
              </div>
            </div>
            {geselecteerd.bron_url && (
              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">
                  Bron: <a href={geselecteerd.bron_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{geselecteerd.bron_naam || geselecteerd.bron_url}</a>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${cat === c ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
            {c.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : gefilterd.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Geen artikelen gevonden</div>
      ) : (
        <div className="space-y-3">
          {gefilterd.map(a => (
            <button key={a.id} onClick={() => setGeselecteerd(a)}
              className="w-full bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all text-left flex gap-0">
              {a.afbeelding_url && (
                <img src={a.afbeelding_url} alt={a.titel} className="w-24 h-24 object-cover shrink-0" />
              )}
              <div className="p-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {a.evidence_level && (
                    <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${EVIDENCE_KLEUR[a.evidence_level]}`}>
                      {a.evidence_level}
                    </span>
                  )}
                  {a.gepubliceerd_op && (
                    <span className="text-xs text-muted-foreground">{new Date(a.gepubliceerd_op).toLocaleDateString('nl-NL')}</span>
                  )}
                </div>
                <p className="font-semibold text-sm text-foreground line-clamp-2 mb-1">{a.titel}</p>
                {a.intro && <p className="text-xs text-muted-foreground line-clamp-2">{a.intro}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}