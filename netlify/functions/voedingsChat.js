/**
 * voedingsChat — Orthomoleculaire voedings-AI chatbot
 * Vervangt: base44/functions/voedingsChat/entry.ts
 */
import Anthropic from '@anthropic-ai/sdk';
import { getUserFromRequest, supabaseAdmin, corsHeaders, respond, respondError, rateLimit } from './_shared/supabaseAdmin.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };

  try {
    const user = await getUserFromRequest(event);
    if (!user) return respondError('Niet ingelogd', 401);

    rateLimit(user.id, { maxRequests: 20, windowMs: 60_000 });

    const { messages } = JSON.parse(event.body || '{}');
    if (!messages?.length) return respondError('Geen berichten meegegeven', 400);

    // Valideer berichtstructuur
    const validRoles = ['user', 'assistant'];
    for (const msg of messages) {
      if (!msg.role || !validRoles.includes(msg.role) || typeof msg.content !== 'string') {
        return respondError('Ongeldig berichtformaat', 400);
      }
      if (msg.content.length > 3000) {
        return respondError('Bericht te lang (max 3000 tekens)', 400);
      }
    }

    // Haal profiel op voor gepersonaliseerde context
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('age, weight_kg, height_cm, target_calories, protein_target_g, carbs_target_g, fat_target_g, goal_group')
      .eq('id', user.id)
      .single();

    const systemPrompt = `Je bent een orthomoleculaire voedingscoach voor Sportfit Plus.
Je geeft evidence-based voedingsadvies op basis van orthomoleculaire principes.
Je communiceert in het Nederlands, vriendelijk en praktisch.

Gebruikersprofiel:
- Doel: ${profile?.goal_group || 'niet opgegeven'}
- Caloriedoel: ${profile?.target_calories || 'onbekend'} kcal/dag
- Eiwitdoel: ${profile?.protein_target_g || 'onbekend'}g | Koolhydraten: ${profile?.carbs_target_g || 'onbekend'}g | Vetten: ${profile?.fat_target_g || 'onbekend'}g

Beperk je tot de laatste 6 berichten als context. Geef geen medisch diagnoses.`;

    // Neem maximaal de laatste 6 berichten mee
    const recentMessages = messages.slice(-6);

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: recentMessages,
    });

    return respond({ reply: response.content[0].text });
  } catch (err) {
    console.error('voedingsChat error:', err);
    return respondError(err.message);
  }
};
