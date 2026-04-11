import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { ContentBron } from '@/api/entities';
import { supabase } from '@/api/supabaseClient';
import { Loader2, Plus, Trash2, ToggleLeft, ToggleRight, ShieldAlert, Search, Rss, Globe, RefreshCw } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const BRON_TYPES = [
  { value: 'pubmed', label: 'PubMed', icon: Search, desc: 'Wetenschappelijke artikelen via PubMed/NCBI' },
  { value: 'rss', label: 'RSS Feed', icon: Rss, desc: 'RSS/Atom feeds van wetenschappelijke tijdschriften' },
  { value: 'website', label: 'Website', icon: Globe, desc: 'Webpagina\'s met gezondheidsartikelen' },
];

const CATEGORIEEN = [
  { value: 'voeding', label: 'Voeding' },
  { value: 'supplementen', label: 'Supplementen' },
  { value: 'training', label: 'Training' },
  { value: 'welzijn', label: 'Welzijn' },
  { value: 'gewichtsverlies', label: 'Gewichtsverlies' },
  { value: 'overig', label: 'Overig' },
];

const FREQUENTIES = [
  { value: 'dagelijks', label: 'Dagelijks' },
  { value: 'wekelijks', label: 'Wekelijks' },
  { value: 'maandelijks', label: 'Maandelijks' },
];

const catColor = {
  voeding: 'bg-orange-500/10 text-orange-400',
  supplementen: 'bg-green-500/10 text-green-400',
  training: 'bg-red-500/10 text-red-400',
  welzijn: 'bg-blue-500/10 text-blue-400',
  gewichtsverlies: 'bg-purple-500/10 text-purple-400',
  overig: 'bg-secondary text-muted-foreground',
};

