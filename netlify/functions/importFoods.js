/**
 * importFoods — Importeer voedingsmiddelen vanuit CSV
 * Ondersteunt zowel ruwe CSV-tekst als een file_url (Supabase Storage).
 * Herkent NEVO-kolomnamen (voedingsmiddelnaam, enercc/enercj, prot, cho, fat, vezel)
 * én de eigen app-indeling (name/naam, calories/energie/kcal, protein_g, carbs_g, fat_g).
 */
import { getUserFromRequest, supabaseAdmin, corsHeaders, respond, respondError } from './_shared/supabaseAdmin.js';

// ─── helpers ────────────────────────────────────────────────────────────────

function findCol(header, candidates) {
  return header.findIndex(h => candidates.some(c => h.includes(c)));
}

function parseNum(val) {
  if (!val || val === '' || val === '-') return null;
  return parseFloat(String(val).replace(',', '.')) || null;
}

/**
 * Verwerk CSV-tekst naar een array van food-records.
 * Detecteert automatisch of het NEVO-formaat is of het eigen app-formaat.
 */
function parseCsv(csvText) {
  const lines = csvText.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  // Detecteer scheidingsteken: pipe of komma
  const delimiter = lines[0].includes('|') ? '|' : ',';

  // Strip aanhalingstekens uit header en waarden
  const strip = v => v?.trim().replace(/^["']|["']$/g, '');
  const header = lines[0].split(delimiter).map(h => strip(h).toLowerCase());

  // ── Kolomindexen bepalen ──────────────────────────────────────────────────
  const nameIdx     = findCol(header, ['voedingsmiddelnaam', 'dutch food name', 'name', 'naam', 'product']);
  const catIdx      = findCol(header, ['voedingsmiddelgroep', 'food group', 'category', 'categorie']);

  // NEVO gebruikt ENERCC (kcal) of ENERCJ (kJ)
  const enerKcalIdx = findCol(header, ['enercc']);
  const enerKjIdx   = findCol(header, ['enercj', 'energie_kj', 'energy_kj']);
  const enerFallIdx = findCol(header, ['energie', 'energy', 'kcal', 'calories', 'calories_kcal']);

  const protIdx     = findCol(header, ['prot', 'eiwit', 'protein_g', 'protein', 'eiwitten']);
  const choIdx      = findCol(header, ['cho', 'koolhydraten', 'carbs_g', 'carbohydrate', 'carbs', 'koolh']);
  const fatIdx      = findCol(header, ['fat', 'vet', 'lipide', 'fat_g', 'vetten']);
  const fiberIdx    = findCol(header, ['vezel', 'fiber_g', 'fiber', 'fibre', 'vezels', 'dietary_fiber']);
  const sugarIdx    = findCol(header, ['sugar', 'suiker', 'mono_en_disaccharide', 'sugar_g']);
  const satFatIdx   = findCol(header, ['safa', 'saturated_fat', 'saturated', 'verzadigd']);
  const sodiumIdx   = findCol(header, ['na', 'natrium', 'sodium', 'sodium_mg']);
  const brandIdx    = findCol(header, ['brand', 'merk']);

  // Is dit NEVO-formaat?
  const isNevo = nameIdx !== -1 && (header[nameIdx].includes('voedingsmiddelnaam') || enerKcalIdx !== -1 || enerKjIdx !== -1);

  if (nameIdx === -1) return []; // Geen naam-kolom gevonden → afbreken

  // ── Rijen verwerken ───────────────────────────────────────────────────────
  const foods = [];
  for (const line of lines.slice(1)) {
    const parts = line.split(delimiter);
    const val = i => (i !== -1 ? strip(parts[i]) : null);

    const name = val(nameIdx);
    if (!name) continue;

    // Calorieën: ENERCC (kcal) heeft voorkeur; anders ENERCJ (kJ → kcal); anders fallback
    let calories = null;
    if (enerKcalIdx !== -1) {
      calories = parseNum(val(enerKcalIdx));
    } else if (enerKjIdx !== -1) {
      const kj = parseNum(val(enerKjIdx));
      if (kj != null) calories = Math.round(kj / 4.184);
    } else if (enerFallIdx !== -1) {
      calories = parseNum(val(enerFallIdx));
    }

    if (calories == null || calories < 0) continue;

    foods.push({
      name,
      calories,
      protein_g:       parseNum(val(protIdx))   ?? 0,
      carbs_g:         parseNum(val(choIdx))     ?? 0,
      fat_g:           parseNum(val(fatIdx))     ?? 0,
      fiber_g:         parseNum(val(fiberIdx)),
      sugar_g:         parseNum(val(sugarIdx)),
      saturated_fat_g: parseNum(val(satFatIdx)),
      sodium_mg:       parseNum(val(sodiumIdx)),
      brand:           val(brandIdx) || null,
      category:        catIdx !== -1 ? mapCategory(val(catIdx)) : null,
      source:          isNevo ? 'nevo_rivm' : 'handmatig',
    });
  }

  return foods;
}

/** Vertaal NEVO-productgroepen naar de app-categorieën */
function mapCategory(group) {
  if (!group) return null;
  const g = group.toLowerCase();
  if (g.includes('vlees') || g.includes('vis') || g.includes('gevogelte') || g.includes('schaal')) return 'vlees_vis';
  if (g.includes('zuivel') || g.includes('ei') || g.includes('kaas') || g.includes('melk')) return 'zuivel_eieren';
  if (g.includes('graan') || g.includes('brood') || g.includes('gebak') || g.includes('pasta') || g.includes('rijst')) return 'granen_brood';
  if (g.includes('groent')) return 'groenten';
  if (g.includes('fruit')) return 'fruit';
  if (g.includes('noot') || g.includes('noten') || g.includes('zaad') || g.includes('zaden') || g.includes('pinda')) return 'noten_zaden';
  if (g.includes('peul') || g.includes('boon') || g.includes('linze')) return 'peulvruchten';
  if (g.includes('vet') || g.includes('olie') || g.includes('margarine') || g.includes('boter')) return 'vetten_olien';
  if (g.includes('drank') || g.includes('sap') || g.includes('thee') || g.includes('koffie') || g.includes('alcohol')) return 'dranken';
  return 'overig';
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };

  try {
    const user = await getUserFromRequest(event);
    if (!user) return respondError('Niet ingelogd', 401);

    const body = JSON.parse(event.body || '{}');
    let csvText = body.csv || null;

    // Haal CSV op via URL als er geen ruwe tekst is meegegeven
    if (!csvText && body.file_url) {
      const fetchRes = await fetch(body.file_url);
      if (!fetchRes.ok) return respondError(`Kan bestand niet ophalen: ${fetchRes.status}`, 400);
      csvText = await fetchRes.text();
    }

    if (!csvText) return respondError('CSV-data of file_url verplicht', 400);

    const foods = parseCsv(csvText);
    const validFoods = foods.map(f => ({ ...f, created_by: user.id }));

    if (!validFoods.length) return respondError('Geen geldige voedingsmiddelen gevonden in CSV', 422);

    // Batch inserts van 100
    const batchSize = 100;
    let inserted = 0;
    for (let i = 0; i < validFoods.length; i += batchSize) {
      const batch = validFoods.slice(i, i + batchSize);
      const { data } = await supabaseAdmin.from('food').insert(batch).select('id');
      inserted += data?.length || 0;
    }

    return respond({ success: true, imported: inserted, total: validFoods.length });
  } catch (err) {
    console.error('importFoods error:', err);
    return respondError(err.message);
  }
};
