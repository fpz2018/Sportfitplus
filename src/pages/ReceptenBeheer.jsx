import { useState, useEffect } from 'react';
import { Check, X, ExternalLink, ChevronDown, ChevronUp, Loader2, ShieldAlert } from 'lucide-react';
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Recepten beheer</h1>
        <p className="text-muted-foreground text-sm">Controleer en publiceer geïmporteerde recepten</p>
      </div>

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
