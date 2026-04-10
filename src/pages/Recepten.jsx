import { useState, useEffect } from 'react';
import { Recipe } from '@/api/entities';
import { Plus, Search, Heart, Grid, List, ChefHat } from 'lucide-react';
import RecipeCard from '@/components/recepten/RecipeCard';
import RecipeDetail from '@/components/recepten/RecipeDetail';
import RecipeForm from '@/components/recepten/RecipeForm';

const CATEGORIES = [
  { value: 'all', label: '🍽️ Alles' },
  { value: 'ontbijt', label: '🌅 Ontbijt' },
  { value: 'lunch', label: '☀️ Lunch' },
  { value: 'diner', label: '🌙 Diner' },
  { value: 'snack', label: '🍎 Snack' },
  { value: 'dessert', label: '🍫 Dessert' },
  { value: 'smoothie', label: '🥤 Smoothie' },
];

export default function Recepten() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [favOnly, setFavOnly] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [sharedUrl, setSharedUrl] = useState('');

  useEffect(() => {
    loadRecipes();
    // Detect URL shared via Web Share Target
    const params = new URLSearchParams(window.location.search);
    const shared = params.get('shared_url') || params.get('shared_text') || '';
    if (shared && shared.startsWith('http')) {
      setSharedUrl(shared);
      setEditingRecipe(null);
      setShowForm(true);
      // Clean up URL
      window.history.replaceState({}, '', '/recepten');
    }
  }, []);

  async function loadRecipes() {
    setLoading(true);
    const data = await Recipe.list('gepubliceerd');
    setRecipes(data);
    setLoading(false);
  }

  async function handleSave(data) {
    if (editingRecipe) {
      await Recipe.update(editingRecipe.id, data);
    } else {
      await Recipe.create(data);
    }
    setShowForm(false);
    setEditingRecipe(null);
    loadRecipes();
  }

  async function handleDelete(recipe) {
    if (!confirm(`"${recipe.title}" verwijderen?`)) return;
    await Recipe.delete(recipe.id);
    setSelectedRecipe(null);
    loadRecipes();
  }

  async function handleToggleFavorite(recipe) {
    await Recipe.update(recipe.id, { is_favorite: !recipe.is_favorite });
    setRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, is_favorite: !r.is_favorite } : r));
    if (selectedRecipe?.id === recipe.id) {
      setSelectedRecipe(r => ({ ...r, is_favorite: !r.is_favorite }));
    }
  }

  function openEdit(recipe) {
    setEditingRecipe(recipe);
    setShowForm(true);
    setSelectedRecipe(null);
  }

  const filtered = recipes.filter(r => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || r.category === category;
    const matchFav = !favOnly || r.is_favorite;
    return matchSearch && matchCat && matchFav;
  });

  return (
    <div className="p-6 pb-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mijn Recepten</h1>
          <p className="text-muted-foreground text-sm">{recipes.length} recepten opgeslagen</p>
        </div>
        <button
          onClick={() => { setEditingRecipe(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" /> Recept toevoegen
        </button>
      </div>

      {/* Search & filters */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek recepten..."
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setCategory(c.value)}
              className={`px-3 py-2 rounded-xl border text-xs font-medium whitespace-nowrap transition-all ${category === c.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
              {c.label}
            </button>
          ))}
          <button onClick={() => setFavOnly(!favOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium whitespace-nowrap transition-all ${favOnly ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-border text-muted-foreground hover:border-red-400'}`}>
            <Heart className="w-3.5 h-3.5" /> Favorieten
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
          <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-medium mb-1">
            {recipes.length === 0 ? 'Nog geen recepten' : 'Geen recepten gevonden'}
          </p>
          <p className="text-muted-foreground text-sm mb-5">
            {recipes.length === 0 ? 'Voeg je eerste recept toe om te beginnen.' : 'Probeer een andere zoekterm of filter.'}
          </p>
          {recipes.length === 0 && (
            <button
              onClick={() => { setEditingRecipe(null); setShowForm(true); }}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all"
            >
              Eerste recept toevoegen
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={() => setSelectedRecipe(recipe)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onEdit={openEdit}
          onDelete={handleDelete}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {showForm && (
        <RecipeForm
          recipe={editingRecipe}
          initialImportUrl={sharedUrl}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingRecipe(null); setSharedUrl(''); }}
        />
      )}
    </div>
  );
}
