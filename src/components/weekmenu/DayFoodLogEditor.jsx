import { useState, useEffect } from 'react';
import { FoodLog, Notification } from '@/api/entities';
import { Plus, Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FoodSearch from '@/components/voeding/FoodSearch';

const EXTRA_TYPES = [
  { value: 'snack', label: '🍎 Snack' },
  { value: 'supplement', label: '💊 Supplement' },
  { value: 'whey', label: '🥤 Whey/Proteïne' },
  { value: 'other', label: '📌 Overig' }
];

export default function DayFoodLogEditor({ date, weekMenuItems, profile, onSaved }) {
  const [foodLog, setFoodLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newExtra, setNewExtra] = useState({ type: 'snack', name: '', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  const [notes, setNotes] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const dateStr = date.toISOString().split('T')[0];

  useEffect(() => {
    loadFoodLog();
  }, [dateStr]);

  async function loadFoodLog() {
    setLoading(true);
    const log = await FoodLog.getByDate(dateStr);

    if (log) {
      setFoodLog(log);
      setNotes(log.notes || '');
    } else {
      // Maak nieuwe FoodLog aan met WeekMenu items
      const newLog = {
        log_date: dateStr,
        status: 'draft',
        meals: weekMenuItems.map(item => ({
          id: item.id,
          meal_type: item.maaltijd_type,
          recipe_title: item.recept_titel,
          calories: item.calories || 0,
          protein_g: item.protein_g || 0,
          carbs_g: item.carbs_g || 0,
          fat_g: item.fat_g || 0,
          eaten: true
        })),
        extras: [],
        total_calories: weekMenuItems.reduce((s, i) => s + (i.calories || 0), 0),
        total_protein_g: weekMenuItems.reduce((s, i) => s + (i.protein_g || 0), 0),
        total_carbs_g: weekMenuItems.reduce((s, i) => s + (i.carbs_g || 0), 0),
        total_fat_g: weekMenuItems.reduce((s, i) => s + (i.fat_g || 0), 0)
      };
      setFoodLog(newLog);
    }
    setLoading(false);
  }

  function addExtra() {
    if (!newExtra.name.trim()) return;
    const updated = {
      ...foodLog,
      extras: [...(foodLog.extras || []), { ...newExtra }]
    };
    updateTotals(updated);
    setFoodLog(updated);
    setNewExtra({ type: 'snack', name: '', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  }

  function removeExtra(idx) {
    const updated = {
      ...foodLog,
      extras: foodLog.extras.filter((_, i) => i !== idx)
    };
    updateTotals(updated);
    setFoodLog(updated);
  }

  function addFromFoodSearch(product) {
    const updated = {
      ...foodLog,
      extras: [...(foodLog.extras || []), {
        type: 'snack',
        name: product.name,
        calories: product.calories,
        protein_g: product.protein_g,
        carbs_g: product.carbs_g,
        fat_g: product.fat_g
      }]
    };
    updateTotals(updated);
    setFoodLog(updated);
  }

  function toggleMealEaten(idx) {
    const updated = {
      ...foodLog,
      meals: foodLog.meals.map((m, i) => i === idx ? { ...m, eaten: !m.eaten } : m)
    };
    updateTotals(updated);
    setFoodLog(updated);
  }

  function updateTotals(log) {
    const meals = log.meals.filter(m => m.eaten);
    const cal = meals.reduce((s, m) => s + (m.calories || 0), 0) + (log.extras || []).reduce((s, e) => s + (e.calories || 0), 0);
    const prot = meals.reduce((s, m) => s + (m.protein_g || 0), 0) + (log.extras || []).reduce((s, e) => s + (e.protein_g || 0), 0);
    const carbs = meals.reduce((s, m) => s + (m.carbs_g || 0), 0) + (log.extras || []).reduce((s, e) => s + (e.carbs_g || 0), 0);
    const fat = meals.reduce((s, m) => s + (m.fat_g || 0), 0) + (log.extras || []).reduce((s, e) => s + (e.fat_g || 0), 0);
    
    log.total_calories = cal;
    log.total_protein_g = prot;
    log.total_carbs_g = carbs;
    log.total_fat_g = fat;
  }

  async function submitDay() {
    setSubmitting(true);
    const logData = {
      ...foodLog,
      notes,
      status: 'submitted',
      submitted_at: new Date().toISOString()
    };

    if (foodLog.id) {
      await FoodLog.update(foodLog.id, logData);
    } else {
      await FoodLog.create(logData);
    }

    // Notificatie aanmaken
    await Notification.create({
      type: 'nutrition_update',
      title: 'Voeding ingediend',
      message: `Je voeding van ${dateStr} is ingediend. Totaal: ${logData.total_calories} kcal`,
      related_entity: 'FoodLog',
      related_entity_id: foodLog.id || '',
      link: '/weekmenu',
      source: 'in_app'
    });

    setSubmitting(false);
    if (onSaved) onSaved();
  }

  if (loading) return <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />;

  const macroDifference = {
    cal: profile?.target_calories ? foodLog.total_calories - profile.target_calories : 0,
    prot: profile?.protein_target_g ? foodLog.total_protein_g - profile.protein_target_g : 0,
  };

  return (
    <div className="space-y-4">
      {/* Status indicator */}
      <div className={`flex items-center gap-2 p-3 rounded-xl border ${
        foodLog.status === 'submitted' 
          ? 'border-green-500/30 bg-green-500/10 text-green-600' 
          : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-600'
      }`}>
        {foodLog.status === 'submitted' ? (
          <><CheckCircle className="w-4 h-4" /> <span className="text-xs font-medium">Ingediend op {new Date(foodLog.submitted_at).toLocaleDateString('nl-NL')}</span></>
        ) : (
          <><AlertCircle className="w-4 h-4" /> <span className="text-xs font-medium">In bewerking - nog niet ingediend</span></>
        )}
      </div>

      {/* Geplande maaltijden */}
      {foodLog.meals && foodLog.meals.length > 0 && (
        <div className="bg-secondary/30 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground mb-3">GEPLANDE MAALTIJDEN</p>
          {foodLog.meals.map((meal, idx) => (
            <label key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-all">
              <input 
                type="checkbox" 
                checked={meal.eaten} 
                onChange={() => toggleMealEaten(idx)}
                className="w-4 h-4 rounded border-border"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground capitalize">{meal.recipe_title || meal.meal_type}</p>
                <p className="text-xs text-muted-foreground">{meal.calories} kcal · {meal.protein_g}g eiwit</p>
              </div>
            </label>
          ))}
        </div>
      )}

      {/* Extra items */}
      <div className="bg-secondary/30 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground mb-3">EXTRA SNACKS / SUPPLEMENTEN</p>
        {foodLog.extras && foodLog.extras.map((extra, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">{extra.name}</p>
              <p className="text-xs text-muted-foreground">{extra.calories} kcal · {extra.protein_g}g eiwit</p>
            </div>
            <button onClick={() => removeExtra(idx)} className="p-1 text-destructive hover:bg-destructive/10 rounded-lg">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Nieuw extra toevoegen */}
        <div className="bg-background/50 rounded-lg p-3 space-y-3 mt-3 border border-dashed border-border">
          <div className="grid grid-cols-2 gap-2">
            <select 
              value={newExtra.type} 
              onChange={e => setNewExtra(p => ({ ...p, type: e.target.value }))}
              className="col-span-2 bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground"
            >
              {EXTRA_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input 
              type="text"
              placeholder="Naam"
              value={newExtra.name}
              onChange={e => setNewExtra(p => ({ ...p, name: e.target.value }))}
              className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground"
            />
            <input 
              type="number"
              placeholder="Kcal"
              value={newExtra.calories}
              onChange={e => setNewExtra(p => ({ ...p, calories: parseFloat(e.target.value) || 0 }))}
              className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground"
            />
            <input 
              type="number"
              placeholder="Eiwit (g)"
              value={newExtra.protein_g}
              onChange={e => setNewExtra(p => ({ ...p, protein_g: parseFloat(e.target.value) || 0 }))}
              className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground"
            />
            <input 
              type="number"
              placeholder="Carbs (g)"
              value={newExtra.carbs_g}
              onChange={e => setNewExtra(p => ({ ...p, carbs_g: parseFloat(e.target.value) || 0 }))}
              className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground"
            />
            <input 
              type="number"
              placeholder="Vet (g)"
              value={newExtra.fat_g}
              onChange={e => setNewExtra(p => ({ ...p, fat_g: parseFloat(e.target.value) || 0 }))}
              className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground"
            />
          </div>
          <Button size="sm" onClick={addExtra} className="w-full gap-2 bg-primary/20 text-primary hover:bg-primary/30 border-0">
            <Plus className="w-4 h-4" /> Toevoegen
          </Button>
          <Button size="sm" onClick={() => setSearchOpen(true)} variant="outline" className="w-full gap-2 border-primary/30">
            <Plus className="w-4 h-4" /> Van database zoeken
          </Button>
          </div>
          </div>

      {/* Totalen */}
      {profile && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground mb-3">TOTAAL VANDAAG</p>
          {[
            { label: 'Calorieën', actual: foodLog.total_calories, target: profile.target_calories, unit: 'kcal', kleur: 'text-orange-400' },
            { label: 'Eiwit', actual: foodLog.total_protein_g, target: profile.protein_target_g, unit: 'g', kleur: 'text-primary' },
          ].map(({ label, actual, target, unit, kleur }) => (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{label}</span>
                <span className={kleur}>
                  {actual} / {target} {unit}
                  {actual > target && <span className="text-destructive ml-1">+{Math.round((actual - target) * 10) / 10}</span>}
                </span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full ${actual > target ? 'bg-destructive' : kleur} rounded-full`}
                  style={{ width: `${Math.min((actual / target) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notities */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notities</label>
        <textarea 
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Hoe voelde je je eten vandaag? Honger, verzadiging, etc."
          className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground resize-none h-20"
        />
      </div>

      {/* Submit button */}
      {foodLog.status !== 'submitted' && (
        <Button 
          onClick={submitDay} 
          disabled={submitting}
          className="w-full gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {submitting ? 'Indienen...' : 'Dag indienen'}
        </Button>
      )}

      {searchOpen && (
        <FoodSearch
          onSelect={addFromFoodSearch}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </div>
  );
}