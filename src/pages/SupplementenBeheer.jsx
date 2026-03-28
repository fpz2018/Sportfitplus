import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Trash2, FlaskConical, ShoppingBag, BookOpen, Check, X, Loader2 } from 'lucide-react';

const TABS = [
  { id: 'supplementen', label: 'Kennisbank', icon: BookOpen },
  { id: 'producten', label: 'Shop Producten', icon: ShoppingBag },
  { id: 'nieuws', label: 'Nieuws', icon: FlaskConical },
];

const CATEGORIES = ['eiwit', 'aminozuren', 'vitaminen', 'mineralen', 'kruiden', 'adaptogenen', 'omega', 'probiotica', 'sport_performance', 'overig'];
const DOELEN = ['spieropbouw', 'vetverlies', 'herstel', 'energie', 'focus', 'slaap', 'immuunsysteem', 'gezondheid', 'prestatie', 'hormonen'];

export default function SupplementenBeheer() {
  const [activeTab, setActiveTab] = useState('supplementen');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => setIsAdmin(u?.role === 'admin'));
  }, []);

  if (!isAdmin) return (
    <div className="p-6 text-center text-muted-foreground">
      <p>Geen toegang. Alleen admins kunnen dit beheer bekijken.</p>
    </div>
  );

  return (
    <div className="p-4 pb-24 md:pb-8 max-w-4xl mx-auto">
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
    const data = await base44.entities.Supplement.list('-created_date');
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
      await base44.entities.Supplement.create(form);
    } else {
      await base44.entities.Supplement.update(editing, form);
    }
    await laadItems();
    setEditing(null);
    setSaving(false);
  }

  async function verwijder(id) {
    if (!confirm('Verwijder dit supplement?')) return;
    await base44.entities.Supplement.delete(id);
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
    setItems(await base44.entities.SupplementProduct.list('-created_date'));
    setLoading(false);
  }

  function startNieuw() {
    setForm({ naam: '', type: 'affiliate', categorie: 'vitaminen', status: 'actief', featured: false });
    setEditing('nieuw');
  }

  async function opslaan() {
    setSaving(true);
    if (editing === 'nieuw') {
      await base44.entities.SupplementProduct.create({ ...form, prijs: form.prijs ? Number(form.prijs) : undefined });
    } else {
      await base44.entities.SupplementProduct.update(editing, { ...form, prijs: form.prijs ? Number(form.prijs) : undefined });
    }
    await laadItems();
    setEditing(null);
    setSaving(false);
  }

  async function verwijder(id) {
    if (!confirm('Verwijder dit product?')) return;
    await base44.entities.SupplementProduct.delete(id);
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
    setItems(await base44.entities.SupplementNieuws.list('-created_date'));
    setLoading(false);
  }

  async function opslaan() {
    setSaving(true);
    if (editing === 'nieuw') {
      await base44.entities.SupplementNieuws.create(form);
    } else {
      await base44.entities.SupplementNieuws.update(editing, form);
    }
    await laadItems();
    setEditing(null);
    setSaving(false);
  }

  async function verwijder(id) {
    if (!confirm('Verwijder dit artikel?')) return;
    await base44.entities.SupplementNieuws.delete(id);
    laadItems();
  }

  async function toggleStatus(item) {
    const nieuw = item.status === 'gepubliceerd' ? 'concept' : 'gepubliceerd';
    const extra = nieuw === 'gepubliceerd' ? { gepubliceerd_op: new Date().toISOString().split('T')[0] } : {};
    await base44.entities.SupplementNieuws.update(item.id, { status: nieuw, ...extra });
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