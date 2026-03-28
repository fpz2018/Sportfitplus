import { Plus, X, ChefHat } from 'lucide-react';

const TYPE_ICONS = {
  ontbijt: '🌅',
  lunch: '☀️',
  diner: '🌙',
  snack: '🍎',
};

export default function MaaltijdSlot({ type, items = [], onAdd, onRemove, onOpenFoodSearch }) {
  return (
    <div className="border-b border-border/50 last:border-0">
      {/* Header */}
      <div className="flex items-center gap-3 py-2.5">
        <span className="text-base w-6 shrink-0">{TYPE_ICONS[type]}</span>
        <span className="text-xs text-muted-foreground w-14 shrink-0 capitalize">{type}</span>
        
        <div className="flex items-center gap-2 flex-1">
          <button onClick={() => onAdd(type)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-all flex-1">
            <Plus className="w-3.5 h-3.5" /> Recept
          </button>
          <button onClick={() => onOpenFoodSearch(type)}
            className="text-xs text-muted-foreground hover:text-primary transition-all px-2 py-1 rounded-lg border border-border hover:border-primary/40">
            Voedingsmiddel +
          </button>
        </div>
      </div>

      {/* Items list */}
      {items.length > 0 && (
        <div className="space-y-2 pl-9 pb-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-secondary/30">
              {item.recept_image_url ? (
                <img src={item.recept_image_url} alt={item.recept_titel}
                  className="w-6 h-6 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <ChefHat className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{item.recept_titel}</p>
                {item.calories && (
                  <p className="text-xs text-muted-foreground">{Math.round(item.calories)} kcal</p>
                )}
              </div>
              <button onClick={() => onRemove(item)}
                className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shrink-0">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}