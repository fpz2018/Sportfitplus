import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, X, ChefHat } from 'lucide-react';

const CATEGORIES = ['ontbijt', 'lunch', 'diner', 'snack', 'dessert', 'smoothie'];

export default function ReceptKiezer({ maaltijdType, onKies, onSluit }) {
  const [recepten, setRecepten] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState(maaltijdType || 'all');

  useEffect(() => {
    base44.entities.Recipe.list('-created_date', 500).then(setRecepten);
  }, []);

  const filtered = recepten.filter(r => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || r.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Kies een recept</h3>
          <button onClick={onSluit} className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-border space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Zoek recepten..."
              className="w-full bg-input border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            <button onClick={() => setCatFilter('all')}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-all ${catFilter === 'all' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>
              Alles
            </button>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCatFilter(c)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-all capitalize ${catFilter === c ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Lijst */}
        <div className="overflow-y-auto flex-1 p-2">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ChefHat className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Geen recepten gevonden</p>
            </div>
          ) : (
            filtered.map(r => (
              <button key={r.id} onClick={() => onKies(r)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-all text-left">
                {r.image_url ? (
                  <img src={r.image_url} alt={r.title} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <ChefHat className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{r.category}
                    {r.calories_per_serving ? ` · ${r.calories_per_serving} kcal` : ''}
                    {r.protein_g ? ` · ${r.protein_g}g eiwit` : ''}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}