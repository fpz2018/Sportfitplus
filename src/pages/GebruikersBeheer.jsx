import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserProfile, DailyLog, FoodLog, HRVLog } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import {
  Users, Search, ArrowLeft, Crown, ShieldCheck, Save,
  Loader2, Calendar, Dumbbell, Utensils, Heart, TrendingUp,
  ChevronRight, Mail, Ruler, Weight, Target, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Gebruikerslijst ──────────────────────────────────────────────────────

function UserList({ users, onSelect, selectedId }) {
  const [zoek, setZoek] = useState('');

  const filtered = users.filter(u => {
    const q = zoek.toLowerCase();
    return (u.full_name || '').toLowerCase().includes(q)
      || (u.email || '').toLowerCase().includes(q)
      || (u.role || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-3">
      {/* Zoekbalk */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Zoek op naam of e-mail..."
          value={zoek}
          onChange={e => setZoek(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Stats */}
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span>{users.length} gebruikers totaal</span>
        <span>{users.filter(u => u.is_premium).length} premium</span>
        <span>{users.filter(u => u.role === 'admin').length} admins</span>
      </div>

      {/* Lijst */}
      <div className="space-y-1.5 max-h-[calc(100vh-220px)] overflow-y-auto">
        {filtered.map(user => (
          <button
            key={user.id}
            onClick={() => onSelect(user)}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all',
              selectedId === user.id
                ? 'bg-primary/15 border border-primary/30'
                : 'hover:bg-secondary/50 border border-transparent'
            )}
          >
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-foreground">
                {(user.full_name || user.email || '?')[0].toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.full_name || 'Geen naam'}
                </p>
                {user.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                {user.is_premium && <Crown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground truncate">{user.email || user.id.slice(0, 8)}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Geen gebruikers gevonden</p>
        )}
      </div>
    </div>
  );
}

// ─── Activiteit tab ───────────────────────────────────────────────────────

function ActivityTab({ userId }) {
  const { data: dailyLogs, isLoading: loadingDaily } = useQuery({
    queryKey: ['admin-daily-logs', userId],
    queryFn: () => DailyLog.listForUser(userId, 14),
  });

  const { data: foodLogs, isLoading: loadingFood } = useQuery({
    queryKey: ['admin-food-logs', userId],
    queryFn: () => FoodLog.listForUser(userId, 14),
  });

  const { data: hrvLogs, isLoading: loadingHRV } = useQuery({
    queryKey: ['admin-hrv-logs', userId],
    queryFn: () => HRVLog.listForUser(userId, 14),
  });

  const isLoading = loadingDaily || loadingFood || loadingHRV;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const allEvents = [];

  (dailyLogs || []).forEach(log => {
    const parts = [];
    if (log.weight_kg) parts.push(`${log.weight_kg} kg`);
    if (log.training_type) parts.push(`Training: ${log.training_type}`);
    if (log.mood) parts.push(`Stemming: ${log.mood}`);
    if (log.steps) parts.push(`${log.steps} stappen`);
    allEvents.push({
      date: log.log_date,
      type: 'daily',
      icon: Calendar,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      label: 'Daglog',
      detail: parts.join(' · ') || 'Ingevuld',
    });
  });

  (foodLogs || []).forEach(log => {
    const cal = log.total_calories ? `${Math.round(log.total_calories)} kcal` : '';
    const prot = log.total_protein_g ? `${Math.round(log.total_protein_g)}g eiwit` : '';
    allEvents.push({
      date: log.log_date,
      type: 'food',
      icon: Utensils,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      label: 'Voedingslog',
      detail: [cal, prot].filter(Boolean).join(' · ') || 'Ingevuld',
    });
  });

  (hrvLogs || []).forEach(log => {
    const parts = [];
    if (log.hrv_waarde) parts.push(`HRV: ${log.hrv_waarde}`);
    if (log.slaap_uren) parts.push(`Slaap: ${log.slaap_uren}u`);
    if (log.stress_niveau) parts.push(`Stress: ${log.stress_niveau}/10`);
    allEvents.push({
      date: log.log_date,
      type: 'hrv',
      icon: Heart,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      label: 'HRV/Welzijn',
      detail: parts.join(' · ') || 'Ingevuld',
    });
  });

  allEvents.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      {/* Samenvatting */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border p-3 text-center">
          <Calendar className="w-4 h-4 text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{dailyLogs?.length || 0}</p>
          <p className="text-xs text-muted-foreground">Daglogs</p>
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          <Utensils className="w-4 h-4 text-orange-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{foodLogs?.length || 0}</p>
          <p className="text-xs text-muted-foreground">Voedingslogs</p>
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          <Heart className="w-4 h-4 text-red-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{hrvLogs?.length || 0}</p>
          <p className="text-xs text-muted-foreground">HRV logs</p>
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Laatste 14 dagen
        </h3>
        {allEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Geen activiteit gevonden</p>
        ) : (
          <div className="space-y-1.5">
            {allEvents.map((ev, i) => {
              const Icon = ev.icon;
              return (
                <div key={`${ev.type}-${ev.date}-${i}`} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-secondary/30">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${ev.bg}`}>
                    <Icon className={`w-3.5 h-3.5 ${ev.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{ev.label}</p>
                      <span className="text-xs text-muted-foreground">{ev.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{ev.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Profiel bewerken tab ─────────────────────────────────────────────────

function EditTab({ user, onSaved }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    full_name: user.full_name || '',
    role: user.role || 'user',
    is_premium: user.is_premium || false,
    gender: user.gender || '',
    age: user.age || '',
    weight_kg: user.weight_kg || '',
    height_cm: user.height_cm || '',
    activity_level: user.activity_level || '',
    goal_group: user.goal_group || '',
    target_calories: user.target_calories || '',
    protein_target_g: user.protein_target_g || '',
    carbs_target_g: user.carbs_target_g || '',
    fat_target_g: user.fat_target_g || '',
  });

  const mutation = useMutation({
    mutationFn: (data) => UserProfile.adminUpdate(user.id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      onSaved(updated);
    },
  });

  const handleSave = () => {
    const payload = {
      ...form,
      age: form.age ? Number(form.age) : null,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
      target_calories: form.target_calories ? Number(form.target_calories) : null,
      protein_target_g: form.protein_target_g ? Number(form.protein_target_g) : null,
      carbs_target_g: form.carbs_target_g ? Number(form.carbs_target_g) : null,
      fat_target_g: form.fat_target_g ? Number(form.fat_target_g) : null,
    };
    mutation.mutate(payload);
  };

  const Field = ({ label, icon: Icon, children }) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      {children}
    </div>
  );

  const inputCls = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="space-y-5">
      {/* Basis */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Basisgegevens</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Naam" icon={Users}>
            <input type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className={inputCls} />
          </Field>
          <Field label="Rol" icon={ShieldCheck}>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className={inputCls}>
              <option value="user">Gebruiker</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <Field label="Geslacht">
            <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} className={inputCls}>
              <option value="">—</option>
              <option value="man">Man</option>
              <option value="vrouw">Vrouw</option>
            </select>
          </Field>
          <Field label="Leeftijd">
            <input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} className={inputCls} />
          </Field>
        </div>
      </div>

      {/* Lichaam */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Lichaam & doelen</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="Gewicht (kg)" icon={Weight}>
            <input type="number" step="0.1" value={form.weight_kg} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))} className={inputCls} />
          </Field>
          <Field label="Lengte (cm)" icon={Ruler}>
            <input type="number" value={form.height_cm} onChange={e => setForm(f => ({ ...f, height_cm: e.target.value }))} className={inputCls} />
          </Field>
          <Field label="Activiteitsniveau">
            <select value={form.activity_level} onChange={e => setForm(f => ({ ...f, activity_level: e.target.value }))} className={inputCls}>
              <option value="">—</option>
              <option value="sedentair">Sedentair</option>
              <option value="licht_actief">Licht actief</option>
              <option value="matig_actief">Matig actief</option>
              <option value="zeer_actief">Zeer actief</option>
              <option value="extreem_actief">Extreem actief</option>
            </select>
          </Field>
          <Field label="Doelgroep" icon={Target}>
            <select value={form.goal_group} onChange={e => setForm(f => ({ ...f, goal_group: e.target.value }))} className={inputCls}>
              <option value="">—</option>
              <option value="afvallen">Afvallen</option>
              <option value="opbouwen">Spiermassa opbouwen</option>
              <option value="onderhouden">Onderhouden</option>
              <option value="gezond_leven">Gezond leven</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Macro's */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Macrodoel</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Calorieën">
            <input type="number" value={form.target_calories} onChange={e => setForm(f => ({ ...f, target_calories: e.target.value }))} className={inputCls} />
          </Field>
          <Field label="Eiwit (g)">
            <input type="number" value={form.protein_target_g} onChange={e => setForm(f => ({ ...f, protein_target_g: e.target.value }))} className={inputCls} />
          </Field>
          <Field label="Koolhydraten (g)">
            <input type="number" value={form.carbs_target_g} onChange={e => setForm(f => ({ ...f, carbs_target_g: e.target.value }))} className={inputCls} />
          </Field>
          <Field label="Vet (g)">
            <input type="number" value={form.fat_target_g} onChange={e => setForm(f => ({ ...f, fat_target_g: e.target.value }))} className={inputCls} />
          </Field>
        </div>
      </div>

      {/* Premium toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium text-foreground">Premium account</span>
        </div>
        <button
          onClick={() => setForm(f => ({ ...f, is_premium: !f.is_premium }))}
          className={cn(
            'w-10 h-6 rounded-full transition-colors relative',
            form.is_premium ? 'bg-primary' : 'bg-secondary'
          )}
        >
          <span className={cn(
            'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
            form.is_premium ? 'left-5' : 'left-1'
          )} />
        </button>
      </div>

      {/* Opslaan */}
      <button
        onClick={handleSave}
        disabled={mutation.isPending}
        className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Opslaan
      </button>

      {mutation.isSuccess && (
        <p className="text-sm text-green-600 bg-green-500/10 rounded-lg px-3 py-2 text-center">Profiel opgeslagen!</p>
      )}
      {mutation.isError && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 text-center">
          Fout: {mutation.error.message}
        </p>
      )}
    </div>
  );
}

// ─── User detail panel ────────────────────────────────────────────────────

function UserDetail({ user, onBack, onSaved }) {
  const [tab, setTab] = useState('activiteit');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <span className="text-lg font-bold text-foreground">
            {(user.full_name || user.email || '?')[0].toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-bold text-foreground truncate">{user.full_name || 'Geen naam'}</h2>
            {user.role === 'admin' && <ShieldCheck className="w-4 h-4 text-blue-500" />}
            {user.is_premium && <Crown className="w-4 h-4 text-yellow-500" />}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Mail className="w-3 h-3" />
            {user.email || user.id.slice(0, 12)}
          </p>
        </div>
      </div>

      {/* Info-kaarten */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        {[
          { label: 'Lid sinds', value: user.created_at ? new Date(user.created_at).toLocaleDateString('nl-NL') : '—', icon: Clock },
          { label: 'Gewicht', value: user.weight_kg ? `${user.weight_kg} kg` : '—', icon: Weight },
          { label: 'Doel', value: user.goal_group || '—', icon: Target },
          { label: 'Kcal doel', value: user.target_calories || '—', icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-border p-2.5">
            <Icon className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold text-foreground truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {[
          { key: 'activiteit', label: 'Activiteit', icon: TrendingUp },
          { key: 'bewerken', label: 'Bewerken', icon: Save },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all',
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'activiteit' && <ActivityTab userId={user.id} />}
      {tab === 'bewerken' && <EditTab user={user} onSaved={onSaved} />}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────

export default function GebruikersBeheer() {
  const { profile, isLoadingAuth } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => UserProfile.listAll(),
    enabled: !isLoadingAuth && profile?.role === 'admin',
  });

  if (isLoadingAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Geen toegang</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20">
      {!selectedUser ? (
        <>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <h1 className="text-lg font-bold text-foreground">Gebruikersbeheer</h1>
          </div>
          <UserList
            users={users || []}
            onSelect={setSelectedUser}
            selectedId={null}
          />
        </>
      ) : (
        <UserDetail
          user={selectedUser}
          onBack={() => setSelectedUser(null)}
          onSaved={(updated) => setSelectedUser(updated)}
        />
      )}
    </div>
  );
}
