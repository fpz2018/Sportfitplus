import { useState, useEffect } from 'react';
import { Check, X, ExternalLink, ChevronDown, ChevronUp, Loader2, ShieldAlert, RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/lib/AuthContext';
import { Recipe } from '@/api/entities';
import { supabase } from '@/api/supabaseClient';

const CATEGORIE_KLEUREN = {
  ontbijt:  'bg-yellow-500/10 text-yellow-400',
  lunch:    'bg-green-500/10 text-green-400',
  diner:    'bg-blue-500/10 text-blue-400',
  snack:    'bg-purple-500/10 text-purple-400',
  dessert:  'bg-pink-500/10 text-pink-400',
  smoothie: 'bg-teal-500/10 text-teal-400',
};

export default function ReceptenBeheer() {
  const { profile, isLoadingAuth } = useAuth();
  const [recepten, setRecepten]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('concept');
  const [openId, setOpenId]       = useState(null);
  const [bezig, setBezig]         = useState({});
  const [syncing, setSyncing]     = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  async function syncNu() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/syncReceptenNightly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
      });
      const data = await res.json().catch(() => ({ error: 'Geen geldig JSON antwoord' }));
      setSyncResult({ status: res.status, data });
      if (res.ok && data.ok && data.imported?.length > 0) {
        await laadRecepten();
      }
    } catch (err) {
      setSyncResult({ status: 0, data: { error: err.message } });
    } finally {
      setSyncing(false);
    }
  }

  // ── Admin guard ──────────────────────────────────────────────────────────
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
    if (!isLoadingAuth && profile?.role === 'admin') laadRecepten();
  }, [isLoadingAuth, profile, filter]);

  async function laadRecepten() {
    setLoading(true);
    try {
      const data = await Recipe.list(filter, 50);
      setRecepten(data);
    } catch (err) {
      console.error('Fout bij laden recepten:', err);
      setRecepten([]);
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(recept, nieuweStatus) {
    setBezig(b => ({ ...b, [recept.id]: true }));
    await Recipe.update(recept.id, { status: nieuweStatus });
    setRecepten(r => r.filter(x => x.id !== recept.id));
    setBezig(b => ({ ...b, [recept.id]: false }));
  }

  async function verwijder(id) {
    setBezig(b => ({ ...b, [id]: true }));
    await Recipe.delete(id);
    setRecepten(r => r.filter(x => x.id !== id));
    setBezig(b => ({ ...b, [id]: false }));
  }

  return (
    <div className="p-6 pb-8 max-w-3xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recepten beheer</h1>
          <p className="text-muted-foreground text-sm">Controleer en publiceer geïmporteerde recepten</p>
        </div>
        <button
          onClick={syncNu}
          disabled={syncing}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-all disabled:opacity-50"
        >
          {syncing
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <RefreshCw className="w-4 h-4" />
          }
          {syncing ? 'Synchroniseren...' : 'Sync nu'}
        </button>
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
          {syncResult.data?.missing?.length > 0 && (
            <div className="text-xs text-destructive mb-2">
              <p className="font-medium">Ontbrekende env vars in Netlify:</p>
              <ul className="list-disc list-inside mt-1">
                {syncResult.data.missing.map(m => <li key={m}><code>{m}</code></li>)}
              </ul>
            </div>
          )}
          {typeof syncResult.data?.urlsInSheet === 'number' && (
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>URLs in sheet: <span className="text-foreground tabular-nums">{syncResult.data.urlsInSheet}</span></p>
              {typeof syncResult.data.urlsAlreadyImported === 'number' && (
                <p>Al geïmporteerd: <span className="text-foreground tabular-nums">{syncResult.data.urlsAlreadyImported}</span></p>
              )}
              {typeof syncResult.data.newUrls === 'number' && (
                <p>Nieuw deze run: <span className="text-foreground tabular-nums">{syncResult.data.newUrls}</span></p>
              )}
              {syncResult.data.imported?.length > 0 && (
                <p className="pt-1">
                  <span className="font-medium text-primary">Geïmporteerd ({syncResult.data.imported.length}):</span>{' '}
                  {syncResult.data.imported.join(', ')}
                </p>
              )}
              {typeof syncResult.data.skippedDueToLimit === 'number' && syncResult.data.skippedDueToLimit > 0 && (
                <p className="text-yellow-500">
                  {syncResult.data.skippedDueToLimit} overgeslagen wegens limiet (10/run) — klik nogmaals
                </p>
              )}
            </div>
          )}
          {syncResult.data?.errors?.length > 0 && (
            <details className="text-xs mt-2">
              <summary className="cursor-pointer text-destructive">
                {syncResult.data.errors.length} fouten
              </summary>
              <ul className="mt-1 space-y-1">
                {syncResult.data.errors.map((e, i) => (
                  <li key={i} className="text-muted-foreground break-all">
                    <code className="text-destructive">{e.error}</code> — {e.url}
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

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { v: 'concept',      l: '⏳ Concept' },
          { v: 'gepubliceerd', l: '✅ Gepubliceerd' },
        ].map(({ v, l }) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
              filter === v
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/40'
            }`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : recepten.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-sm">Geen {filter === 'concept' ? 'recepten in concept' : 'gepubliceerde recepten'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recepten.map(recept => (
            <div key={recept.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 p-4">
                {recept.image_url && (
                  <img src={recept.image_url} alt={recept.title}
                    className="w-14 h-14 rounded-xl object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{recept.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {recept.category && (
                      <span className={`text-xs px-2 py-0.5 rounded-lg ${CATEGORIE_KLEUREN[recept.category] || 'bg-secondary text-muted-foreground'}`}>
                        {recept.category}
                      </span>
                    )}
                    {recept.calories_per_serving && (
                      <span className="text-xs text-muted-foreground">{recept.calories_per_serving} kcal</span>
                    )}
                    {recept.protein_g && (
                      <span className="text-xs text-primary">{recept.protein_g}g eiwit</span>
                    )}
                  </div>
                </div>

                {/* Acties */}
                <div className="flex items-center gap-2 shrink-0">
                  {recept.source_url && (
                    <a href={recept.source_url} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-all">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button onClick={() => setOpenId(openId === recept.id ? null : recept.id)}
                    className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-all">
                    {openId === recept.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {filter === 'concept' ? (
                    <>
                      <button onClick={() => setStatus(recept, 'gepubliceerd')} disabled={bezig[recept.id]}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all disabled:opacity-50">
                        {bezig[recept.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Publiceer
                      </button>

                      {/* Bevestigingsdialoog voor afwijzen */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button disabled={bezig[recept.id]}
                            className="p-2 rounded-xl border border-destructive/30 text-destructive text-xs hover:bg-destructive/10 transition-all disabled:opacity-50">
                            <X className="w-4 h-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Recept afwijzen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Wil je "{recept.title}" permanent verwijderen? Dit kan niet ongedaan worden gemaakt.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuleren</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => verwijder(recept.id)}>
                              Verwijderen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  ) : (
                    <button onClick={() => setStatus(recept, 'concept')} disabled={bezig[recept.id]}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-muted-foreground text-xs font-medium hover:border-primary/40 transition-all disabled:opacity-50">
                      Terug naar concept
                    </button>
                  )}
                </div>
              </div>

              {/* Detail */}
              {openId === recept.id && (
                <div className="border-t border-border p-4 space-y-3">
                  {recept.description && (
                    <p className="text-sm text-muted-foreground">{recept.description}</p>
                  )}
                  {recept.ingredients?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">Ingrediënten</p>
                      <div className="grid grid-cols-2 gap-1">
                        {recept.ingredients.map((ing, i) => (
                          <p key={i} className="text-xs text-muted-foreground">
                            • {typeof ing === 'string' ? ing : `${ing.amount || ''} ${ing.unit || ''} ${ing.name || ''}`}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  {recept.instructions?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">Bereiding</p>
                      <ol className="space-y-1">
                        {recept.instructions.map((stap, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex gap-2">
                            <span className="text-primary shrink-0">{i + 1}.</span>
                            {stap}
                          </li>
                        ))}
                      </ol>
                    </div>
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
