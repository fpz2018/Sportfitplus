import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Supplement, SupplementProduct, SupplementNieuws } from '@/api/entities';
import { callFunction } from '@/api/netlifyClient';
import { Plus, Edit2, Trash2, FlaskConical, ShoppingBag, BookOpen, Check, X, Loader2, Sparkles, FileText } from 'lucide-react';

const TABS = [
  { id: 'supplementen', label: 'Kennisbank', icon: BookOpen },
  { id: 'producten', label: 'Shop Producten', icon: ShoppingBag },
  { id: 'nieuws', label: 'Nieuws', icon: FlaskConical },
  { id: 'kennisbron', label: 'Kennisbron', icon: Sparkles },
];

const CATEGORIES = ['eiwit', 'aminozuren', 'vitaminen', 'mineralen', 'kruiden', 'adaptogenen', 'omega', 'probiotica', 'sport_performance', 'overig'];
const DOELEN = ['spieropbouw', 'vetverlies', 'herstel', 'energie', 'focus', 'slaap', 'immuunsysteem', 'gezondheid', 'prestatie', 'hormonen'];

export default function SupplementenBeheer() {
  const [activeTab, setActiveTab] = useState('supplementen');
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  if (!isAdmin) return (
    <div className="p-6 text-center text-muted-foreground">
      <p>Geen toegang. Alleen admins kunnen dit beheer bekijken.</p>
    </div>
  );

  return (
    <div className="p-4 pb-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Supplementen Beheer</h1>
        <p className="text-muted-foreground text-sm">Beheer kennisbank, shop en nieuws</p>
      </div>

      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 mb-6">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium flex-1 justify-center transition-all ${activeTab === tab.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'supplementen' && <SupplementenBeheerTab />}
      {activeTab === 'producten' && <ProductenBeheerTab />}
      {activeTab === 'nieuws' && <NieuwsBeheerTab />}
      {activeTab === 'kennisbron' && <KennisbronVerwerker />}
    </div>
  );
}

