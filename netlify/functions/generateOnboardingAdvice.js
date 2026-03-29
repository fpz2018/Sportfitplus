/**
 * generateOnboardingAdvice — Genereer gepersonaliseerd AI-advies na onboarding
 */
import Anthropic from '@anthropic-ai/sdk';
import { getUserFromRequest, corsHeaders, respond, respondError } from './_shared/supabaseAdmin.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };

  try {
    const user = await getUserFromRequest(event);
    if (!user) return respondError('Niet ingelogd', 401);

    const { profile, suppKennis, nieuws, lang = 'nl' } = JSON.parse(event.body || '{}');

    const prompt = `You are an expert personal trainer, sports nutritionist and wellbeing coach. Analyse this user profile and give personalised recommendations in ${lang === 'nl' ? 'Dutch' : 'English'}.

USER PROFILE:
- Gender: ${profile.gender}, Age: ${profile.age}, Weight: ${profile.weight_kg} kg, Height: ${profile.height_cm} cm
- Activity: ${profile.activity_level}, Lifestyle: ${profile.lifestyle}
- Main goal: ${profile.hoofd_doel}, Sub goals: ${profile.sub_doelen?.join(', ') || 'none'}
- Training experience: ${profile.training_ervaring}, Frequency: ${profile.training_frequentie}x/week
- Sleep: ${profile.slaap_uren}h/night, Stress: ${profile.stress_niveau}/10
- Nutrition: ${profile.voedingspatroon}, Allergies: ${profile.allergieën?.join(', ') || 'none'}
- Supplement goals: ${profile.supplement_doelen?.join(', ') || 'none'}

SUPPLEMENT KNOWLEDGE BASE:
${suppKennis || 'Not available'}

APPROVED SCIENTIFIC LITERATURE:
${nieuws || 'Not available'}

Respond with ONLY a JSON object:
{
  "trainings_methode": "kracht|hypertrofie|hiit|tabata",
  "trainings_motivatie": "why this method for this profile",
  "supplement_advies": [
    {"naam": "supplement name", "prioriteit": 1, "reden": "reason", "dosering": "dose", "timing": "when to take"}
  ],
  "welzijn_advies": "personalised sleep/stress/recovery advice"
}`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = response.content[0].text.trim();
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return respondError('AI gaf geen geldig JSON terug', 500);

    return respond(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error('generateOnboardingAdvice error:', err);
    return respondError(err.message);
  }
};
