/**
 * syncContentNightly — Geplande nachtelijke sync van wetenschappelijke artikelen
 *
 * Draait elke nacht om 03:00 UTC (= 04:00/05:00 NL tijd).
 * Leest actieve content_bronnen uit de database en haalt artikelen op via:
 *   - PubMed (eUtils API)
 *   - RSS feeds (Atom/RSS)
 *   - Websites (HTML scraping)
 *
 * Nieuwe artikelen krijgen een AI-samenvatting (Claude Haiku) en worden
 * opgeslagen in kennis_artikelen met status='pending'.
 */
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from './_shared/supabaseAdmin.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

export const config = {
  schedule: '0 3 * * *',
};

// ─── PubMed sync ────────────────────────────────────────────────────────────

async function syncPubMed(bron) {
  const maxResults = Math.min(bron.max_per_sync || 5, 25);

  // Zoek recent gepubliceerde artikelen (afgelopen 30 dagen)
  const query = `${bron.zoekterm} AND ("last 30 days"[PDat])`;
  const searchUrl = `${PUBMED_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json&sort=date`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  const ids = searchData.esearchresult?.idlist || [];

  if (!ids.length) return { fetched: 0, saved: 0 };

  // Haal details op
  const fetchUrl = `${PUBMED_BASE}/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=xml`;
  const fetchRes = await fetch(fetchUrl);
  const xmlText = await fetchRes.text();

  const articleBlocks = xmlText.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];
  let saved = 0;

  for (const block of articleBlocks) {
    const pmid = block.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1];
    const title = block.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/)?.[1]?.replace(/<[^>]+>/g, '') || '';
    const abstract = block.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/)?.[1]?.replace(/<[^>]+>/g, '') || '';
    const journal = block.match(/<Title>([\s\S]*?)<\/Title>/)?.[1] || '';
    const year = block.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/)?.[1] || null;
    const authorMatches = [...block.matchAll(/<LastName>([\s\S]*?)<\/LastName>/g)];
    const authors = authorMatches.map(m => m[1]).slice(0, 5);

    if (!pmid || !title) continue;

    // Dedup check
    const { data: existing } = await supabaseAdmin
      .from('kennis_artikelen')
      .select('id')
      .eq('pubmed_id', pmid)
      .maybeSingle();
    if (existing) continue;

    // AI-samenvatting
    let summary_nl = '';
    if (abstract) {
      try {
        const res = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          system: 'Vat wetenschappelijke abstracts samen in 2-3 zinnen in het Nederlands voor een gezondheidsapp-gebruiker.',
          messages: [{ role: 'user', content: abstract.substring(0, 2000) }],
        });
        summary_nl = res.content[0].text;
      } catch { /* samenvatting is optioneel */ }
    }

    const { error } = await supabaseAdmin
      .from('kennis_artikelen')
      .insert({
        pubmed_id: pmid,
        title_en: title,
        abstract_en: abstract.substring(0, 5000),
        summary_nl,
        authors,
        journal,
        published_date: year ? `${year}-01-01` : null,
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        category: bron.categorie || 'overig',
        status: 'pending',
        search_query: bron.zoekterm,
      });

    if (!error) saved++;
  }

  return { fetched: ids.length, saved };
}

// ─── RSS sync ───────────────────────────────────────────────────────────────

