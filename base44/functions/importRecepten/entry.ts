import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Haal de Google Sheets access token op
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlesheets");
    const sheetId = Deno.env.get("RECEPTEN_SHEET_ID");

    // Lees kolom A uit het eerste tabblad
    const sheetsRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:A`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const sheetsData = await sheetsRes.json();
    const rows = sheetsData.values || [];

  // Haal bestaande recepten op om duplicaten te voorkomen (alleen source_url recepten)
  const bestaande = await base44.asServiceRole.entities.Recipe.list('-created_date', 1000);
  const bestaandeUrls = new Set(bestaande.filter(r => r.source_url).map(r => r.source_url.trim()));

  const resultaten = { toegevoegd: 0, overgeslagen: 0, fouten: 0 };

  for (const row of rows) {
    const url = row[0]?.trim();
    if (!url || !url.startsWith('http')) continue;
    
    // Skip alleen als deze URL al bestaat
    if (bestaandeUrls.has(url)) {
      resultaten.overgeslagen++;
      continue;
    }

    // Haal de pagina op
    let pageRes, html;
    try {
      pageRes = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)' }
      });
      if (!pageRes.ok) {
        resultaten.fouten++;
        continue;
      }
      html = await pageRes.text();
    } catch (e) {
      console.error(`Fout bij fetch ${url}:`, e.message);
      resultaten.fouten++;
      continue;
    }

    // Extraheer afbeelding URL uit de HTML
    let imageUrl = null;
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (ogImageMatch) {
      imageUrl = ogImageMatch[1];
    } else {
      const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) {
        imageUrl = imgMatch[1];
      }
    }

    // Verwijder scripts/styles voor kortere tekst aan AI
    const cleanHtml = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 6000);

    // AI extraheert het recept
    const recept = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Extraheer het volgende recept van deze webpagina tekst en geef het terug als JSON.
Webpagina URL: ${url}
Tekst: ${cleanHtml}

Geef het recept terug in het Nederlands. Bereken macronutriënten op basis van de ingrediënten indien niet vermeld.
Categorie moet één van zijn: ontbijt, lunch, diner, snack, dessert, smoothie`,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string', enum: ['ontbijt', 'lunch', 'diner', 'snack', 'dessert', 'smoothie'] },
          prep_time_min: { type: 'number' },
          cook_time_min: { type: 'number' },
          servings: { type: 'number' },
          calories_per_serving: { type: 'number' },
          protein_g: { type: 'number' },
          carbs_g: { type: 'number' },
          fat_g: { type: 'number' },
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                amount: { type: 'string' },
                unit: { type: 'string' }
              }
            }
          },
          instructions: { type: 'array', items: { type: 'string' } },
          tags: { type: 'array', items: { type: 'string' } },
          image_url: { type: 'string' }
        }
      }
    });

    if (!recept?.title) {
      resultaten.fouten++;
      continue;
    }

    await base44.asServiceRole.entities.Recipe.create({
      ...recept,
      source_url: url,
      image_url: imageUrl || recept.image_url,
      is_favorite: false,
      status: 'concept',
    });

    bestaandeUrls.add(url);
    resultaten.toegevoegd++;
  }

    return Response.json({
      success: true,
      ...resultaten,
      bericht: `✅ ${resultaten.toegevoegd} recepten toegevoegd, ${resultaten.overgeslagen} al aanwezig, ${resultaten.fouten} fouten`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});