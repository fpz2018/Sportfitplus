/**
 * pubmedFetch — Haal PubMed-artikelen op en vat ze samen met AI
 * Vervangt: base44/functions/pubmedFetch/entry.ts
 */
import Anthropic from '@anthropic-ai/sdk';
import { requireAdmin, supabaseAdmin, corsHeaders, respond, respondError } from './_shared/supabaseAdmin.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };

  try {
    const user = await requireAdmin(event);
    const { query, maxResults: rawMax = 10 } = JSON.parse(event.body || '{}');
    if (!query) return respondError('Zoekterm verplicht', 400);
    if (query.length > 500) return respondError('Zoekterm te lang (max 500 tekens)', 400);
    const maxResults = Math.min(Math.max(1, Number(rawMax) || 10), 25);

    // Stap 1: zoek PubMed IDs
    const searchUrl = `${PUBMED_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const ids = searchData.esearchresult?.idlist || [];
    if (!ids.length) return respond({ count: 0, articles: [] });

    // Stap 2: haal details op
    const fetchUrl = `${PUBMED_BASE}/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=xml`;
    const fetchRes = await fetch(fetchUrl);
    const xmlText = await fetchRes.text();

    // Eenvoudige XML-extractie (veilige regex voor bekende PubMed-structuur)
    const articles = [];
    const articleBlocks = xmlText.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];

    for (const block of articleBlocks) {
      const pmid       = block.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1];
      const title      = block.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/)?.[1]?.replace(/<[^>]+>/g, '') || '';
      const abstract   = block.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/)?.[1]?.replace(/<[^>]+>/g, '') || '';
      const journal    = block.match(/<Title>([\s\S]*?)<\/Title>/)?.[1] || '';
      const yearMatch  = block.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/);
      const year       = yearMatch?.[1] || null;
      const authorMatches = [...block.matchAll(/<LastName>([\s\S]*?)<\/LastName>/g)];
      const authors    = authorMatches.map(m => m[1]).slice(0, 5);

      if (!pmid || !title) continue;

      // Check of het artikel al bestaat
      const { data: existing } = await supabaseAdmin
        .from('kennis_artikelen')
        .select('id')
        .eq('pubmed_id', pmid)
        .maybeSingle();
      if (existing) continue;

      // AI-samenvatting in het Nederlands
      let summary_nl = '';
      if (abstract) {
        const summaryRes = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: `Vat dit wetenschappelijk abstract samen in 2-3 zinnen in het Nederlands voor een gezondheidsapp-gebruiker:\n\n${abstract.substring(0, 2000)}`
          }],
        });
        summary_nl = summaryRes.content[0].text;
      }

      const article = {
        pubmed_id: pmid,
        title_en: title,
        abstract_en: abstract.substring(0, 5000),
        summary_nl,
        authors,
        journal,
        published_date: year ? `${year}-01-01` : null,
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        status: 'pending',
        search_query: query,
      };

      const { data: saved } = await supabaseAdmin
        .from('kennis_artikelen')
        .insert(article)
        .select()
        .single();

      if (saved) articles.push(saved);
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      actie: 'pubmed_fetch',
      gebruiker: user.email,
      details: { query, gevonden: ids.length, opgeslagen: articles.length },
    });

    return respond({ count: articles.length, articles });
  } catch (err) {
    console.error('pubmedFetch error:', err);
    if (err.message.includes('admin')) return respondError(err.message, 403);
    return respondError(err.message);
  }
};
