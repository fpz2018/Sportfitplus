/**
 * importRecepten — Importeer recepten via AI-extractie van URL-lijst
 * Vervangt: base44/functions/importRecepten/entry.ts
 */
import Anthropic from '@anthropic-ai/sdk';
import { requireAdmin, supabaseAdmin, corsHeaders, respond, respondError } from './_shared/supabaseAdmin.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };

  try {
    const user = await requireAdmin(event);
    const { urls } = JSON.parse(event.body || '{}');
    if (!urls?.length) return respondError('Lijst van URLs verplicht', 400);

    const imported = [];
    const errors = [];

    for (const url of urls.slice(0, 20)) { // Max 20 per keer
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'SportfitPlus/1.0' },
          signal: AbortSignal.timeout(8000),
        });
        const html = await res.text();
        const cleanText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').substring(0, 6000);

        const prompt = `Extraheer het recept van onderstaande webpagina en geef het terug als JSON.

URL: ${url}
Pagina-inhoud:
${cleanText}

Geef ALLEEN een JSON-object terug:
{
  "title": "receptnaam",
  "description": "korte beschrijving",
  "category": "ontbijt|lunch|diner|snack|dessert|smoothie",
  "prep_time_min": getal,
  "cook_time_min": getal,
  "servings": getal,
  "calories_per_serving": getal,
  "protein_g": getal,
  "carbs_g": getal,
  "fat_g": getal,
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["stap 1", "stap 2"],
  "tags": ["tag1", "tag2"]
}`;

        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        });

        const rawText = response.content[0].text.trim();
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('AI gaf geen geldig JSON terug');

        const recipeData = JSON.parse(jsonMatch[0]);
        const { data: saved } = await supabaseAdmin
          .from('recipes')
          .insert({ ...recipeData, source_url: url, status: 'concept', created_by: user.id })
          .select()
          .single();

        if (saved) imported.push({ id: saved.id, title: saved.title });
      } catch (urlErr) {
        errors.push({ url, error: urlErr.message });
      }
    }

    return respond({ imported: imported.length, errors: errors.length, details: { imported, errors } });
  } catch (err) {
    console.error('importRecepten error:', err);
    if (err.message.includes('admin')) return respondError(err.message, 403);
    return respondError(err.message);
  }
};
