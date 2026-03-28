import { Plus, X, ChefHat } from 'lucide-react';

const TYPE_ICONS = {
  ontbijt: '🌅',
  lunch: '☀️',
  diner: '🌙',
  snack: '🍎',
};

export default function MaaltijdSlot({ type, item, onAdd, onRemove, onOpenFoodSearch }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
      <span className="text-base w-6 shrink-0">{TYPE_ICONS[type]}</span>
      <span className="text-xs text-muted-foreground w-14 shrink-0 capitalize">{type}</span>

      {item ? (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {item.recept_image_url ? (
            <img src={item.recept_image_url} alt={item.recept_titel}
              className="w-8 h-8 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <ChefHat className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{item.recept_titel}</p>
            {item.calories && (
              <p className="text-xs text-muted-foreground">{item.calories} kcal · {item.protein_g}g eiwit</p>
            )}
          </div>
          <button onClick={() => onRemove(item)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1">
          <button onClick={() => onAdd(type)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-all flex-1">
            <Plus className="w-3.5 h-3.5" /> Recept kiezen
          </button>
          <button onClick={() => onOpenFoodSearch(type)}
            className="text-xs text-muted-foreground hover:text-primary transition-all px-2 py-1 rounded-lg border border-border hover:border-primary/40">
            Voedingsmiddel
          </button>
        </div>
      )}
    </div>
  );
}