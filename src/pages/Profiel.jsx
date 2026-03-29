import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { UserProfile } from '@/api/entities';
import { User, Scale, Ruler, Dumbbell, Target, Edit2, Check, X, LogOut } from 'lucide-react';

const METHODE_OPTIES = [
  { value: 'kracht', label: '🏋️ Klassieke kracht' },
  { value: 'hypertrofie', label: '💪 Hypertrofie' },
  { value: 'hiit', label: '⚡ HIIT' },
  { value: 'tabata', label: '🔥 Tabata' },
];

const ACTIVITY_LABELS = {
  sedentair: 'Sedentair (weinig/geen beweging)',
  licht_actief: 'Licht actief (1-3x/week sport)',
  matig_actief: 'Matig actief (3-5x/week)',
  zeer_actief: 'Zeer actief (6-7x/week)',
  extreem_actief: 'Extreem actief (2x/dag)',
};

const GOAL_LABELS = {
  beginner: '🌱 Beginner',
  gevorderd: '💪 Gevorderd',
  vrouw: '👩 Vrouw specifiek',
  '50plus': '🏅 50+',
  atleet: '🏆 Atleet',
};

export default function Profiel() {
  const { user, profile: authProfile, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (authProfile) {
      setProfile(authProfile);
      setForm(authProfile);
    }
  }, [authProfile]);

  async function save() {
    if (profile) {
      await UserProfile.update(form);
    } else {
      await UserProfile.upsert(form);
    }
    setSaved(true);
    setEditing(false);
    const updated = await UserProfile.get();
    setProfile(updated);
    setForm(updated);
    setTimeout(() => setSaved(false), 3000);
  }

  function update(k, v) {
    setForm(f => ({ ...f, [k]: v }));
  }

  if (!user) return null;

  return (
    <div className="p-6 pb-24 md:pb-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Profiel</h1>
        <p className="text-muted-foreground text-sm">Jouw persoonlijke instellingen en doelen</p>
      </div>

      {/* Gebruikersinfo */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <User className="w-7 h-7 text-primary" />
        </div>
        <div>
          <p className="font-bold text-foreground text-lg">{user.full_name || user.email}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {!profile && !editing && (
        <div className="bg-card border border-border rounded-2xl p-6 text-center mb-6">
          <p className="text-muted-foreground text-sm mb-4">Nog geen profiel aangemaakt. Vul je gegevens in om gepersonaliseerde aanbevelingen te krijgen.</p>
          <button onClick={() => setEditing(true)}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all">
            Profiel aanmaken
          </button>
        </div>
      )}

      {profile && !editing && (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: 'Gewicht', value: profile.weight_kg ? `${profile.weight_kg} kg` : '—', icon: <Scale className="w-4 h-4 text-primary" /> },
              { label: 'Lengte', value: profile.height_cm ? `${profile.height_cm} cm` : '—', icon: <Ruler className="w-4 h-4 text-blue-400" /> },
              { label: 'Leeftijd', value: profile.age ? `${profile.age} jaar` : '—', icon: <User className="w-4 h-4 text-purple-400" /> },
              { label: 'Doelgroep', value: GOAL_LABELS[profile.goal_group] || '—', icon: <Target className="w-4 h-4 text-accent" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
                <p className="font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          {/* Calorieën & macro's */}
          <div className="bg-card border border-border rounded-2xl p-5 mb-6">
            <h2 className="font-semibold text-foreground mb-4">🎯 Doelen</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'TDEE', value: profile.tdee ? `${profile.tdee} kcal` : '—', color: 'text-muted-foreground' },
                { label: 'Doel calorieën', value: profile.target_calories ? `${profile.target_calories} kcal` : '—', color: 'text-orange-400' },
                { label: 'Eiwit', value: profile.protein_target_g ? `${profile.protein_target_g}g` : '—', color: 'text-primary' },
                { label: 'Koolhydraten', value: profile.carbs_target_g ? `${profile.carbs_target_g}g` : '—', color: 'text-blue-400' },
                { label: 'Vetten', value: profile.fat_target_g ? `${profile.fat_target_g}g` : '—', color: 'text-accent' },
                { label: 'Activiteit', value: ACTIVITY_LABELS[profile.activity_level] || '—', color: 'text-muted-foreground' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-secondary rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className={`font-semibold text-sm ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trainingsvoorkeur */}
          <div className="bg-card border border-border rounded-2xl p-5 mb-6">
            <h2 className="font-semibold text-foreground mb-4">🏋️ Trainingsvoorkeur</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Methode', value: METHODE_OPTIES.find(m => m.value === profile.training_methode)?.label || '—' },
                { label: 'Frequentie', value: profile.training_frequentie ? `${profile.training_frequentie}x per week` : '—' },
                { label: 'Locatie', value: profile.training_locatie === 'thuis' ? '🏠 Thuis' : profile.training_locatie === 'gym' ? '🏋️ Gym' : '—' },
                { label: 'Ervaring', value: profile.training_ervaring ? ({ beginner: '🌱 Beginner', gemiddeld: '💪 Gemiddeld', gevorderd: '🏆 Gevorderd' }[profile.training_ervaring] || profile.training_ervaring) : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-secondary rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="font-semibold text-sm text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => setEditing(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-all">
            <Edit2 className="w-4 h-4" /> Profiel bewerken
          </button>
        </>
      )}

      {editing && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-foreground">Profiel bewerken</h2>

          <div className="grid grid-cols-2 gap-4">
            {[
              { k: 'weight_kg', l: 'Gewicht (kg)', p: '80' },
              { k: 'height_cm', l: 'Lengte (cm)', p: '180' },
              { k: 'age', l: 'Leeftijd', p: '30' },
              { k: 'target_calories', l: 'Doel calorieën (kcal)', p: '1800' },
              { k: 'protein_target_g', l: 'Eiwit doel (g)', p: '160' },
              { k: 'carbs_target_g', l: 'Koolhydraten doel (g)', p: '180' },
              { k: 'fat_target_g', l: 'Vetten doel (g)', p: '55' },
              { k: 'tdee', l: 'TDEE (kcal)', p: '2200' },
            ].map(({ k, l, p }) => (
              <div key={k}>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{l}</label>
                <input type="number" value={form[k] || ''} onChange={e => update(k, e.target.value)} placeholder={p}
                  className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Geslacht</label>
            <div className="flex gap-2">
              {[{ v: 'man', l: '♂ Man' }, { v: 'vrouw', l: '♀ Vrouw' }].map(({ v, l }) => (
                <button key={v} onClick={() => update('gender', v)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${form.gender === v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Doelgroep</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(GOAL_LABELS).map(([v, l]) => (
                <button key={v} onClick={() => update('goal_group', v)}
                  className={`py-2.5 px-3 rounded-xl border text-sm text-left font-medium transition-all ${form.goal_group === v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Activiteitsniveau</label>
            <div className="space-y-1.5">
              {Object.entries(ACTIVITY_LABELS).map(([v, l]) => (
                <button key={v} onClick={() => update('activity_level', v)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${form.activity_level === v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Trainingsvoorkeur */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Trainingsmethode</label>
            <div className="grid grid-cols-2 gap-2">
              {METHODE_OPTIES.map(({ value, label }) => (
                <button key={value} onClick={() => update('training_methode', value)}
                  className={`py-2.5 px-3 rounded-xl border text-sm text-left font-medium transition-all ${form.training_methode === value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Trainingsfrequentie</label>
              <div className="flex flex-wrap gap-1.5">
                {[2, 3, 4, 5, 6].map(f => (
                  <button key={f} onClick={() => update('training_frequentie', f)}
                    className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${form.training_frequentie === f ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                    {f}x
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Locatie</label>
              <div className="space-y-1.5">
                {[{ v: 'gym', l: '🏋️ Gym' }, { v: 'thuis', l: '🏠 Thuis' }].map(({ v, l }) => (
                  <button key={v} onClick={() => update('training_locatie', v)}
                    className={`w-full text-left px-3 py-2 rounded-xl border text-xs font-medium transition-all ${form.training_locatie === v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ervaringsniveau</label>
            <div className="grid grid-cols-3 gap-2">
              {[{ v: 'beginner', l: '🌱 Beginner' }, { v: 'gemiddeld', l: '💪 Gemiddeld' }, { v: 'gevorderd', l: '🏆 Gevorderd' }].map(({ v, l }) => (
                <button key={v} onClick={() => update('training_ervaring', v)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${form.training_ervaring === v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditing(false)}
              className="px-5 py-2.5 rounded-xl border border-border text-muted-foreground text-sm hover:border-primary/40 transition-all flex items-center gap-2">
              <X className="w-4 h-4" /> Annuleren
            </button>
            <button onClick={save}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all">
              <Check className="w-4 h-4" /> Opslaan
            </button>
          </div>
        </div>
      )}

      {saved && (
        <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-xl text-sm text-primary text-center">
          ✓ Profiel opgeslagen!
        </div>
      )}

      {/* Logout button */}
      <div className="mt-8 pt-8 border-t border-border">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-destructive/30 text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut className="w-4 h-4" /> Afmelden
        </button>
      </div>
    </div>
  );
}
