import { Clock, Flame, Heart, ChevronRight } from 'lucide-react';

const CATEGORY_LABELS = {
  ontbijt: 'Ontbijt',
  lunch: 'Lunch',
  diner: 'Diner',
  snack: 'Snack',
  dessert: 'Dessert',
  smoothie: 'Smoothie',
};

export default function RecipeCard({ recipe, onClick, onToggleFavorite }) {
  const totalTime = (recipe.prep_time_min || 0) + (recipe.cook_time_min || 0);

  return (
    <div
      className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative h-44 bg-secondary overflow-hidden">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🥗</div>
        )}
        {recipe.category && (
          <span className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm text-foreground text-xs font-medium px-2.5 py-1 rounded-full">
            {CATEGORY_LABELS[recipe.category] || recipe.category}
          </span>
        )}
        <button
          onClick={e => { e.stopPropagation(); onToggleFavorite(recipe); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-all"
        >
          <Heart className={`w-4 h-4 ${recipe.is_favorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground text-sm leading-tight mb-2 line-clamp-2">{recipe.title}</h3>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {totalTime > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{totalTime} min</span>
            </div>
          )}
          {recipe.calories_per_serving && (
            <div className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-accent" />
              <span>{recipe.calories_per_serving} kcal</span>
            </div>
          )}
        </div>

        {/* Macros */}
        {(recipe.protein_g || recipe.carbs_g || recipe.fat_g) && (
          <div className="flex gap-2 mt-3">
            {recipe.protein_g && (
              <div className="flex-1 bg-primary/10 rounded-lg px-2 py-1.5 text-center">
                <p className="text-xs font-bold text-primary">{recipe.protein_g}g</p>
                <p className="text-xs text-muted-foreground">Eiwit</p>
              </div>
            )}
            {recipe.carbs_g && (
              <div className="flex-1 bg-accent/10 rounded-lg px-2 py-1.5 text-center">
                <p className="text-xs font-bold text-accent">{recipe.carbs_g}g</p>
                <p className="text-xs text-muted-foreground">Koolh.</p>
              </div>
            )}
            {recipe.fat_g && (
              <div className="flex-1 bg-secondary rounded-lg px-2 py-1.5 text-center">
                <p className="text-xs font-bold text-foreground">{recipe.fat_g}g</p>
                <p className="text-xs text-muted-foreground">Vet</p>
              </div>
            )}
          </div>
        )}

        {recipe.source_name && (
          <p className="text-xs text-muted-foreground mt-2 truncate">Bron: {recipe.source_name}</p>
        )}
      </div>
    </div>
  );
}