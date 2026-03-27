import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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

    let url;
    if (barcode) {
      url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    } else {
      url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=10`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (barcode) {
      if (!data.product) {
        return Response.json({ products: [] });
      }
      const product = data.product;
      return Response.json({
        products: [{
          id: product.code,
          name: product.product_name || 'Unknown',
          brands: product.brands || '',
          calories: product.nutriments?.['energy-kcal'] || 0,
          protein_g: product.nutriments?.protein || 0,
          carbs_g: product.nutriments?.carbohydrates || 0,
          fat_g: product.nutriments?.fat || 0,
          image_url: product.image_url || null,
          barcode: product.code
        }]
      });
    } else {
      const products = (data.products || []).map(p => ({
        id: p.code,
        name: p.product_name || 'Unknown',
        brands: p.brands || '',
        calories: p.nutriments?.['energy-kcal'] || 0,
        protein_g: p.nutriments?.protein || 0,
        carbs_g: p.nutriments?.carbohydrates || 0,
        fat_g: p.nutriments?.fat || 0,
        image_url: p.image_url || null,
        barcode: p.code
      })).filter(p => p.calories > 0);
      
      return Response.json({ products });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});