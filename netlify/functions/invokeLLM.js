/**
 * invokeLLM — generieke vervanger voor base44.integrations.Core.InvokeLLM
 */
import Anthropic from '@anthropic-ai/sdk';
import { getUserFromRequest, corsHeaders, respond, respondError, rateLimit } from './_shared/supabaseAdmin.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };

  try {
    const user = await getUserFromRequest(event);
    if (!user) return respondError('Niet ingelogd', 401);

    rateLimit(user.id, { maxRequests: 15, windowMs: 60_000 });

    const { prompt, response_json_schema } = JSON.parse(event.body || '{}');
    if (!prompt) return respondError('prompt is verplicht', 400);
    if (prompt.length > 5000) return respondError('Prompt te lang (max 5000 tekens)', 400);

    // Gebruik system prompt om instructie te scheiden van user content
    const systemPrompt = response_json_schema
      ? `Respond with ONLY a valid JSON object matching this schema:\n${JSON.stringify(response_json_schema, null, 2)}`
      : 'Je bent een behulpzame assistent voor de Sportfit Plus gezondheidsapp. Antwoord in het Nederlands.';

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = response.content[0].text.trim();

    if (response_json_schema) {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (!match) return respondError('AI gaf geen geldig JSON terug', 500);
      return respond(JSON.parse(match[0]));
    }

    return respond({ text: rawText });
  } catch (err) {
    console.error('invokeLLM error:', err);
    return respondError(err.message);
  }
};
