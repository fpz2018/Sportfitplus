/**
 * entities.js
 * Centrale data-laag — vervangt alle base44.entities.* aanroepen.
 * Elke functie gooit een Error bij een Supabase-fout zodat React Query
 * de fout correct kan afhandelen.
 */
import { supabase } from './supabaseClient';

// ─── helpers ────────────────────────────────────────────────────────────────

const unwrap = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

// Haal huidige user-id op (gooit als niet ingelogd)
const uid = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Niet ingelogd');
  return user.id;
};

// ─── UserProfile ────────────────────────────────────────────────────────────

export const UserProfile = {
  async get() {
    const userId = await uid();
    return unwrap(
      await supabase.from('user_profiles').select('*').eq('id', userId).single()
    );
  },
  async listAll() {
    // Admin-only via RLS
    return unwrap(
      await supabase.from('user_profiles').select('*').order('created_at', { ascending: false })
    );
  },
  async update(data) {
    const userId = await uid();
    return unwrap(
      await supabase.from('user_profiles').update(data).eq('id', userId).select().single()
    );
  },
  async upsert(data) {
    const userId = await uid();
    return unwrap(
      await supabase.from('user_profiles').upsert({ id: userId, ...data }).select().single()
    );
  },
  // Admin-only: update een ander profiel
  async adminUpdate(userId, data) {
    return unwrap(
      await supabase.from('user_profiles').update(data).eq('id', userId).select().single()
    );
  },
};

// ─── DailyLog ───────────────────────────────────────────────────────────────

const DAILY_LOG_COLUMNS = 'id,user_id,log_date,calories_logged,protein_g,carbs_g,fat_g,training_type,steps,mood,weight_kg,created_at';

