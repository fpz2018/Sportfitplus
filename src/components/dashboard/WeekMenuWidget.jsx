import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ChefHat, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const TYPE_ICONS = { ontbijt: '🌅', lunch: '☀️', diner: '🌙', snack: '🍎' };
const TYPE_ORDER = ['ontbijt', 'lunch', 'diner', 'snack'];

export default function WeekMenuWidget() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const vandaag = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    async function laad() {
      const u = await base44.auth.me();
      const data = await base44.entities.WeekMenu.filter({ created_by: u.email, datum: vandaag });
      // Sorteer op type volgorde
      data.sort((a, b) => TYPE_ORDER.indexOf(a.maaltijd_type) - TYPE_ORDER.indexOf(b.maaltijd_type));
      setItems(data);
      setLoading(false);
    }
    laad();
  }, []);

  const dagLabel = format(new Date(), 'EEEE d MMMM', { locale: nl });

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Vandaag</h3>
          <p className="text-xs text-muted-foreground capitalize">{dagLabel}</p>
        </div>
        <Link to="/weekmenu"
          className="flex items-center gap-1 text-xs text-primary hover:underline">
          Weekmenu <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-secondary rounded-xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-6">
          <ChefHat className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground mb-3">Nog niets gepland voor vandaag</p>
          <Link to="/weekmenu"
            className="text-xs text-primary font-medium hover:underline">
            + Maaltijden inplannen
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-2.5 bg-secondary rounded-xl">
              <span className="text-base">{TYPE_ICONS[item.maaltijd_type]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.recept_titel}</p>
                {item.calories && (
                  <p className="text-xs text-muted-foreground">{item.calories} kcal · {item.protein_g}g eiwit</p>
                )}
              </div>
            </div>
          ))}
          {/* Totaal */}
          {items.some(i => i.calories) && (() => {
            const totCal = items.reduce((s, i) => s + (i.calories || 0), 0);
            const totProt = items.reduce((s, i) => s + (i.protein_g || 0), 0);
            return (
              <div className="flex justify-between pt-2 border-t border-border text-xs text-muted-foreground">
                <span>Totaal gepland</span>
                <span className="font-medium text-foreground">{totCal} kcal · {totProt}g eiwit</span>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}