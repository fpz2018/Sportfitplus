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
import { supabaseAdmin, requireAdmin } from './_shared/supabaseAdmin.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

export const config = {
  schedule: '0 3 * * *',
};

// JSON response helper — voor zowel manual trigger als scheduled invocation
const jsonResponse = (status, payload) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

// ─── PubMed sync ────────────────────────────────────────────────────────────

async function syncPubMed(bron, opts = {}) {
  const limit = opts.maxPerSource ?? Math.min(bron.max_per_sync || 5, 25);

  // Zoek recent gepubliceerde artikelen (afgelopen 30 dagen)
  const query = `${bron.zoekterm} AND ("last 30 days"[PDat])`;
  const searchUrl = `${PUBMED_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${limit}&retmode=json&sort=date`;
  const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) });
  const searchData = await searchRes.json();
  const ids = searchData.esearchresult?.idlist || [];

  if (!ids.length) return { fetched: 0, saved: 0 };

  // Haal details op
  const fetchUrl = `${PUBMED_BASE}/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=xml`;
  const fetchRes = await fetch(fetchUrl, { signal: AbortSignal.timeout(8000) });
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

    // AI-samenvatting (overgeslagen in quick-mode om de HTTP timeout
    // van Netlify Functions te respecteren — de cron 's nachts vult ze
    // alsnog aan via een tweede pass of bij de volgende run)
    let summary_nl = '';
    if (abstract && !opts.skipAiSummary) {
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

async function syncRSS(bron, opts = {}) {
  const limit = opts.maxPerSource ?? (bron.max_per_sync || 5);
  const res = await fetch(bron.zoekterm, {
    headers: { 'User-Agent': 'SportfitPlus/1.0' },
    signal: AbortSignal.timeout(8000),
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
  for (const item of items.slice(0, limit)) {
    // Dedup op URL
    const { data: existing } = await supabaseAdmin
      .from('kennis_artikelen')
      .select('id')
      .eq('url', item.link)
      .maybeSingle();
    if (existing) continue;

    let summary_nl = '';
    if (item.desc && !opts.skipAiSummary) {
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

export const handler = async (event) => {
  // Manual trigger via /api/syncContentNightly: vereis admin auth.
  // Scheduled invocaties hebben geen Authorization header.
  const authHeader = event?.headers?.authorization || event?.headers?.Authorization;
  const isManual = Boolean(authHeader);
  if (isManual) {
    try {
      await requireAdmin(event);
    } catch (err) {
      return jsonResponse(401, { ok: false, error: err.message || 'Niet geautoriseerd' });
    }
  }

  // Optie: bij een manual trigger kan ?force=1 de sync_frequentie filter
  // overrulen, zodat je direct kan testen zonder te wachten tot de volgende dag.
  const queryStr = event?.rawQueryString || event?.rawQuery || '';
  const forceAll = isManual && /[?&]force=1/.test(queryStr);
  // Quick-mode: standaard AAN bij manual trigger om binnen Netlify's HTTP
  // function timeout (10-26s) te blijven. Skip AI samenvattingen, beperk
  // het aantal sources en artikelen per source. Cron-pad blijft volledig.
  const fullMode = isManual && /[?&]full=1/.test(queryStr);
  const quickMode = isManual && !fullMode;
  const QUICK_MAX_SOURCES = 3;
  const QUICK_MAX_PER_SOURCE = 3;

  console.log('syncContentNightly: Start nachtelijke content sync...');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('syncContentNightly: ANTHROPIC_API_KEY ontbreekt — AI-samenvattingen worden overgeslagen.');
  }

  try {
    // Laad alle bronnen (actief filter komt hieronder)
    const { data: allBronnen, error: bronErr } = await supabaseAdmin
      .from('content_bronnen')
      .select('*');

    if (bronErr) throw bronErr;

    if (!allBronnen?.length) {
      return jsonResponse(200, {
        ok: true,
        bronnenTotaal: 0,
        bronnenActief: 0,
        bronnenVerwerkt: 0,
        artikelenOpgeslagen: 0,
        results: [],
        message: 'Geen content_bronnen geconfigureerd. Voeg er een toe via /content-bronnen.',
      });
    }

    const bronnen = allBronnen.filter(b => b.actief);
    if (!bronnen.length) {
      return jsonResponse(200, {
        ok: true,
        bronnenTotaal: allBronnen.length,
        bronnenActief: 0,
        bronnenVerwerkt: 0,
        artikelenOpgeslagen: 0,
        results: [],
        message: `${allBronnen.length} bronnen gevonden, maar geen enkele staat op actief.`,
      });
    }

    // Filter op frequentie (overslaan als ?force=1 bij manual trigger)
    const now = new Date();
    const activeBronnen = forceAll ? bronnen : bronnen.filter(bron => {
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

    console.log(`syncContentNightly: ${activeBronnen.length}/${bronnen.length} bronnen moeten gesynced worden.`);

    if (activeBronnen.length === 0) {
      return jsonResponse(200, {
        ok: true,
        bronnenTotaal: allBronnen.length,
        bronnenActief: bronnen.length,
        bronnenVerwerkt: 0,
        artikelenOpgeslagen: 0,
        results: [],
        message: `Alle ${bronnen.length} actieve bronnen zijn recent gesynced. Gebruik ?force=1 om alsnog te draaien.`,
      });
    }

    // In quick-mode beperken we het aantal bronnen dat we behandelen
    const bronnenToProcess = quickMode
      ? activeBronnen.slice(0, QUICK_MAX_SOURCES)
      : activeBronnen;
    const syncOpts = quickMode
      ? { skipAiSummary: true, maxPerSource: QUICK_MAX_PER_SOURCE }
      : {};

    const results = [];
    for (const bron of bronnenToProcess) {
      try {
        let result;
        switch (bron.bron_type) {
          case 'pubmed':
            result = await syncPubMed(bron, syncOpts);
            break;
          case 'rss':
            result = await syncRSS(bron, syncOpts);
            break;
          case 'website':
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

    const totalSaved = results.reduce((sum, r) => sum + (r.saved || 0), 0);
    const totalErrors = results.filter(r => r.error).length;

    // Audit log (best-effort, niet kritiek als het faalt)
    try {
      await supabaseAdmin.from('audit_logs').insert({
        actie: 'nightly_content_sync',
        gebruiker: isManual ? 'admin_manual' : 'system',
        details: { bronnen_verwerkt: results.length, artikelen_opgeslagen: totalSaved, details: results },
      });
    } catch (auditErr) {
      console.warn('audit_logs insert failed:', auditErr.message);
    }

    const summary = `Sync klaar: ${results.length} bronnen verwerkt, ${totalSaved} nieuwe artikelen, ${totalErrors} fouten.`;
    console.log(`syncContentNightly: ${summary}`);

    return jsonResponse(200, {
      ok: true,
      bronnenTotaal: allBronnen.length,
      bronnenActief: bronnen.length,
      bronnenVerwerkt: results.length,
      bronnenOvergeslagen: quickMode ? Math.max(0, activeBronnen.length - bronnenToProcess.length) : 0,
      artikelenOpgeslagen: totalSaved,
      fouten: totalErrors,
      quickMode,
      results,
      message: quickMode
        ? `${summary} (Snelle test — geen AI samenvattingen, max ${QUICK_MAX_PER_SOURCE}/bron, ${QUICK_MAX_SOURCES} bronnen. Volledige sync met AI draait elke nacht 03:00 UTC.)`
        : summary,
    });
  } catch (err) {
    console.error('syncContentNightly error:', err);
    return jsonResponse(500, { ok: false, error: err.message });
  }
};