// --- SUPPLEMENTEN TAB ---
function SupplementenBeheerTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { laadItems(); }, []);

  async function laadItems() {
    setLoading(true);
    const data = await Supplement.list();
    setItems(data);
    setLoading(false);
  }

  function startNieuw() {
    setForm({ naam: '', categorie: 'vitaminen', status: 'concept', voordelen: [], doelen: [] });
    setEditing('nieuw');
  }

  function startEdit(item) {
    setForm({ ...item, voordelen: item.voordelen || [], doelen: item.doelen || [] });
    setEditing(item.id);
  }

  async function opslaan() {
    setSaving(true);
    if (editing === 'nieuw') {
      await Supplement.create(form);
    } else {
      await Supplement.update(editing, form);
    }
    await laadItems();
    setEditing(null);
    setSaving(false);
  }

  async function verwijder(id) {
    if (!confirm('Verwijder dit supplement?')) return;
    await Supplement.delete(id);
    laadItems();
  }

  function toggleDoel(doel) {
    const huidige = form.doelen || [];
    setForm(f => ({
      ...f,
      doelen: huidige.includes(doel) ? huidige.filter(d => d !== doel) : [...huidige, doel]
    }));
  }

  if (editing !== null) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">{editing === 'nieuw' ? 'Nieuw supplement' : 'Bewerken'}</h2>
          <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label-xs">Naam</label>
            <input value={form.naam || ''} onChange={e => setForm(f => ({ ...f, naam: e.target.value }))}
              className="input-field" placeholder="Bijv. Creatine Monohydraat" />
          </div>
          <div>
            <label className="label-xs">Categorie</label>
            <select value={form.categorie || ''} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} className="input-field">
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label-xs">Evidence Level</label>
            <select value={form.evidence_level || ''} onChange={e => setForm(f => ({ ...f, evidence_level: e.target.value }))} className="input-field">
              <option value="">Selecteer</option>
              <option value="A">A - Sterk bewijs (RCT/Meta)</option>
              <option value="B">B - Matig bewijs</option>
              <option value="C">C - Beperkt bewijs</option>
              <option value="D">D - Anecdotisch</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="label-xs">Beschrijving</label>
            <textarea value={form.beschrijving || ''} onChange={e => setForm(f => ({ ...f, beschrijving: e.target.value }))}
              className="input-field resize-none h-20" placeholder="Korte beschrijving..." />
          </div>
          <div>
            <label className="label-xs">Dosering</label>
            <input value={form.dosering || ''} onChange={e => setForm(f => ({ ...f, dosering: e.target.value }))}
              className="input-field" placeholder="Bijv. 3-5g per dag" />
          </div>
          <div>
            <label className="label-xs">Timing</label>
            <input value={form.timing || ''} onChange={e => setForm(f => ({ ...f, timing: e.target.value }))}
              className="input-field" placeholder="Bijv. voor training" />
          </div>
          <div className="col-span-2">
            <label className="label-xs">Voordelen (één per regel)</label>
            <textarea
              value={(form.voordelen || []).join('\n')}
              onChange={e => setForm(f => ({ ...f, voordelen: e.target.value.split('\n').filter(Boolean) }))}
              className="input-field resize-none h-20" placeholder="Verhoogt kracht&#10;Verbetert herstel" />
          </div>
          <div className="col-span-2">
            <label className="label-xs mb-2 block">Doelen</label>
            <div className="flex flex-wrap gap-2">
              {DOELEN.map(d => (
                <button key={d} onClick={() => toggleDoel(d)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${(form.doelen || []).includes(d) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <label className="label-xs">Bijwerkingen / Let op</label>
            <input value={form.bijwerkingen || ''} onChange={e => setForm(f => ({ ...f, bijwerkingen: e.target.value }))}
              className="input-field" placeholder="Mogelijke bijwerkingen..." />
          </div>
          <div className="col-span-2">
            <label className="label-xs">Afbeelding URL</label>
            <input value={form.image_url || ''} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
              className="input-field" placeholder="https://..." />
          </div>
          <div>
            <label className="label-xs">Status</label>
            <select value={form.status || 'concept'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input-field">
              <option value="concept">Concept</option>
              <option value="gepubliceerd">Gepubliceerd</option>
            </select>
          </div>
        </div>

        <button onClick={opslaan} disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-all disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Opslaan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button onClick={startNieuw}
        className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-border text-muted-foreground rounded-xl text-sm hover:border-primary hover:text-primary transition-all">
        <Plus className="w-4 h-4" /> Nieuw supplement toevoegen
      </button>

      {loading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div> : (
        items.map(item => (
          <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-medium text-sm text-foreground">{item.naam}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${item.status === 'gepubliceerd' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                  {item.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground capitalize">{item.categorie?.replace('_', ' ')} · Evidence: {item.evidence_level || '?'}</p>
            </div>
            <button onClick={() => startEdit(item)} className="p-2 hover:bg-secondary rounded-lg transition-all"><Edit2 className="w-4 h-4 text-muted-foreground" /></button>
            <button onClick={() => verwijder(item.id)} className="p-2 hover:bg-destructive/10 rounded-lg transition-all"><Trash2 className="w-4 h-4 text-destructive" /></button>
          </div>
        ))
      )}
    </div>
  );
}

// --- PRODUCTEN TAB ---
function ProductenBeheerTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { laadItems(); }, []);
  async function laadItems() {
    setLoading(true);
    setItems(await SupplementProduct.list());
    setLoading(false);
  }

  function startNieuw() {
    setForm({ naam: '', type: 'affiliate', categorie: 'vitaminen', status: 'actief', featured: false });
    setEditing('nieuw');
  }

  async function opslaan() {
    setSaving(true);
    if (editing === 'nieuw') {
      await SupplementProduct.create({ ...form, prijs: form.prijs ? Number(form.prijs) : undefined });
    } else {
      await SupplementProduct.update(editing, { ...form, prijs: form.prijs ? Number(form.prijs) : undefined });
    }
    await laadItems();
    setEditing(null);
    setSaving(false);
  }

  async function verwijder(id) {
    if (!confirm('Verwijder dit product?')) return;
    await SupplementProduct.delete(id);
    laadItems();
  }

  if (editing !== null) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">{editing === 'nieuw' ? 'Nieuw product' : 'Product bewerken'}</h2>
          <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="label-xs">Naam</label><input value={form.naam || ''} onChange={e => setForm(f => ({ ...f, naam: e.target.value }))} className="input-field" /></div>
          <div><label className="label-xs">Merk</label><input value={form.merk || ''} onChange={e => setForm(f => ({ ...f, merk: e.target.value }))} className="input-field" /></div>
          <div>
            <label className="label-xs">Type</label>
            <select value={form.type || 'affiliate'} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input-field">
              <option value="affiliate">Affiliate</option>
              <option value="eigen_product">Eigen product</option>
            </select>
          </div>
          <div>
            <label className="label-xs">Categorie</label>
            <select value={form.categorie || ''} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} className="input-field">
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
          </div>
          {form.type === 'eigen_product' && (
            <div><label className="label-xs">Prijs (€)</label><input type="number" value={form.prijs || ''} onChange={e => setForm(f => ({ ...f, prijs: e.target.value }))} className="input-field" /></div>
          )}
          {form.type === 'affiliate' && (
            <>
              <div className="col-span-2"><label className="label-xs">Affiliate URL</label><input value={form.affiliate_url || ''} onChange={e => setForm(f => ({ ...f, affiliate_url: e.target.value }))} className="input-field" placeholder="https://..." /></div>
              <div><label className="label-xs">Partner</label><input value={form.affiliate_partner || ''} onChange={e => setForm(f => ({ ...f, affiliate_partner: e.target.value }))} className="input-field" placeholder="Bol.com" /></div>
            </>
          )}
          <div className="col-span-2"><label className="label-xs">Beschrijving</label><textarea value={form.beschrijving || ''} onChange={e => setForm(f => ({ ...f, beschrijving: e.target.value }))} className="input-field resize-none h-16" /></div>
          <div className="col-span-2"><label className="label-xs">Afbeelding URL</label><input value={form.image_url || ''} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} className="input-field" /></div>
          <div>
            <label className="label-xs">Status</label>
            <select value={form.status || 'actief'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input-field">
              <option value="actief">Actief</option>
              <option value="inactief">Inactief</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input type="checkbox" id="featured" checked={!!form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
            <label htmlFor="featured" className="text-sm text-foreground">Featured (aanbevolen)</label>
          </div>
        </div>
        <button onClick={opslaan} disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-all disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Opslaan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button onClick={startNieuw}
        className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-border text-muted-foreground rounded-xl text-sm hover:border-primary hover:text-primary transition-all">
        <Plus className="w-4 h-4" /> Nieuw product toevoegen
      </button>
      {loading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div> : (
        items.map(item => (
          <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-medium text-sm text-foreground">{item.naam}</p>
                {item.featured && <span className="text-xs px-1.5 py-0.5 bg-accent/20 text-accent rounded-full">⭐ Featured</span>}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${item.type === 'eigen_product' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>{item.type}</span>
              </div>
              <p className="text-xs text-muted-foreground">{item.merk} · {item.categorie?.replace('_', ' ')}{item.prijs ? ` · €${item.prijs}` : ''}</p>
            </div>
            <button onClick={() => { setForm({ ...item }); setEditing(item.id); }} className="p-2 hover:bg-secondary rounded-lg"><Edit2 className="w-4 h-4 text-muted-foreground" /></button>
            <button onClick={() => verwijder(item.id)} className="p-2 hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4 text-destructive" /></button>
          </div>
        ))
      )}
    </div>
  );
}

// --- KENNISBRON VERWERKER ---
function KennisbronVerwerker() {
  const [tekst, setTekst] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultaat, setResultaat] = useState(null);
  const [opgeslagen, setOpgeslagen] = useState([]);
  const [bestaandeSupps, setBestaandeSupps] = useState([]);

  useEffect(() => {
    Supplement.list().then(setBestaandeSupps);
  }, []);

  async function verwerkBron() {
    if (!tekst.trim()) return;
    setLoading(true);
    setResultaat(null);

    const bestaandeNamen = bestaandeSupps.map(s => s.naam).join(', ');

    const res = await callFunction('invokeLLM', {
      prompt: `Je bent een expert in sportvoeding en supplementen. Analyseer onderstaande kennisbron en extraheer bruikbare, concrete adviezen.

KENNISBRON:
${tekst}

REEDS AANWEZIGE SUPPLEMENTEN IN DB: ${bestaandeNamen || 'geen'}

Extraheer uit de tekst:
1. Concrete supplement-inname adviezen (timing, dosering, combinaties)
2. Nieuwe supplementen die nog NIET in de DB staan en toegevoegd kunnen worden
3. Updates voor bestaande supplementen (bijv. betere timing/dosering info)
4. Een kort nieuwsartikel gebaseerd op de bron

Wees specifiek en praktisch. Schrijf in het Nederlands.`,
      response_json_schema: {
        type: "object",
        properties: {
          adviezen: {
            type: "array",
            items: {
              type: "object",
              properties: {
                supplement: { type: "string" },
                advies: { type: "string" },
                timing: { type: "string" },
                dosering: { type: "string" },
                combineer_met: { type: "string" }
              }
            }
          },
          nieuwe_supplementen: {
            type: "array",
            items: {
              type: "object",
              properties: {
                naam: { type: "string" },
                categorie: { type: "string" },
                beschrijving: { type: "string" },
                dosering: { type: "string" },
                timing: { type: "string" },
                evidence_level: { type: "string" }
              }
            }
          },
          updates_bestaande: {
            type: "array",
            items: {
              type: "object",
              properties: {
                supplement_naam: { type: "string" },
                veld: { type: "string" },
                nieuwe_waarde: { type: "string" }
              }
            }
          },
          nieuwsartikel: {
            type: "object",
            properties: {
              titel: { type: "string" },
              intro: { type: "string" },
              inhoud: { type: "string" },
              evidence_level: { type: "string" },
              categorie: { type: "string" }
            }
          }
        }
      }
    });

    setResultaat(res);
    setLoading(false);
  }

  async function slaSupplementOp(supp) {
    await Supplement.create({
      ...supp,
      status: 'concept',
      doelen: [],
      voordelen: []
    });
    setOpgeslagen(o => [...o, supp.naam]);
    setBestaandeSupps(s => [...s, supp]);
  }

  async function slaArtikelOp() {
    const art = resultaat.nieuwsartikel;
    await SupplementNieuws.create({
      titel: art.titel,
      intro: art.intro,
      inhoud: art.inhoud,
      evidence_level: art.evidence_level,
      categorie: art.categorie || 'overig',
      status: 'concept',
      gepubliceerd_op: new Date().toISOString().split('T')[0]
    });
    setOpgeslagen(o => [...o, '__artikel__']);
  }

  async function pasUpdateToe(update) {
    const supp = bestaandeSupps.find(s => s.naam.toLowerCase() === update.supplement_naam.toLowerCase());
    if (!supp) return alert('Supplement niet gevonden in DB: ' + update.supplement_naam);
    await Supplement.update(supp.id, { [update.veld]: update.nieuwe_waarde });
    setOpgeslagen(o => [...o, update.supplement_naam + '_' + update.veld]);
  }

  return (
    <div className="space-y-5">
      {/* Input */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Kennisbron Verwerken</h2>
            <p className="text-xs text-muted-foreground">Plak een artikel of blogpost — AI extraheert bruikbare adviezen</p>
          </div>
        </div>

        <textarea
          value={tekst}
          onChange={e => setTekst(e.target.value)}
          placeholder="Plak hier de kennisbrontekst (blog, artikel, onderzoekssamenvatting)..."
          className="input-field resize-none h-40 mb-4"
        />

        <button onClick={verwerkBron} disabled={loading || !tekst.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-all disabled:opacity-60">
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> AI analyseert bron...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Verwerk kennisbron</>
          )}
        </button>
      </div>

      {/* Resultaten */}
      {resultaat && (
        <div className="space-y-4">

          {/* Adviezen */}
          {resultaat.adviezen?.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center text-xs text-primary font-bold">{resultaat.adviezen.length}</span>
                Inname Adviezen
              </h3>
              <div className="space-y-3">
                {resultaat.adviezen.map((a, i) => (
                  <div key={i} className="bg-secondary/40 rounded-xl p-4">
                    <p className="font-medium text-sm text-foreground mb-1">{a.supplement}</p>
                    <p className="text-sm text-muted-foreground mb-2">{a.advies}</p>
                    <div className="flex flex-wrap gap-2">
                      {a.timing && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">⏰ {a.timing}</span>}
                      {a.dosering && <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">💊 {a.dosering}</span>}
                      {a.combineer_met && <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">🔗 + {a.combineer_met}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nieuwe supplementen */}
          {resultaat.nieuwe_supplementen?.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-foreground mb-3">➕ Nieuwe Supplementen Toevoegen</h3>
              <div className="space-y-3">
                {resultaat.nieuwe_supplementen.map((s, i) => {
                  const isOpgeslagen = opgeslagen.includes(s.naam);
                  return (
                    <div key={i} className="bg-secondary/40 rounded-xl p-4 flex items-start gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground">{s.naam}</p>
                        <p className="text-xs text-muted-foreground capitalize mb-1">{s.categorie} · Evidence {s.evidence_level}</p>
                        <p className="text-xs text-muted-foreground">{s.beschrijving}</p>
                        {s.timing && <p className="text-xs text-primary mt-1">⏰ {s.timing}</p>}
                      </div>
                      <button
                        onClick={() => slaSupplementOp(s)}
                        disabled={isOpgeslagen}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isOpgeslagen ? 'bg-primary/10 text-primary cursor-default' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
                        {isOpgeslagen ? '✓ Opgeslagen' : 'Toevoegen'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Updates bestaande */}
          {resultaat.updates_bestaande?.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-foreground mb-3">✏️ Updates voor Bestaande Supplementen</h3>
              <div className="space-y-3">
                {resultaat.updates_bestaande.map((u, i) => {
                  const key = u.supplement_naam + '_' + u.veld;
                  const isOpgeslagen = opgeslagen.includes(key);
                  return (
                    <div key={i} className="bg-secondary/40 rounded-xl p-4 flex items-start gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground">{u.supplement_naam}</p>
                        <p className="text-xs text-muted-foreground mb-1">Veld: <span className="font-medium text-foreground">{u.veld}</span></p>
                        <p className="text-xs text-muted-foreground">{u.nieuwe_waarde}</p>
                      </div>
                      <button
                        onClick={() => pasUpdateToe(u)}
                        disabled={isOpgeslagen}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isOpgeslagen ? 'bg-primary/10 text-primary cursor-default' : 'bg-accent/20 text-accent hover:bg-accent/30'}`}>
                        {isOpgeslagen ? '✓ Toegepast' : 'Toepassen'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Nieuwsartikel */}
          {resultaat.nieuwsartikel?.titel && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-foreground mb-3">📰 Gegenereerd Nieuwsartikel</h3>
              <div className="bg-secondary/40 rounded-xl p-4 mb-3">
                <p className="font-semibold text-foreground text-sm mb-1">{resultaat.nieuwsartikel.titel}</p>
                <p className="text-xs text-muted-foreground">{resultaat.nieuwsartikel.intro}</p>
              </div>
              <button
                onClick={slaArtikelOp}
                disabled={opgeslagen.includes('__artikel__')}
                className={`w-full py-2 rounded-xl text-sm font-medium transition-all ${opgeslagen.includes('__artikel__') ? 'bg-primary/10 text-primary cursor-default' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
                {opgeslagen.includes('__artikel__') ? '✓ Artikel opgeslagen als concept' : 'Opslaan als concept nieuwsartikel'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- NIEUWS TAB ---
function NieuwsBeheerTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { laadItems(); }, []);
  async function laadItems() {
    setLoading(true);
    setItems(await SupplementNieuws.listAll());
    setLoading(false);
  }

  async function opslaan() {
    setSaving(true);
    if (editing === 'nieuw') {
      await SupplementNieuws.create(form);
    } else {
      await SupplementNieuws.update(editing, form);
    }
    await laadItems();
    setEditing(null);
    setSaving(false);
  }

  async function verwijder(id) {
    if (!confirm('Verwijder dit artikel?')) return;
    await SupplementNieuws.delete(id);
    laadItems();
  }

  async function toggleStatus(item) {
    const nieuw = item.status === 'gepubliceerd' ? 'concept' : 'gepubliceerd';
    const extra = nieuw === 'gepubliceerd' ? { gepubliceerd_op: new Date().toISOString().split('T')[0] } : {};
    await SupplementNieuws.update(item.id, { status: nieuw, ...extra });
    laadItems();
  }

  if (editing !== null) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">{editing === 'nieuw' ? 'Nieuw artikel' : 'Artikel bewerken'}</h2>
          <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-3">
          <div><label className="label-xs">Titel</label><input value={form.titel || ''} onChange={e => setForm(f => ({ ...f, titel: e.target.value }))} className="input-field" /></div>
          <div><label className="label-xs">Intro (voor preview)</label><textarea value={form.intro || ''} onChange={e => setForm(f => ({ ...f, intro: e.target.value }))} className="input-field resize-none h-16" /></div>
          <div><label className="label-xs">Inhoud (Markdown)</label><textarea value={form.inhoud || ''} onChange={e => setForm(f => ({ ...f, inhoud: e.target.value }))} className="input-field resize-none h-40" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs">Categorie</label>
              <select value={form.categorie || ''} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} className="input-field">
                <option value="">Kies categorie</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label-xs">Evidence Level</label>
              <select value={form.evidence_level || ''} onChange={e => setForm(f => ({ ...f, evidence_level: e.target.value }))} className="input-field">
                <option value="">Selecteer</option>
                <option value="A">A - Sterk</option>
                <option value="B">B - Matig</option>
                <option value="C">C - Beperkt</option>
                <option value="D">D - Anecdotisch</option>
              </select>
            </div>
            <div><label className="label-xs">Bron URL</label><input value={form.bron_url || ''} onChange={e => setForm(f => ({ ...f, bron_url: e.target.value }))} className="input-field" placeholder="https://pubmed.ncbi..." /></div>
            <div><label className="label-xs">Bron naam</label><input value={form.bron_naam || ''} onChange={e => setForm(f => ({ ...f, bron_naam: e.target.value }))} className="input-field" placeholder="PubMed, NCBI..." /></div>
            <div className="col-span-2"><label className="label-xs">Afbeelding URL</label><input value={form.afbeelding_url || ''} onChange={e => setForm(f => ({ ...f, afbeelding_url: e.target.value }))} className="input-field" /></div>
            <div>
              <label className="label-xs">Status</label>
              <select value={form.status || 'concept'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input-field">
                <option value="concept">Concept</option>
                <option value="gepubliceerd">Gepubliceerd</option>
              </select>
            </div>
          </div>
        </div>
        <button onClick={opslaan} disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-all disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Opslaan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button onClick={() => { setForm({ titel: '', inhoud: '', status: 'concept' }); setEditing('nieuw'); }}
        className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-border text-muted-foreground rounded-xl text-sm hover:border-primary hover:text-primary transition-all">
        <Plus className="w-4 h-4" /> Nieuw artikel
      </button>
      {loading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div> : (
        items.map(item => (
          <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-medium text-sm text-foreground truncate">{item.titel}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${item.status === 'gepubliceerd' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>{item.status}</span>
                {item.evidence_level && <span className="text-xs text-muted-foreground">Evidence {item.evidence_level}</span>}
              </div>
            </div>
            <button onClick={() => toggleStatus(item)} className={`p-2 rounded-lg text-xs transition-all ${item.status === 'gepubliceerd' ? 'hover:bg-destructive/10 text-muted-foreground' : 'hover:bg-primary/10 text-primary'}`}>
              {item.status === 'gepubliceerd' ? 'Depubliceer' : 'Publiceer'}
            </button>
            <button onClick={() => { setForm({ ...item }); setEditing(item.id); }} className="p-2 hover:bg-secondary rounded-lg"><Edit2 className="w-4 h-4 text-muted-foreground" /></button>
            <button onClick={() => verwijder(item.id)} className="p-2 hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4 text-destructive" /></button>
          </div>
        ))
      )}
    </div>
  );
}