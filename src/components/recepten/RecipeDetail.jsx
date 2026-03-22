import { X, Clock, Flame, Users, Heart, ExternalLink, Pencil, Trash2 } from 'lucide-react';

export default function RecipeDetail({ recipe, onClose, onEdit, onDelete, onToggleFavorite }) {
  const totalTime = (recipe.prep_time_min || 0) + (recipe.cook_time_min || 0);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-4 px-4">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden mb-4">
        {/* Hero image */}
        <div className="relative h-56 bg-secondary">
          {recipe.image_url ? (
            <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🥗</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />

          {/* Actions */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={() => onToggleFavorite(recipe)}
              className="w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-all">
              <Heart className={`w-4 h-4 ${recipe.is_favorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
            </button>
            <button onClick={() => onEdit(recipe)}
              className="w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-all">
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => onDelete(recipe)}
              className="w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-all">
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
            <button onClick={onClose}
              className="w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-all">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Title & meta */}
          <h2 className="text-xl font-bold text-foreground mb-1">{recipe.title}</h2>
          {recipe.description && <p className="text-muted-foreground text-sm mb-4">{recipe.description}</p>}

          {/* Stats row */}
          <div className="flex gap-3 flex-wrap mb-5">
            {totalTime > 0 && (
              <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-full text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" /> {totalTime} min
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-full text-xs text-muted-foreground">
                <Users className="w-3.5 h-3.5" /> {recipe.servings} porties
              </div>
            )}
            {recipe.calories_per_serving && (
              <div className="flex items-center gap-1.5 bg-accent/10 px-3 py-1.5 rounded-full text-xs text-accent">
                <Flame className="w-3.5 h-3.5" /> {recipe.calories_per_serving} kcal
              </div>
            )}
          </div>

          {/* Macros */}
          {(recipe.protein_g || recipe.carbs_g || recipe.fat_g) && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-primary/10 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-primary">{recipe.protein_g || 0}g</p>
                <p className="text-xs text-muted-foreground">Eiwitten</p>
              </div>
              <div className="bg-accent/10 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-accent">{recipe.carbs_g || 0}g</p>
                <p className="text-xs text-muted-foreground">Koolhydraten</p>
              </div>
              <div className="bg-secondary rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-foreground">{recipe.fat_g || 0}g</p>
                <p className="text-xs text-muted-foreground">Vetten</p>
              </div>
            </div>
          )}

          {/* Ingredients */}
          {recipe.ingredients?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-foreground mb-3">Ingrediënten</h3>
              <div className="space-y-2">
                {recipe.ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-foreground">{ing.name}</span>
                    <span className="text-sm text-muted-foreground">{ing.amount} {ing.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {recipe.instructions?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-foreground mb-3">Bereiding</h3>
              <div className="space-y-3">
                {recipe.instructions.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source */}
          {recipe.source_url && (
            <a href={recipe.source_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-all">
              <ExternalLink className="w-3.5 h-3.5" />
              {recipe.source_name || 'Bekijk origineel recept'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}