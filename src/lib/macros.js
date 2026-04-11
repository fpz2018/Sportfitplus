/**
 * macros.js
 * Helpers voor het werken met FoodLog-data en macro-statistieken
 * (gebruikt door MacroDetail page en MacroTiles dashboard widget).
 */

// Macro-configuratie — hier centraal zodat de detail page en de tiles
// dezelfde labels, kleuren en target-velden gebruiken.
export const MACROS = {
  calories: {
    key: 'calories',
    label: 'Calorieën',
    short: 'Cal',
    unit: 'kcal',
    totalsField: 'total_calories',
    itemField: 'calories',
    targetField: 'target_calories',
    color: 'orange',
    cssVar: 'rgb(251 146 60)', // tailwind orange-400
    cssVarSoft: 'rgba(251,146,60,0.15)',
    icon: '🔥',
  },
  protein: {
    key: 'protein',
    label: 'Eiwit',
    short: 'Eiwit',
    unit: 'g',
    totalsField: 'total_protein_g',
    itemField: 'protein_g',
    targetField: 'protein_target_g',
    color: 'red',
    cssVar: 'rgb(248 113 113)', // tailwind red-400
    cssVarSoft: 'rgba(248,113,113,0.15)',
    icon: '🥩',
  },
  carbs: {
    key: 'carbs',
    label: 'Koolhydraten',
    short: 'Carbs',
    unit: 'g',
    totalsField: 'total_carbs_g',
    itemField: 'carbs_g',
    targetField: 'carbs_target_g',
    color: 'blue',
    cssVar: 'rgb(96 165 250)', // tailwind blue-400
    cssVarSoft: 'rgba(96,165,250,0.15)',
    icon: '🍞',
  },
  fat: {
    key: 'fat',
    label: 'Vetten',
    short: 'Vet',
    unit: 'g',
    totalsField: 'total_fat_g',
    itemField: 'fat_g',
    targetField: 'fat_target_g',
    color: 'yellow',
    cssVar: 'rgb(250 204 21)', // tailwind yellow-400
    cssVarSoft: 'rgba(250,204,21,0.15)',
    icon: '🧈',
  },
};

export const MACRO_KEYS = ['calories', 'protein', 'carbs', 'fat'];

/**
 * Haal het totaal van een macro uit een FoodLog rij.
 */
export function getLogTotal(log, macroKey) {
  if (!log) return 0;
  const macro = MACROS[macroKey];
  return Number(log[macro.totalsField] || 0);
}

/**
 * Bereken top contributors voor een macro op basis van één FoodLog dag.
 * Combineert meals (waar eaten=true) en extras, groepeert op naam,
 * sorteert aflopend en geeft de top N terug.
 */
export function getTopContributors(log, macroKey, limit = 3) {
  if (!log) return [];
  const macro = MACROS[macroKey];
  const rows = [];

  const meals = Array.isArray(log.meals) ? log.meals : [];
  for (const m of meals) {
    if (m.eaten === false) continue; // alleen gegeten maaltijden tellen
    const value = Number(m[macro.itemField] || 0);
    if (value <= 0) continue;
    rows.push({
      name: m.recipe_title || m.meal_type || 'Maaltijd',
      value,
      kind: 'meal',
    });
  }

  const extras = Array.isArray(log.extras) ? log.extras : [];
  for (const e of extras) {
    const value = Number(e[macro.itemField] || 0);
    if (value <= 0) continue;
    rows.push({
      name: e.name || e.type || 'Extra',
      value,
      kind: 'extra',
    });
  }

  // Groepeer op naam (zelfde item meerdere keren = optellen)
  const grouped = new Map();
  for (const r of rows) {
    const cur = grouped.get(r.name) || { name: r.name, value: 0, kind: r.kind };
    cur.value += r.value;
    grouped.set(r.name, cur);
  }

  return Array.from(grouped.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

/**
 * Geef de target-waarde voor een macro vanuit het user-profile.
 */
export function getTarget(profile, macroKey) {
  if (!profile) return 0;
  const macro = MACROS[macroKey];
  return Number(profile[macro.targetField] || 0);
}

/**
 * Bouw een dag-voor-dag tijdreeks tussen from en to (inclusief).
 * Ontbrekende dagen krijgen value: 0 zodat de chart-bars op nul staan.
 */
export function buildDailySeries(logs, macroKey, from, to) {
  const macro = MACROS[macroKey];
  const map = new Map();
  for (const log of logs || []) {
    map.set(log.log_date, Number(log[macro.totalsField] || 0));
  }
  const series = [];
  const cur = new Date(from);
  const end = new Date(to);
  // normaliseer naar middernacht
  cur.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  while (cur <= end) {
    const iso = cur.toISOString().slice(0, 10);
    series.push({ date: iso, value: map.get(iso) ?? 0 });
    cur.setDate(cur.getDate() + 1);
  }
  return series;
}

/**
 * Aggregeer een dagelijkse serie naar week-buckets (maandag-start).
 */
export function aggregateWeekly(series) {
  const buckets = new Map();
  for (const point of series) {
    const d = new Date(point.date);
    // Maandag van deze week
    const day = (d.getDay() + 6) % 7; // 0 = maandag
    d.setDate(d.getDate() - day);
    const key = d.toISOString().slice(0, 10);
    const cur = buckets.get(key) || { date: key, value: 0, count: 0 };
    cur.value += point.value;
    cur.count += 1;
    buckets.set(key, cur);
  }
  return Array.from(buckets.values())
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map(b => ({ date: b.date, value: b.count ? b.value / b.count : 0 }));
}

/**
 * Aggregeer een dagelijkse serie naar maand-buckets.
 */
export function aggregateMonthly(series) {
  const buckets = new Map();
  for (const point of series) {
    const key = point.date.slice(0, 7); // yyyy-MM
    const cur = buckets.get(key) || { date: key + '-01', value: 0, count: 0 };
    cur.value += point.value;
    cur.count += 1;
    buckets.set(key, cur);
  }
  return Array.from(buckets.values())
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map(b => ({ date: b.date, value: b.count ? b.value / b.count : 0 }));
}

/**
 * Gemiddelde waarde van een serie (alleen dagen met value>0 tellen mee
 * voor een eerlijk gemiddelde, vergelijkbaar met MacroFactor).
 */
export function average(series) {
  const filled = series.filter(p => p.value > 0);
  if (!filled.length) return 0;
  return filled.reduce((s, p) => s + p.value, 0) / filled.length;
}

/**
 * Standaard timeframes voor de chart.
 */
export const TIMEFRAMES = [
  { key: '1W', label: '1W', days: 7, granularity: 'day' },
  { key: '1M', label: '1M', days: 30, granularity: 'day' },
  { key: '3M', label: '3M', days: 90, granularity: 'day' },
  { key: '6M', label: '6M', days: 180, granularity: 'week' },
  { key: '1Y', label: '1Y', days: 365, granularity: 'week' },
  { key: 'ALL', label: 'All', days: 730, granularity: 'month' },
];
