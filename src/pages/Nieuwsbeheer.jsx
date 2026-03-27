import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const categoriekleur = {
  voeding: 'bg-orange-500/10 text-orange-600',
  training: 'bg-red-500/10 text-red-600',
  herstel: 'bg-blue-500/10 text-blue-600',
  supplementen: 'bg-green-500/10 text-green-600',
  hormonen: 'bg-purple-500/10 text-purple-600',
  overig: 'bg-slate-500/10 text-slate-600',
};

export default function Nieuwsbeheer() {
  const [berichten, setBerichten] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('concept');
  const [editingId, setEditingId] = useState(null);
  const [editingBericht, setEditingBericht] = useState(null);

  useEffect(() => {
    laadBerichten();
  }, []);

  async function laadBerichten() {
    setLoading(true);
    const alle = await base44.entities.Nieuwsbericht.list('-created_date', 1000);
    setBerichten(alle);
    setLoading(false);
  }

  async function updateStatus(id, newStatus) {
    await base44.entities.Nieuwsbericht.update(id, {
      status: newStatus,
      gepubliceerd_op: newStatus === 'gepubliceerd' ? new Date().toISOString().split('T')[0] : null,
    });
    laadBerichten();
  }

  async function verwijder(id) {
    if (confirm('Zeker?')) {
      await base44.entities.Nieuwsbericht.delete(id);
      laadBerichten();
    }
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
        {['concept', 'gepubliceerd', 'afgewezen'].map(status => (
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

      {/* Berichten lijst */}
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
                  <div className="flex items-center gap-2">
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
                    <p className="text-xs text-muted-foreground">Gepubliceerd: {bericht.gepubliceerd_op}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {bericht.status === 'concept' && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => updateStatus(bericht.id, 'gepubliceerd')}
                    className="gap-1">
                    <Eye className="w-4 h-4" />
                    Publiceren
                  </Button>
                )}
                {bericht.status === 'gepubliceerd' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(bericht.id, 'concept')}
                    className="gap-1">
                    <EyeOff className="w-4 h-4" />
                    Concept
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => verwijder(bericht.id)}
                  className="gap-1">
                  <Trash2 className="w-4 h-4" />
                  Verwijder
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}