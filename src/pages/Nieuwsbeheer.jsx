import { useState, useEffect } from 'react';
import { Loader2, Trash2, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Nieuwsbericht } from '@/api/entities';

const categoriekleur = {
  voeding:      'bg-orange-500/10 text-orange-600',
  training:     'bg-red-500/10 text-red-600',
  herstel:      'bg-blue-500/10 text-blue-600',
  supplementen: 'bg-green-500/10 text-green-600',
  hormonen:     'bg-purple-500/10 text-purple-600',
  overig:       'bg-slate-500/10 text-slate-600',
};

export default function Nieuwsbeheer() {
  const { profile, isLoadingAuth } = useAuth();
  const [berichten, setBerichten]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('concept');

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

  useEffect(() => { laadBerichten(); }, []);

  async function laadBerichten() {
    setLoading(true);
    const alle = await Nieuwsbericht.listAll();
    setBerichten(alle);
    setLoading(false);
  }

  async function updateStatus(id, newStatus) {
    await Nieuwsbericht.update(id, {
      status: newStatus,
      gepubliceerd_op: newStatus === 'gepubliceerd' ? new Date().toISOString() : null,
    });
    laadBerichten();
  }

  async function verwijder(id) {
    await Nieuwsbericht.delete(id);
    laadBerichten();
  }

  const gefilterd = berichten.filter(b => b.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Nieuwsbeheer</h1>
        <p className="text-muted-foreground">Beheer gepubliceerde nieuwsberichten</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['concept', 'gepubliceerd'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg border transition-all ${
              filter === status
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}>
            {status.charAt(0).toUpperCase() + status.slice(1)} ({berichten.filter(b => b.status === status).length})
          </button>
        ))}
      </div>

      {gefilterd.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Geen berichten in deze categorie</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {gefilterd.map(bericht => (
            <div key={bericht.id} className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{bericht.titel}</h3>
                    <Badge className={categoriekleur[bericht.categorie] || categoriekleur.overig}>
                      {bericht.categorie}
                    </Badge>
                    <Badge variant={bericht.status === 'gepubliceerd' ? 'default' : 'secondary'}>
                      {bericht.status}
                    </Badge>
                  </div>
                  {bericht.intro && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{bericht.intro}</p>
                  )}
                  {bericht.gepubliceerd_op && (
                    <p className="text-xs text-muted-foreground">
                      Gepubliceerd: {new Date(bericht.gepubliceerd_op).toLocaleDateString('nl-NL')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {bericht.status === 'concept' && (
                  <Button size="sm" onClick={() => updateStatus(bericht.id, 'gepubliceerd')} className="gap-1">
                    <Eye className="w-4 h-4" />
                    Publiceren
                  </Button>
                )}
                {bericht.status === 'gepubliceerd' && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(bericht.id, 'concept')} className="gap-1">
                    <EyeOff className="w-4 h-4" />
                    Concept
                  </Button>
                )}

                {/* Bevestigingsdialoog voor verwijderen */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                      Verwijder
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Nieuwsbericht verwijderen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Je staat op het punt "{bericht.titel}" permanent te verwijderen. Dit kan niet ongedaan worden gemaakt.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuleren</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => verwijder(bericht.id)}>
                        Verwijderen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
