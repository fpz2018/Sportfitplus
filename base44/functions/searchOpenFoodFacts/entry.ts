import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Fallback database van veel gebruikte voedingsmiddelen
const FALLBACK_FOODS = [
  { id: '1', name: 'Banaan', brands: 'Vers fruit', calories: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3 },
  { id: '2', name: 'Kip borst', brands: 'Ruw', calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
  { id: '3', name: 'Brood (wit)', brands: 'Standaard', calories: 265, protein_g: 9, carbs_g: 49, fat_g: 3.3 },
  { id: '4', name: 'Melk (halfvol)', brands: 'Standaard', calories: 49, protein_g: 3.3, carbs_g: 4.8, fat_g: 1.7 },
  { id: '5', name: 'Ei', brands: 'Ruw', calories: 155, protein_g: 13, carbs_g: 1.1, fat_g: 11 },
  { id: '6', name: 'Rijst (gekookt)', brands: 'Gekookt', calories: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3 },
  { id: '7', name: 'Pasta (gekookt)', brands: 'Gekookt', calories: 131, protein_g: 5, carbs_g: 25, fat_g: 1.1 },
  { id: '8', name: 'Appel', brands: 'Vers fruit', calories: 52, protein_g: 0.3, carbs_g: 14, fat_g: 0.2 },
  { id: '9', name: 'Sinaasappel', brands: 'Vers fruit', calories: 47, protein_g: 0.9, carbs_g: 12, fat_g: 0.3 },
  { id: '10', name: 'Broccoli (ruw)', brands: 'Vers groente', calories: 34, protein_g: 2.8, carbs_g: 7, fat_g: 0.4 },
  { id: '11', name: 'Tomaat (ruw)', brands: 'Vers groente', calories: 18, protein_g: 0.9, carbs_g: 3.9, fat_g: 0.2 },
  { id: '12', name: 'Aardappel (gekookt)', brands: 'Gekookt', calories: 77, protein_g: 2, carbs_g: 17, fat_g: 0.1 },
  { id: '13', name: 'Vis (zalm ruw)', brands: 'Ruw', calories: 208, protein_g: 20, carbs_g: 0, fat_g: 13 },
  { id: '14', name: 'Yoghurt (Grieks)', brands: 'Standaard', calories: 59, protein_g: 10, carbs_g: 3.3, fat_g: 0.4 },
  { id: '15', name: 'Havermout (droog)', brands: 'Standaard', calories: 389, protein_g: 17, carbs_g: 66, fat_g: 6.9 },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, barcode } = await req.json();
    
    if (!query && !barcode) {
      return Response.json({ error: 'Query or barcode required' }, { status: 400 });
    }

    // Try Open Food Facts API
    let products = [];
    
    if (barcode) {
      try {
        const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Sportfit-Plus-App/1.0' }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.product) {
            const p = data.product;
            products = [{
              id: p.code,
              name: p.product_name || 'Unknown',
              brands: p.brands || '',
              calories: p.nutriments?.['energy-kcal'] || 0,
              protein_g: p.nutriments?.protein || 0,
              carbs_g: p.nutriments?.carbohydrates || 0,
              fat_g: p.nutriments?.fat || 0,
              image_url: p.image_url || null,
              barcode: p.code
            }];
          }
        }
      } catch (e) {
        // Fallback: barcode not found
      }
    } else {
      try {
        const url = `https://nl.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=10`;
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Sportfit-Plus-App/1.0' }
        });
        
        if (response.ok) {
          const data = await response.json();
          products = (data.products || []).map(p => ({
            id: p.code,
            name: p.product_name || 'Unknown',
            brands: p.brands || '',
            calories: p.nutriments?.['energy-kcal'] || 0,
            protein_g: p.nutriments?.protein || 0,
            carbs_g: p.nutriments?.carbohydrates || 0,
            fat_g: p.nutriments?.fat || 0,
            image_url: p.image_url || null,
            barcode: p.code
          })).filter(p => p.calories > 0 || p.protein_g > 0);
        }
      } catch (e) {
        // Fallback: use local database
      }

      // If no results from API, use fallback database
      if (products.length === 0 && query) {
        const queryLower = query.toLowerCase();
        products = FALLBACK_FOODS.filter(f => 
          f.name.toLowerCase().includes(queryLower) ||
          f.brands.toLowerCase().includes(queryLower)
        );
      }
    }

    return Response.json({ products });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});