export default function ContentBronnen() {
  const { profile, isLoadingAuth } = useAuth();
  const [bronnen, setBronnen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [form, setForm] = useState({
    naam: '', bron_type: 'pubmed', zoekterm: '', categorie: 'voeding',
    taal: 'en', max_per_sync: 5, sync_frequentie: 'dagelijks', actief: true,
  });

  async function syncNu(force = false) {
    setSyncing(true);
    setSyncResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `/api/syncContentNightly${force ? '?force=1' : ''}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 28000);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json().catch(() => ({ error: 'Geen geldig JSON antwoord' }));
      setSyncResult({ status: res.status, data });
      if (res.ok && data.ok && data.bronnenVerwerkt > 0) {
        await laadBronnen();
      }
    } catch (err) {
      const isTimeout = err.name === 'AbortError';
      setSyncResult({
        status: 0,
        data: {
          error: isTimeout
            ? 'De sync duurt langer dan 28 seconden — Netlify functie timeout. Probeer minder bronnen of wacht op de nachtelijke cron.'
            : err.message,
        },
      });
    } finally {
      setSyncing(false);
    }
  }

  if (!isLoadingAuth && profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3 text-center">
        <ShieldAlert className="w-12 h-12 text-destructive" />
        <p className="text-xl font-semibold">Geen toegang</p>
        <p className="text-muted-foreground">Deze pagina is alleen beschikbaar voor beheerders.</p>
      </div>
    );
  }

  useEffect(() => {
    if (!isLoadingAuth && profile?.role === 'admin') laadBronnen();
  }, [isLoadingAuth, profile]);

  async function laadBronnen() {
    setLoading(true);
    try {
      const data = await ContentBron.list();
      setBronnen(data);
    } catch (err) {
      console.error('Fout bij laden bronnen:', err);
      setBronnen([]);
    } finally {
      setLoading(false);
    }
  }

  async function opslaan() {
    if (!form.naam || !form.zoekterm) return;
    setSaving(true);
    try {
      await ContentBron.create(form);
      setForm({ naam: '', bron_type: 'pubmed', zoekterm: '', categorie: 'voeding', taal: 'en', max_per_sync: 5, sync_frequentie: 'dagelijks', actief: true });
      setShowForm(false);
      await laadBronnen();
    } catch (err) {
      console.error('Fout bij opslaan:', err);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActief(bron) {
    try {
      await ContentBron.update(bron.id, { actief: !bron.actief });
      setBronnen(prev => prev.map(b => b.id === bron.id ? { ...b, actief: !b.actief } : b));
    } catch (err) {
      console.error('Fout bij toggle:', err);
    }
  }

  async function verwijder(id) {
    try {
      await ContentBron.delete(id);
      setBronnen(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error('Fout bij verwijderen:', err);
    }
  }

  const inputCls = 'w-full bg-input border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent';
  const labelCls = 'text-xs font-medium text-muted-foreground mb-1.5 block';

  return (
    <div className="p-6 pb-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Content Bronnen</h1>
          <p className="text-muted-foreground text-sm">Configureer welke wetenschappelijke bronnen elke nacht worden opgehaald</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => syncNu(true)}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-all disabled:opacity-50"
            title="Forceer een sync van alle actieve bronnen, ongeacht laatste sync tijd"
          >
            {syncing
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <RefreshCw className="w-4 h-4" />
            }
            {syncing ? 'Syncen...' : 'Sync nu'}
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all">
            <Plus className="w-4 h-4" />
            Bron toevoegen
          </button>
        </div>
      </div>

      {/* Sync resultaat */}
      {syncResult && (
        <div className={`mb-6 p-4 rounded-2xl border text-sm ${
          syncResult.data?.ok
            ? 'border-primary/30 bg-primary/5 text-foreground'
            : 'border-destructive/30 bg-destructive/5 text-foreground'
        }`}>
          <p className="font-medium mb-2">
            {syncResult.data?.ok ? '✓ Sync gelukt' : '✗ Sync mislukt'}
            {syncResult.status ? ` (${syncResult.status})` : ''}
          </p>
          {syncResult.data?.message && (
            <p className="text-xs text-muted-foreground mb-2">{syncResult.data.message}</p>
          )}
          {typeof syncResult.data?.bronnenTotaal === 'number' && (
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>Bronnen totaal: <span className="text-foreground tabular-nums">{syncResult.data.bronnenTotaal}</span></p>
              <p>Actief: <span className="text-foreground tabular-nums">{syncResult.data.bronnenActief}</span></p>
              <p>Verwerkt deze run: <span className="text-foreground tabular-nums">{syncResult.data.bronnenVerwerkt}</span></p>
              <p className="font-medium text-primary pt-1">
                Nieuwe artikelen opgeslagen: {syncResult.data.artikelenOpgeslagen ?? 0}
              </p>
            </div>
          )}
          {syncResult.data?.results?.length > 0 && (
            <details className="text-xs mt-3">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Per bron details
              </summary>
              <ul className="mt-2 space-y-1.5">
                {syncResult.data.results.map((r, i) => (
                  <li key={i} className="flex items-start justify-between gap-2 pb-1 border-b border-border/50 last:border-0">
                    <div className="min-w-0">
                      <span className="text-foreground font-medium">{r.bron}</span>
                      <span className="text-muted-foreground"> ({r.type})</span>
                    </div>
                    <div className="text-right tabular-nums shrink-0">
                      {r.error
                        ? <span className="text-destructive">{r.error}</span>
                        : <span className="text-muted-foreground">{r.fetched ?? 0} gevonden, <span className="text-primary">{r.saved ?? 0} nieuw</span></span>
                      }
                    </div>
                  </li>
                ))}
              </ul>
            </details>
          )}
          {syncResult.data?.error && !syncResult.data.message && (
            <p className="text-xs text-destructive break-all">{syncResult.data.error}</p>
          )}
        </div>
      )}

      {/* Nieuw formulier */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 space-y-4">
          <h3 className="font-semibold text-foreground">Nieuwe contentbron</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Naam</label>
              <input value={form.naam} onChange={e => setForm(f => ({ ...f, naam: e.target.value }))}
                placeholder="bijv. Sportvoeding onderzoek" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Type bron</label>
              <select value={form.bron_type} onChange={e => setForm(f => ({ ...f, bron_type: e.target.value }))}
                className={inputCls}>
                {BRON_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>
              {form.bron_type === 'pubmed' ? 'PubMed zoekterm' : form.bron_type === 'rss' ? 'Feed URL' : 'Website URL'}
            </label>
            <input value={form.zoekterm} onChange={e => setForm(f => ({ ...f, zoekterm: e.target.value }))}
              placeholder={form.bron_type === 'pubmed' ? 'bijv. sports nutrition muscle protein synthesis' : 'https://...'}
              className={inputCls} />
            {form.bron_type === 'pubmed' && (
              <p className="text-xs text-muted-foreground mt-1">Gebruik Engelse PubMed zoektermen voor de beste resultaten</p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>Categorie</label>
              <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}
                className={inputCls}>
                {CATEGORIEEN.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Frequentie</label>
              <select value={form.sync_frequentie} onChange={e => setForm(f => ({ ...f, sync_frequentie: e.target.value }))}
                className={inputCls}>
                {FREQUENTIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Max per sync</label>
              <input type="number" value={form.max_per_sync} min={1} max={25}
                onChange={e => setForm(f => ({ ...f, max_per_sync: parseInt(e.target.value) || 5 }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Taal</label>
              <select value={form.taal} onChange={e => setForm(f => ({ ...f, taal: e.target.value }))}
                className={inputCls}>
                <option value="en">Engels</option>
                <option value="nl">Nederlands</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground text-sm hover:border-primary/40 transition-all">
              Annuleren
            </button>
            <button onClick={opslaan} disabled={saving || !form.naam || !form.zoekterm}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Opslaan
            </button>
          </div>
        </div>
      )}

      {/* Overzicht */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : bronnen.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
          <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">Nog geen bronnen geconfigureerd</p>
          <p className="text-sm text-muted-foreground">Voeg een PubMed-zoekterm, RSS-feed of website toe om automatisch artikelen op te halen.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bronnen.map(bron => {
            const TypeIcon = BRON_TYPES.find(t => t.value === bron.bron_type)?.icon || Search;
            return (
              <div key={bron.id} className={`bg-card border border-border rounded-2xl p-4 transition-all ${!bron.actief ? 'opacity-50' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <TypeIcon className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-foreground text-sm">{bron.naam}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-lg ${catColor[bron.categorie] || catColor.overig}`}>
                        {bron.categorie}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-secondary text-muted-foreground">
                        {bron.sync_frequentie}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{bron.zoekterm}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>Max {bron.max_per_sync}/sync</span>
                      <span>Taal: {bron.taal?.toUpperCase()}</span>
                      {bron.laatste_sync && (
                        <span>Laatste sync: {new Date(bron.laatste_sync).toLocaleDateString('nl-NL')}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleActief(bron)}
                      className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-all"
                      title={bron.actief ? 'Deactiveren' : 'Activeren'}>
                      {bron.actief ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="p-2 rounded-xl border border-border text-destructive hover:bg-destructive/10 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Bron verwijderen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{bron.naam}" wordt permanent verwijderd. Al opgehaalde artikelen blijven bewaard.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuleren</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => verwijder(bron.id)}>
                            Verwijderen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info blok */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mt-6">
        <div className="flex items-start gap-3">
          <RefreshCw className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-foreground text-sm mb-1">Hoe werkt het?</p>
            <ul className="text-sm text-muted-foreground space-y-1 leading-relaxed">
              <li>Elke nacht om 04:00 worden actieve bronnen gesynct</li>
              <li>PubMed-bronnen zoeken automatisch naar nieuwe artikelen</li>
              <li>AI genereert een Nederlandse samenvatting per artikel</li>
              <li>Nieuwe artikelen verschijnen als "pending" in de Literatuurmonitor</li>
              <li>Jij beoordeelt en publiceert ze naar de Nieuws-pagina</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