export const DailyLog = {
  async list(limitDays = 30) {
    const userId = await uid();
    return unwrap(
      await supabase
        .from('daily_logs')
        .select(DAILY_LOG_COLUMNS)
        .eq('user_id', userId)
        .order('log_date', { ascending: false })
        .limit(limitDays)
    );
  },
  async getByDate(date) {
    const userId = await uid();
    const { data, error } = await supabase
      .from('daily_logs')
      .select(DAILY_LOG_COLUMNS)
      .eq('user_id', userId)
      .eq('log_date', date)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  async upsert(date, data) {
    const userId = await uid();
    return unwrap(
      await supabase
        .from('daily_logs')
        .upsert({ user_id: userId, log_date: date, ...data })
        .select()
        .single()
    );
  },
  async create(data) {
    const userId = await uid();
    return unwrap(
      await supabase.from('daily_logs').insert({ ...data, user_id: userId }).select().single()
    );
  },
  async update(id, data) {
    return unwrap(
      await supabase.from('daily_logs').update(data).eq('id', id).select().single()
    );
  },
  async delete(id) {
    return unwrap(await supabase.from('daily_logs').delete().eq('id', id));
  },
  // Admin-only: logs van een specifieke gebruiker
  async listForUser(userId, limit = 30) {
    return unwrap(
      await supabase
        .from('daily_logs')
        .select(DAILY_LOG_COLUMNS)
        .eq('user_id', userId)
        .order('log_date', { ascending: false })
        .limit(limit)
    );
  },
};

// ─── FoodLog ────────────────────────────────────────────────────────────────

const FOOD_LOG_COLUMNS = 'id,user_id,log_date,meals,extras,total_calories,total_protein_g,total_carbs_g,total_fat_g,status,notes,created_at';

export const FoodLog = {
  async list(limitDays = 30) {
    const userId = await uid();
    return unwrap(
      await supabase
        .from('food_logs')
        .select(FOOD_LOG_COLUMNS)
        .eq('user_id', userId)
        .order('log_date', { ascending: false })
        .limit(limitDays)
    );
  },
  async getByDate(date) {
    const userId = await uid();
    const { data, error } = await supabase
      .from('food_logs')
      .select(FOOD_LOG_COLUMNS)
      .eq('user_id', userId)
      .eq('log_date', date)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  // Logs binnen een datum-bereik (inclusief from/to, ISO yyyy-MM-dd)
  async listRange(from, to) {
    const userId = await uid();
    return unwrap(
      await supabase
        .from('food_logs')
        .select(FOOD_LOG_COLUMNS)
        .eq('user_id', userId)
        .gte('log_date', from)
        .lte('log_date', to)
        .order('log_date', { ascending: true })
    );
  },
  async create(data) {
    const userId = await uid();
    return unwrap(
      await supabase.from('food_logs').insert({ ...data, user_id: userId }).select().single()
    );
  },
  async update(id, data) {
    return unwrap(
      await supabase.from('food_logs').update(data).eq('id', id).select().single()
    );
  },
  async upsert(date, data) {
    const userId = await uid();
    return unwrap(
      await supabase
        .from('food_logs')
        .upsert({ user_id: userId, log_date: date, ...data })
        .select()
        .single()
    );
  },
  // Admin-only
  async listForUser(userId, limit = 30) {
    return unwrap(
      await supabase
        .from('food_logs')
        .select(FOOD_LOG_COLUMNS)
        .eq('user_id', userId)
        .order('log_date', { ascending: false })
        .limit(limit)
    );
  },
};

// ─── Food ───────────────────────────────────────────────────────────────────

const FOOD_COLUMNS = 'id,name,brand,category,calories,protein_g,carbs_g,fat_g,fiber_g,source,created_by';

export const Food = {
  async list(limit = 50) {
    return unwrap(
      await supabase.from('food').select(FOOD_COLUMNS).order('name').limit(limit)
    );
  },
  async search(query) {
    return unwrap(
      await supabase
        .from('food')
        .select(FOOD_COLUMNS)
        .ilike('name', `%${query}%`)
        .limit(20)
    );
  },
  async create(data) {
    const userId = await uid();
    return unwrap(
      await supabase.from('food').insert({ ...data, created_by: userId }).select().single()
    );
  },
  async bulkCreate(items) {
    const userId = await uid();
    const rows = items.map(item => ({ ...item, created_by: userId }));
    return unwrap(await supabase.from('food').insert(rows).select());
  },
  async delete(id) {
    return unwrap(await supabase.from('food').delete().eq('id', id));
  },
  async deleteAll() {
    // Verwijdert alle food records van de ingelogde user
    const userId = await uid();
    return unwrap(await supabase.from('food').delete().eq('created_by', userId));
  },
};

// ─── Recipe ─────────────────────────────────────────────────────────────────

const RECIPE_LIST_COLUMNS = 'id,title,description,image_url,category,prep_time_min,servings,calories_per_serving,protein_g,carbs_g,fat_g,is_favorite,status,created_by,created_at';

export const Recipe = {
  async list(status = 'gepubliceerd', limit = 50) {
    return unwrap(
      await supabase
        .from('recipes')
        .select(RECIPE_LIST_COLUMNS)
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(limit)
    );
  },
  async get(id) {
    // Volledig recept met ingrediënten/instructies
    return unwrap(
      await supabase.from('recipes').select('*').eq('id', id).single()
    );
  },
  async create(data) {
    const userId = await uid();
    return unwrap(
      await supabase.from('recipes').insert({ ...data, created_by: userId }).select().single()
    );
  },
  async update(id, data) {
    return unwrap(
      await supabase.from('recipes').update(data).eq('id', id).select().single()
    );
  },
  async delete(id) {
    return unwrap(await supabase.from('recipes').delete().eq('id', id));
  },
  async deleteImported() {
    return unwrap(
      await supabase.from('recipes').delete().not('source_url', 'is', null)
    );
  },
};

// ─── WeekMenu ───────────────────────────────────────────────────────────────

export const WeekMenu = {
  async listByWeek(startDate, endDate) {
    const userId = await uid();
    return unwrap(
      await supabase
        .from('week_menus')
        .select('*')
        .eq('user_id', userId)
        .gte('datum', startDate)
        .lte('datum', endDate)
        .order('datum')
    );
  },
  async listAll() {
    const userId = await uid();
    return unwrap(
      await supabase
        .from('week_menus')
        .select('*')
        .eq('user_id', userId)
        .order('datum', { ascending: false })
    );
  },
  async getByDate(date) {
    const userId = await uid();
    return unwrap(
      await supabase
        .from('week_menus')
        .select('*')
        .eq('user_id', userId)
        .eq('datum', date)
    );
  },
  async create(data) {
    const userId = await uid();
    return unwrap(
      await supabase.from('week_menus').insert({ ...data, user_id: userId }).select().single()
    );
  },
  async delete(id) {
    return unwrap(await supabase.from('week_menus').delete().eq('id', id));
  },
};

// ─── HRVLog ─────────────────────────────────────────────────────────────────

export const HRVLog = {
  async list(limit = 30) {
    const userId = await uid();
    return unwrap(
      await supabase
        .from('hrv_logs')
        .select('*')
        .eq('user_id', userId)
        .order('log_date', { ascending: false })
        .limit(limit)
    );
  },
  async getByDate(date) {
    const userId = await uid();
    const { data, error } = await supabase
      .from('hrv_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', date)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  async create(data) {
    const userId = await uid();
    return unwrap(
      await supabase.from('hrv_logs').insert({ ...data, user_id: userId }).select().single()
    );
  },
  async delete(id) {
    return unwrap(await supabase.from('hrv_logs').delete().eq('id', id));
  },
  // Admin-only
  async listForUser(userId, limit = 30) {
    return unwrap(
      await supabase
        .from('hrv_logs')
        .select('*')
        .eq('user_id', userId)
        .order('log_date', { ascending: false })
        .limit(limit)
    );
  },
};

// ─── Supplement ─────────────────────────────────────────────────────────────

export const Supplement = {
  async list() {
    return unwrap(
      await supabase.from('supplements').select('*').order('naam')
    );
  },
  async get(id) {
    return unwrap(
      await supabase.from('supplements').select('*').eq('id', id).single()
    );
  },
  async create(data) {
    return unwrap(
      await supabase.from('supplements').insert(data).select().single()
    );
  },
  async update(id, data) {
    return unwrap(
      await supabase.from('supplements').update(data).eq('id', id).select().single()
    );
  },
  async delete(id) {
    return unwrap(await supabase.from('supplements').delete().eq('id', id));
  },
};

// ─── SupplementNieuws ────────────────────────────────────────────────────────

export const SupplementNieuws = {
  async list(status = 'gepubliceerd') {
    return unwrap(
      await supabase
        .from('supplement_nieuws')
        .select('*')
        .eq('status', status)
        .order('gepubliceerd_op', { ascending: false })
    );
  },
  async listAll() {
    return unwrap(
      await supabase
        .from('supplement_nieuws')
        .select('*')
        .order('created_at', { ascending: false })
    );
  },
  async create(data) {
    return unwrap(
      await supabase.from('supplement_nieuws').insert(data).select().single()
    );
  },
  async update(id, data) {
    return unwrap(
      await supabase.from('supplement_nieuws').update(data).eq('id', id).select().single()
    );
  },
  async delete(id) {
    return unwrap(await supabase.from('supplement_nieuws').delete().eq('id', id));
  },
};

// ─── SupplementProduct ───────────────────────────────────────────────────────

export const SupplementProduct = {
  async list() {
    return unwrap(
      await supabase.from('supplement_producten').select('*').order('naam')
    );
  },
  async create(data) {
    return unwrap(
      await supabase.from('supplement_producten').insert(data).select().single()
    );
  },
  async update(id, data) {
    return unwrap(
      await supabase.from('supplement_producten').update(data).eq('id', id).select().single()
    );
  },
  async delete(id) {
    return unwrap(await supabase.from('supplement_producten').delete().eq('id', id));
  },
};

// ─── KennisArtikel ──────────────────────────────────────────────────────────

export const KennisArtikel = {
  async list(status = 'approved', limit = 100) {
    return unwrap(
      await supabase
        .from('kennis_artikelen')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(limit)
    );
  },
  async listAll(limit = 100) {
    return unwrap(
      await supabase
        .from('kennis_artikelen')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
    );
  },
  async update(id, data) {
    return unwrap(
      await supabase.from('kennis_artikelen').update(data).eq('id', id).select().single()
    );
  },
  async create(data) {
    return unwrap(
      await supabase.from('kennis_artikelen').insert(data).select().single()
    );
  },
  async bulkCreate(items) {
    return unwrap(await supabase.from('kennis_artikelen').insert(items).select());
  },
};

// ─── KennisAnalyseRun ───────────────────────────────────────────────────────

export const KennisAnalyseRun = {
  async list() {
    return unwrap(
      await supabase
        .from('kennis_analyse_runs')
        .select('*')
        .order('gestart_op', { ascending: false })
    );
  },
  async create(data) {
    return unwrap(
      await supabase.from('kennis_analyse_runs').insert(data).select().single()
    );
  },
  async update(id, data) {
    return unwrap(
      await supabase.from('kennis_analyse_runs').update(data).eq('id', id).select().single()
    );
  },
};

// ─── WijzigingsVoorstel ─────────────────────────────────────────────────────

export const WijzigingsVoorstel = {
  async list(status) {
    let query = supabase
      .from('wijzigings_voorstellen')
      .select('*')
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    return unwrap(await query);
  },
  async create(data) {
    return unwrap(
      await supabase.from('wijzigings_voorstellen').insert(data).select().single()
    );
  },
  async update(id, data) {
    return unwrap(
      await supabase.from('wijzigings_voorstellen').update(data).eq('id', id).select().single()
    );
  },
};

// ─── BronBestand ────────────────────────────────────────────────────────────

export const BronBestand = {
  async list() {
    return unwrap(
      await supabase
        .from('bron_bestanden')
        .select('*')
        .order('created_at', { ascending: false })
    );
  },
  async create(data) {
    return unwrap(
      await supabase.from('bron_bestanden').insert(data).select().single()
    );
  },
  async update(id, data) {
    return unwrap(
      await supabase.from('bron_bestanden').update(data).eq('id', id).select().single()
    );
  },
  async delete(id) {
    return unwrap(await supabase.from('bron_bestanden').delete().eq('id', id));
  },
};

// ─── AppInzicht ─────────────────────────────────────────────────────────────

export const AppInzicht = {
  async list(status) {
    let query = supabase
      .from('app_inzichten')
      .select('*')
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    return unwrap(await query);
  },
  async create(data) {
    return unwrap(
      await supabase.from('app_inzichten').insert(data).select().single()
    );
  },
  async update(id, data) {
    return unwrap(
      await supabase.from('app_inzichten').update(data).eq('id', id).select().single()
    );
  },
};

// ─── AuditLog ───────────────────────────────────────────────────────────────

export const AuditLog = {
  async create(data) {
    return unwrap(
      await supabase.from('audit_logs').insert(data).select().single()
    );
  },
  async list(limit = 50) {
    return unwrap(
      await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
    );
  },
};

// ─── CodeTaak ───────────────────────────────────────────────────────────────

export const CodeTaak = {
  async list() {
    return unwrap(
      await supabase
        .from('code_taken')
        .select('*')
        .order('created_at', { ascending: false })
    );
  },
  async create(data) {
    return unwrap(
      await supabase.from('code_taken').insert(data).select().single()
    );
  },
  async update(id, data) {
    return unwrap(
      await supabase.from('code_taken').update(data).eq('id', id).select().single()
    );
  },
};

// ─── Notification ───────────────────────────────────────────────────────────

export const Notification = {
  async list(onlyUnread = false) {
    const userId = await uid();
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (onlyUnread) query = query.eq('read', false);
    return unwrap(await query);
  },
  async markRead(id) {
    return unwrap(
      await supabase.from('notifications').update({ read: true }).eq('id', id)
    );
  },
  async markAllRead() {
    const userId = await uid();
    return unwrap(
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)
    );
  },
  async create(data) {
    const userId = await uid();
    return unwrap(
      await supabase.from('notifications').insert({ ...data, user_id: userId }).select().single()
    );
  },
  async delete(id) {
    return unwrap(await supabase.from('notifications').delete().eq('id', id));
  },
};

// ─── Nieuwsbericht ──────────────────────────────────────────────────────────

export const Nieuwsbericht = {
  async list(status = 'gepubliceerd') {
    return unwrap(
      await supabase
        .from('nieuwsberichten')
        .select('*')
        .eq('status', status)
        .order('gepubliceerd_op', { ascending: false })
    );
  },
  async listAll() {
    return unwrap(
      await supabase
        .from('nieuwsberichten')
        .select('*')
        .order('created_at', { ascending: false })
    );
  },
  async create(data) {
    return unwrap(
      await supabase.from('nieuwsberichten').insert(data).select().single()
    );
  },
  async update(id, data) {
    return unwrap(
      await supabase.from('nieuwsberichten').update(data).eq('id', id).select().single()
    );
  },
  async delete(id) {
    return unwrap(await supabase.from('nieuwsberichten').delete().eq('id', id));
  },
};

// ─── ContentBron ────────────────────────────────────────────────────────────

export const ContentBron = {
  async list() {
    return unwrap(
      await supabase
        .from('content_bronnen')
        .select('*')
        .order('created_at', { ascending: false })
    );
  },
  async create(data) {
    const userId = await uid();
    return unwrap(
      await supabase.from('content_bronnen').insert({ ...data, created_by: userId }).select().single()
    );
  },
  async update(id, data) {
    return unwrap(
      await supabase.from('content_bronnen').update(data).eq('id', id).select().single()
    );
  },
  async delete(id) {
    return unwrap(await supabase.from('content_bronnen').delete().eq('id', id));
  },
};

// ─── CustomSchema ────────────────────────────────────────────────────────────

export const CustomSchema = {
  async list() {
    const userId = await uid();
    return unwrap(
      await supabase
        .from('custom_schemas')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    );
  },
  async create(data) {
    const userId = await uid();
    return unwrap(
      await supabase.from('custom_schemas').insert({ ...data, user_id: userId }).select().single()
    );
  },
  async update(id, data) {
    return unwrap(
      await supabase.from('custom_schemas').update(data).eq('id', id).select().single()
    );
  },
  async delete(id) {
    return unwrap(await supabase.from('custom_schemas').delete().eq('id', id));
  },
};

// ─── WorkoutLog ──────────────────────────────────────────────────────────────

export const WorkoutLog = {
  async list(limit = 60) {
    const userId = await uid();
    return unwrap(
      await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .order('log_date', { ascending: false })
        .limit(limit)
    );
  },
  async listByDay(dagNaam, limit = 5) {
    const userId = await uid();
    return unwrap(
      await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('dag_naam', dagNaam)
        .order('log_date', { ascending: false })
        .limit(limit)
    );
  },
  async getByDateAndDay(date, dagNaam) {
    const userId = await uid();
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', date)
      .eq('dag_naam', dagNaam)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
  async create(data) {
    const userId = await uid();
    return unwrap(
      await supabase.from('workout_logs').insert({ ...data, user_id: userId }).select().single()
    );
  },
  async update(id, data) {
    return unwrap(
      await supabase.from('workout_logs').update(data).eq('id', id).select().single()
    );
  },
};
