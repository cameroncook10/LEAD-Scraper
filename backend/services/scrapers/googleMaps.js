import axios from 'axios';

/**
 * Google Maps / Places API Scraper
 * Uses the Google Places Text Search API to find real businesses.
 * 
 * Required: GOOGLE_PLACES_API_KEY in .env
 * If no API key is set, falls back to Google Search scraping via webSearch.
 */
export const scrapeGoogleMaps = async (query, limit = 50) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.warn('[GoogleMaps] No API key set. Using web search fallback.');
    // Import webSearch as a fallback
    const { scrapeWebSearch } = await import('./webSearch.js');
    return scrapeWebSearch(query, limit);
  }

  try {
    console.log(`[GoogleMaps] Searching Places API for: ${query}`);
    const leads = [];
    let nextPageToken = null;

    while (leads.length < limit) {
      const params = {
        query,
        key: apiKey,
        ...(nextPageToken ? { pagetoken: nextPageToken } : {}),
      };

      const { data } = await axios.get(
        'https://maps.googleapis.com/maps/api/place/textsearch/json',
        { params }
      );

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Places API error: ${data.status} — ${data.error_message || ''}`);
      }

      for (const place of (data.results || [])) {
        if (leads.length >= limit) break;

        // Get details for phone + website
        let phone = '', website = '';
        try {
          const detailRes = await axios.get(
            'https://maps.googleapis.com/maps/api/place/details/json',
            { params: { place_id: place.place_id, fields: 'formatted_phone_number,website', key: apiKey } }
          );
          phone = detailRes.data.result?.formatted_phone_number || '';
          website = detailRes.data.result?.website || '';
        } catch { /* skip detail fetch errors */ }

        leads.push({
          name: place.name,
          phone,
          email: '', // Google Places doesn't provide email
          website,
          address: place.formatted_address || '',
          business_type: (place.types || []).slice(0, 2).join(', '),
          source: 'google_maps',
          raw_data: {
            place_id: place.place_id,
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            price_level: place.price_level,
          },
        });
      }

      nextPageToken = data.next_page_token;
      if (!nextPageToken) break;
      // Google requires a short delay before using next_page_token
      await new Promise(r => setTimeout(r, 2000));
    }

    console.log(`[GoogleMaps] Found ${leads.length} leads`);
    return leads;
  } catch (error) {
    console.error('[GoogleMaps] Scraper error:', error.message);
    throw error;
  }
};
