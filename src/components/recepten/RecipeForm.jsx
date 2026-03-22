import { useState } from 'react';
import { X, Plus, Trash2, Link, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CATEGORIES = [
  { value: 'ontbijt', label: '🌅 Ontbijt' },
  { value: 'lunch', label: '☀️ Lunch' },
  { value: 'diner', label: '🌙 Diner' },
  { value: 'snack', label: '🍎 Snack' },
  { value: 'dessert', label: '🍫 Dessert' },
  { value: 'smoothie', label: '🥤 Smoothie' },
];

const empty = {
  title: '', description: '', image_url: '', source_url: '', source_name: '',
  category: '', prep_time_min: '', cook_time_min: '', servings: 2,
  calories_per_serving: '', protein_g: '', carbs_g: '', fat_g: '',
  ingredients: [{ name: '', amount: '', unit: '' }],
  instructions: [''],
  tags: [],
};

export default function RecipeForm({ recipe, onSave, onClose }) {
  const [form, setForm] = useState(recipe ? {
    ...recipe,
    ingredients: recipe.ingredients?.length ? recipe.ingredients : [{ name: '', amount: '', unit: '' }],
    instructions: recipe.instructions?.length ? recipe.instructions : [''],
  } : empty);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function updateIngredient(i, k, v) {
    setForm(f => ({ ...f, ingredients: f.ingredients.map((ing, idx) => idx === i ? { ...ing, [k]: v } : ing) }));
  }
  function addIngredient() { setForm(f => ({ ...f, ingredients: [...f.ingredients, { name: '', amount: '', unit: '' }] })); }
  function removeIngredient(i) { setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) })); }

  function updateInstruction(i, v) {
    setForm(f => ({ ...f, instructions: f.instructions.map((s, idx) => idx === i ? v : s) }));
  }
  function addInstruction() { setForm(f => ({ ...f, instructions: [...f.instructions, ''] })); }
  function removeInstruction(i) { setForm(f => ({ ...f, instructions: f.instructions.filter((_, idx) => idx !== i) })); }

  function handleSave() {
    if (!form.title.trim()) return alert('Geef het recept een naam.');
    const clean = {
      ...form,
      prep_time_min: form.prep_time_min ? Number(form.prep_time_min) : undefined,
      cook_time_min: form.cook_time_min ? Number(form.cook_time_min) : undefined,
      servings: form.servings ? Number(form.servings) : undefined,
      calories_per_serving: form.calories_per_serving ? Number(form.calories_per_serving) : undefined,
      protein_g: form.protein_g ? Number(form.protein_g) : undefined,
      carbs_g: form.carbs_g ? Number(form.carbs_g) : undefined,
      fat_g: form.fat_g ? Number(form.fat_g) : undefined,
      ingredients: form.ingredients.filter(i => i.name.trim()),
      instructions: form.instructions.filter(s => s.trim()),
    };
    onSave(clean);
  }

  const inputCls = "w-full bg-input border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";
  const labelCls = "text-xs font-medium text-muted-foreground mb-1.5 block";

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-4 px-4">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl mb-4">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-foreground">{recipe ? 'Recept bewerken' : 'Nieuw recept'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-all">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Basis */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={labelCls}>Naam *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Bijv. Kip met groenten" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Beschrijving</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Korte omschrijving..." className={`${inputCls} resize-none h-16`} />
            </div>
            <div>
              <label className={labelCls}>Afbeelding URL</label>
              <input value={form.image_url} onChange={e => set('image_url', e.target.value)} placeholder="https://..." className={inputCls} />
            </div>
          </div>

          {/* Bron */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Bron URL</label>
              <input value={form.source_url} onChange={e => set('source_url', e.target.value)} placeholder="https://..." className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Bronnaam</label>
              <input value={form.source_name} onChange={e => set('source_name', e.target.value)} placeholder="Bijv. Jumbo, Allerhande" className={inputCls} />
            </div>
          </div>

          {/* Categorie */}
          <div>
            <label className={labelCls}>Categorie</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c.value} onClick={() => set('category', form.category === c.value ? '' : c.value)}
                  className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${form.category === c.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tijd & porties */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Voorbereidingstijd (min)</label>
              <input type="number" value={form.prep_time_min} onChange={e => set('prep_time_min', e.target.value)} placeholder="10" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Bereidingstijd (min)</label>
              <input type="number" value={form.cook_time_min} onChange={e => set('cook_time_min', e.target.value)} placeholder="20" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Porties</label>
              <input type="number" value={form.servings} onChange={e => set('servings', e.target.value)} placeholder="2" className={inputCls} />
            </div>
          </div>

          {/* Voedingswaarden */}
          <div>
            <label className={labelCls}>Voedingswaarden (per portie)</label>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <input type="number" value={form.calories_per_serving} onChange={e => set('calories_per_serving', e.target.value)} placeholder="Kcal" className={inputCls} />
              </div>
              <div>
                <input type="number" value={form.protein_g} onChange={e => set('protein_g', e.target.value)} placeholder="Eiwit (g)" className={inputCls} />
              </div>
              <div>
                <input type="number" value={form.carbs_g} onChange={e => set('carbs_g', e.target.value)} placeholder="Koolh. (g)" className={inputCls} />
              </div>
              <div>
                <input type="number" value={form.fat_g} onChange={e => set('fat_g', e.target.value)} placeholder="Vet (g)" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Ingrediënten */}
          <div>
            <label className={labelCls}>Ingrediënten</label>
            <div className="space-y-2">
              {form.ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={ing.name} onChange={e => updateIngredient(i, 'name', e.target.value)} placeholder="Naam" className={`${inputCls} flex-1`} />
                  <input value={ing.amount} onChange={e => updateIngredient(i, 'amount', e.target.value)} placeholder="Hoev." className={`${inputCls} w-20`} />
                  <input value={ing.unit} onChange={e => updateIngredient(i, 'unit', e.target.value)} placeholder="Eenheid" className={`${inputCls} w-24`} />
                  <button onClick={() => removeIngredient(i)} className="p-2 hover:bg-destructive/10 rounded-lg transition-all shrink-0">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              ))}
              <button onClick={addIngredient} className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-all mt-1">
                <Plus className="w-4 h-4" /> Ingrediënt toevoegen
              </button>
            </div>
          </div>

          {/* Bereiding */}
          <div>
            <label className={labelCls}>Bereiding</label>
            <div className="space-y-2">
              {form.instructions.map((step, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-2">
                    {i + 1}
                  </div>
                  <textarea value={step} onChange={e => updateInstruction(i, e.target.value)} placeholder={`Stap ${i + 1}...`}
                    className={`${inputCls} resize-none h-16 flex-1`} />
                  <button onClick={() => removeInstruction(i)} className="p-2 hover:bg-destructive/10 rounded-lg transition-all shrink-0 mt-1">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              ))}
              <button onClick={addInstruction} className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-all mt-1">
                <Plus className="w-4 h-4" /> Stap toevoegen
              </button>
            </div>
          </div>

          {/* Save */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-border text-muted-foreground text-sm font-medium hover:bg-secondary transition-all">
              Annuleren
            </button>
            <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all">
              {recipe ? 'Wijzigingen opslaan' : 'Recept opslaan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}