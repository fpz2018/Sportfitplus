import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sheetId = Deno.env.get('RECEPTEN_SHEET_ID');
    if (!sheetId) {
      return Response.json({ error: 'RECEPTEN_SHEET_ID niet ingesteld' }, { status: 400 });
    }

    // Haal de Google Sheets connector op
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Fetch de sheet data - probeer eerst alle sheets op te halen
    const metaResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const metaData = await metaResponse.json();
    const sheetName = metaData.sheets?.[0]?.properties?.title || 'Sheet1';

    // Fetch de daadwerkelijke waarden
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!A1:M200?valueRenderOption=FORMATTED_VALUE`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const sheetData = await response.json();
    const values = sheetData.values || [];

    if (values.length === 0) {
      return Response.json({ error: 'Geen data gevonden in sheet' }, { status: 404 });
    }

    // Als er slechts 1 kolom is, zijn het waarschijnlijk titels
    // Parse de recepten - elke rij is een recept
    const recepten = values.map((row, i) => ({
      index: i,
      titel: row[0] || null,
      rawData: row,
    })).filter(r => r.titel); // Filter lege rijen

    return Response.json({
      success: true,
      totaal: recepten.length,
      recepten: recepten,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});