async function syncRSS(bron) {
  const res = await fetch(bron.zoekterm, {
    headers: { 'User-Agent': 'SportfitPlus/1.0' },
    signal: AbortSignal.timeout(10000),
  });
  const xml = await res.text();

  // Parse RSS/Atom items
  const items = [];
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>|<entry>([\s\S]*?)<\/entry>/gi);
  for (const m of itemMatches) {
    const block = m[1] || m[2];
    const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() || '';
    const link = block.match(/<link[^>]*href="([^"]+)"/i)?.[1]
      || block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim() || '';
    const desc = block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim()
      || block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() || '';
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]
      || block.match(/<published>([\s\S]*?)<\/published>/i)?.[1] || '';

    if (title && link) items.push({ title, link, desc, pubDate });
  }

  let saved = 0;
  for (const item of items.slice(0, bron.max_per_sync || 5)) {
    // Dedup op URL
    const { data: existing } = await supabaseAdmin
      .from('kennis_artikelen')
      .select('id')
      .eq('url', item.link)
      .maybeSingle();
    if (existing) continue;

    let summary_nl = '';
    if (item.desc) {
      try {
        const res = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          system: 'Vat dit artikel samen in 2-3 zinnen in het Nederlands voor een gezondheidsapp-gebruiker.',
          messages: [{ role: 'user', content: item.desc.substring(0, 2000) }],
        });
        summary_nl = res.content[0].text;
      } catch { /* optioneel */ }
    }

    const parsedDate = item.pubDate ? new Date(item.pubDate) : null;
    const { error } = await supabaseAdmin
      .from('kennis_artikelen')
      .insert({
        title_en: item.title,
        abstract_en: item.desc.substring(0, 5000),
        summary_nl,
        url: item.link,
        category: bron.categorie || 'overig',
        status: 'pending',
        search_query: bron.naam,
        published_date: parsedDate && !isNaN(parsedDate) ? parsedDate.toISOString().split('T')[0] : null,
      });

    if (!error) saved++;
  }

  return { fetched: items.length, saved };
}

// ─── Handler ────────────────────────────────────────────────────────────────

export const handler = async () => {
  console.log('syncContentNightly: Start nachtelijke content sync...');

  try {
    // Laad actieve bronnen
    const { data: bronnen, error: bronErr } = await supabaseAdmin
      .from('content_bronnen')
      .select('*')
      .eq('actief', true);

    if (bronErr) throw bronErr;
    if (!bronnen?.length) {
      console.log('syncContentNightly: Geen actieve bronnen geconfigureerd.');
      return { statusCode: 200, body: 'No active sources' };
    }

    // Filter op frequentie
    const now = new Date();
    const activeBronnen = bronnen.filter(bron => {
      if (!bron.laatste_sync) return true; // nooit gesynct
      const lastSync = new Date(bron.laatste_sync);
      const hoursSince = (now - lastSync) / (1000 * 60 * 60);

      switch (bron.sync_frequentie) {
        case 'dagelijks': return hoursSince >= 20; // ruime marge
        case 'wekelijks': return hoursSince >= 160;
        case 'maandelijks': return hoursSince >= 700;
        default: return true;
      }
    });

    console.log(`syncContentNightly: ${activeBronnen.length}/${bronnen.length} bronnen moeten synce worden.`);

    const results = [];
    for (const bron of activeBronnen) {
      try {
        let result;
        switch (bron.bron_type) {
          case 'pubmed':
            result = await syncPubMed(bron);
            break;
          case 'rss':
            result = await syncRSS(bron);
            break;
          case 'website':
            // Website scraping — placeholder voor toekomstige uitbreiding
            result = { fetched: 0, saved: 0, note: 'Website scraping nog niet geïmplementeerd' };
            break;
          default:
            result = { fetched: 0, saved: 0 };
        }

        // Update laatste_sync timestamp
        await supabaseAdmin
          .from('content_bronnen')
          .update({ laatste_sync: now.toISOString() })
          .eq('id', bron.id);

        results.push({ bron: bron.naam, type: bron.bron_type, ...result });
        console.log(`  ✓ ${bron.naam} (${bron.bron_type}): ${result.saved} nieuwe artikelen`);
      } catch (err) {
        results.push({ bron: bron.naam, type: bron.bron_type, error: err.message });
        console.error(`  ✗ ${bron.naam}: ${err.message}`);
      }
    }

    // Audit log
    const totalSaved = results.reduce((sum, r) => sum + (r.saved || 0), 0);
    await supabaseAdmin.from('audit_logs').insert({
      actie: 'nightly_content_sync',
      gebruiker: 'system',
      details: { bronnen_verwerkt: results.length, artikelen_opgeslagen: totalSaved, details: results },
    });

    const summary = `Sync klaar: ${results.length} bronnen verwerkt, ${totalSaved} nieuwe artikelen.`;
    console.log(`syncContentNightly: ${summary}`);

    return { statusCode: 200, body: summary };
  } catch (err) {
    console.error('syncContentNightly error:', err);
    return { statusCode: 500, body: err.message };
  }
};
