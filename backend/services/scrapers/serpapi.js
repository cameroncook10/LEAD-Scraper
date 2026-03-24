import axios from 'axios';

/**
 * SerpAPI Premium Scraper
 *
 * Uses SerpAPI to get Google search results, Google Maps data, and Yelp results.
 * This is the premium scraper — much more reliable than direct HTML scraping.
 *
 * Required: SERPAPI_KEY in .env (or set as Supabase secret)
 * Get a key at: https://serpapi.com
 */

const SERPAPI_BASE = 'https://serpapi.com/search.json';

/**
 * Premium Google Maps scraper via SerpAPI
 */
export async function scrapeSerpGoogleMaps(query, limit = 50) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    throw new Error('SERPAPI_KEY not configured. Set it in .env for premium scraping.');
  }

  try {
    console.log(`[SerpAPI] Google Maps search: ${query}`);
    const leads = [];
    let start = 0;

    while (leads.length < limit) {
      const { data } = await axios.get(SERPAPI_BASE, {
        params: {
          engine: 'google_maps',
          q: query,
          type: 'search',
          start,
          api_key: apiKey,
        },
        timeout: 30000,
      });

      const results = data.local_results || [];
      if (results.length === 0) break;

      for (const biz of results) {
        if (leads.length >= limit) break;
        leads.push({
          name: biz.title || '',
          phone: biz.phone || '',
          email: '', // Google Maps doesn't expose email
          website: biz.website || '',
          address: biz.address || '',
          business_type: biz.type || (biz.types || []).join(', '),
          source: 'google_maps_premium',
          raw_data: {
            place_id: biz.place_id,
            rating: biz.rating,
            reviews: biz.reviews,
            price: biz.price,
            hours: biz.hours,
            thumbnail: biz.thumbnail,
            gps_coordinates: biz.gps_coordinates,
          },
        });
      }

      start += results.length;
      // SerpAPI has rate limits, small delay between pages
      await new Promise(r => setTimeout(r, 500));
    }

    console.log(`[SerpAPI] Google Maps found ${leads.length} leads`);
    return leads;
  } catch (error) {
    console.error('[SerpAPI] Google Maps error:', error.message);
    throw error;
  }
}

/**
 * Premium Yelp scraper via SerpAPI
 */
export async function scrapeSerpYelp(query, limit = 50) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    throw new Error('SERPAPI_KEY not configured.');
  }

  try {
    console.log(`[SerpAPI] Yelp search: ${query}`);
    const leads = [];
    let start = 0;

    while (leads.length < limit) {
      const { data } = await axios.get(SERPAPI_BASE, {
        params: {
          engine: 'yelp',
          find_desc: query,
          start,
          api_key: apiKey,
        },
        timeout: 30000,
      });

      const results = data.organic_results || [];
      if (results.length === 0) break;

      for (const biz of results) {
        if (leads.length >= limit) break;
        leads.push({
          name: biz.title || '',
          phone: biz.phone || '',
          email: '',
          website: biz.link || '',
          address: biz.neighborhood || biz.address || '',
          business_type: (biz.categories || []).map(c => c.title || c).join(', ') || query,
          source: 'yelp_premium',
          raw_data: {
            rating: biz.rating,
            reviews: biz.reviews,
            price_range: biz.price_range,
            snippet: biz.snippet,
            yelp_url: biz.link,
          },
        });
      }

      start += results.length;
      await new Promise(r => setTimeout(r, 500));
    }

    console.log(`[SerpAPI] Yelp found ${leads.length} leads`);
    return leads;
  } catch (error) {
    console.error('[SerpAPI] Yelp error:', error.message);
    throw error;
  }
}

/**
 * Premium Google search scraper — finds businesses from Google organic results
 * Extracts business info from search snippets and knowledge panels
 */
export async function scrapeSerpGoogleSearch(query, limit = 50) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    throw new Error('SERPAPI_KEY not configured.');
  }

  try {
    console.log(`[SerpAPI] Google search: ${query}`);
    const leads = [];
    let start = 0;

    while (leads.length < limit) {
      const { data } = await axios.get(SERPAPI_BASE, {
        params: {
          engine: 'google',
          q: query,
          start,
          num: 20,
          api_key: apiKey,
        },
        timeout: 30000,
      });

      // Extract from local pack (Google Maps sidebar)
      if (data.local_results?.places) {
        for (const place of data.local_results.places) {
          if (leads.length >= limit) break;
          leads.push({
            name: place.title || '',
            phone: place.phone || '',
            email: '',
            website: place.website || '',
            address: place.address || '',
            business_type: place.type || query,
            source: 'google_local_premium',
            raw_data: {
              rating: place.rating,
              reviews: place.reviews,
              position: place.position,
            },
          });
        }
      }

      // Extract from organic results
      const results = data.organic_results || [];
      if (results.length === 0 && !data.local_results?.places) break;

      for (const result of results) {
        if (leads.length >= limit) break;
        // Extract phone from snippet
        const phoneMatch = (result.snippet || '').match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        leads.push({
          name: (result.title || '').replace(/ - .*$/, '').trim(),
          phone: phoneMatch ? phoneMatch[0] : '',
          email: '',
          website: result.link || '',
          address: result.rich_snippet?.top?.detected_extensions?.address || '',
          business_type: query,
          source: 'google_search_premium',
          raw_data: {
            snippet: result.snippet,
            position: result.position,
            displayed_link: result.displayed_link,
          },
        });
      }

      start += 20;
      await new Promise(r => setTimeout(r, 500));
    }

    console.log(`[SerpAPI] Google search found ${leads.length} leads`);
    return leads;
  } catch (error) {
    console.error('[SerpAPI] Google search error:', error.message);
    throw error;
  }
}

/**
 * Combined premium scraper — uses all SerpAPI engines for maximum coverage.
 * Deduplicates results by business name + address.
 */
export async function scrapePremium(query, limit = 50) {
  const leads = [];
  const seen = new Set();

  function addLead(lead) {
    const key = `${(lead.name || '').toLowerCase().trim()}_${(lead.address || '').toLowerCase().trim()}`;
    if (!seen.has(key) && lead.name) {
      seen.add(key);
      leads.push(lead);
    }
  }

  // Try Google Maps first (best structured data)
  try {
    const gmLeads = await scrapeSerpGoogleMaps(query, limit);
    gmLeads.forEach(addLead);
  } catch (e) {
    console.warn('[Premium] Google Maps phase failed:', e.message);
  }

  // Fill remaining with Yelp
  if (leads.length < limit) {
    try {
      const yelpLeads = await scrapeSerpYelp(query, limit - leads.length);
      yelpLeads.forEach(addLead);
    } catch (e) {
      console.warn('[Premium] Yelp phase failed:', e.message);
    }
  }

  // Fill remaining with Google Search
  if (leads.length < limit) {
    try {
      const searchLeads = await scrapeSerpGoogleSearch(query, limit - leads.length);
      searchLeads.forEach(addLead);
    } catch (e) {
      console.warn('[Premium] Google Search phase failed:', e.message);
    }
  }

  console.log(`[Premium] Total unique leads: ${leads.length}`);
  return leads.slice(0, limit);
}
