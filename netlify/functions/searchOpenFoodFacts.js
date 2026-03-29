/**
 * searchOpenFoodFacts — Zoek voedingsmiddelen via Open Food Facts
 * Vervangt: base44/functions/searchOpenFoodFacts/entry.ts
 */
import { getUserFromRequest, corsHeaders, respond, respondError } from './_shared/supabaseAdmin.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };

  try {
    const user = await getUserFromRequest(event);
    if (!user) return respondError('Niet ingelogd', 401);

    const { query, barcode } = JSON.parse(event.body || '{}');

    let url;
    if (barcode) {
      url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;
    } else if (query) {
      url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&lc=nl&cc=nl&page_size=10&fields=product_name,brands,nutriments,image_url,code`;
    } else {
      return respondError('Geef een zoekterm of barcode mee', 400);
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': 'SportfitPlus/1.0 (contact@sportfitplus.nl)' },
    });
    const data = await res.json();

    // Normaliseer resultaten
    const products = barcode
      ? [data.product].filter(Boolean)
      : (data.products || []);

    const normalized = products.map(p => ({
      external_id: p.code || p._id,
      name: p.product_name || 'Onbekend product',
      brand: p.brands || '',
      calories: Math.round(p.nutriments?.['energy-kcal_100g'] || p.nutriments?.['energy-kcal'] || 0),
      protein_g: parseFloat(p.nutriments?.proteins_100g || 0),
      carbs_g: parseFloat(p.nutriments?.carbohydrates_100g || 0),
      fat_g: parseFloat(p.nutriments?.fat_100g || 0),
      fiber_g: parseFloat(p.nutriments?.fiber_100g || 0),
      sugar_g: parseFloat(p.nutriments?.sugars_100g || 0),
      sodium_mg: parseFloat((p.nutriments?.sodium_100g || 0) * 1000),
      image_url: p.image_url || null,
      source: 'openfoodfacts',
    }));

    return respond({ products: normalized });
  } catch (err) {
    console.error('searchOpenFoodFacts error:', err);
    return respondError(err.message);
  }
};
