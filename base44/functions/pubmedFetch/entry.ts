import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const QUERIES = [
  'fat loss resistance training',
  'protein intake muscle hypertrophy',
  'caloric deficit muscle preservation',
  'HIIT LISS fat oxidation',
  'sleep recovery muscle',
];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const queries = body?.customQueries && body.customQueries.length > 0 ? body.customQueries : QUERIES;
  const results = [];

  for (const query of queries) {
    // Search PubMed
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=3&sort=date&retmode=json&datetype=pdat&reldate=365`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const ids = searchData.esearchresult?.idlist || [];

    for (const pmid of ids) {
      // Check if already exists
      const existing = await base44.asServiceRole.entities.KennisArtikel.filter({ pubmed_id: pmid });
      if (existing.length > 0) continue;

      // Fetch abstract
      const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml`;
      const fetchRes = await fetch(fetchUrl);
      const xml = await fetchRes.text();

      // Extract basic info from XML
      const titleMatch = xml.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/s);
      const abstractMatch = xml.match(/<AbstractText[^>]*>(.*?)<\/AbstractText>/s);
      const journalMatch = xml.match(/<Title>(.*?)<\/Title>/s);
      const yearMatch = xml.match(/<PubDate>.*?<Year>(\d{4})<\/Year>/s);
      const authorsRaw = [...xml.matchAll(/<LastName>(.*?)<\/LastName>/g)].map(m => m[1]);

      const title = titleMatch?.[1]?.replace(/<[^>]+>/g, '') || 'Untitled';
      const abstract = abstractMatch?.[1]?.replace(/<[^>]+>/g, '') || '';
      const journal = journalMatch?.[1] || '';
      const year = yearMatch?.[1] || '';
      const authors = authorsRaw.slice(0, 5).join(', ');

      if (!abstract) continue;

      // AI summary + relevance
      const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Je bent een expert in sportwetenschap en fitness. Analyseer dit wetenschappelijke artikel en geef:
1. Een samenvatting in het NEDERLANDS (2-3 zinnen, begrijpelijk voor een sporter)
2. Een samenvatting in het ENGELS (2-3 zinnen)
3. Een relevantiescore 0-100 voor een fitness/kracht/vetverbranding app
4. Een bewijsniveau: A (RCT/meta-analyse), B (cohort), C (case study), D (expert opinion)
5. Categorie: voeding, training, herstel, supplementen, hormonen, of overig

Titel: ${title}
Abstract: ${abstract.substring(0, 2000)}`,
        response_json_schema: {
          type: 'object',
          properties: {
            summary_nl: { type: 'string' },
            summary_en: { type: 'string' },
            relevance_score: { type: 'number' },
            evidence_level: { type: 'string' },
            category: { type: 'string' }
          }
        }
      });

      const artikel = await base44.asServiceRole.entities.KennisArtikel.create({
        pubmed_id: pmid,
        title_en: title,
        title_nl: title,
        abstract_en: abstract.substring(0, 3000),
        summary_nl: aiResult.summary_nl || '',
        summary_en: aiResult.summary_en || '',
        authors,
        journal,
        published_date: year ? `${year}-01-01` : undefined,
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        category: aiResult.category || 'overig',
        evidence_level: aiResult.evidence_level || 'C',
        relevance_score: aiResult.relevance_score || 50,
        status: 'pending',
        search_query: query
      });

      await base44.asServiceRole.entities.AuditLog.create({
        actie: 'pubmed_fetch',
        entity_naam: 'KennisArtikel',
        record_id: artikel.id,
        details: `Artikel opgehaald: ${title} (PMID: ${pmid})`
      });

      results.push({ pmid, title });
    }
  }

  return Response.json({ opgehaald: results.length, artikelen: results });
});