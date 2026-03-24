import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Nextdoor-style Local Business Scraper
 * Since Nextdoor requires authentication and prohibits scraping,
 * this scrapes YellowPages and local business directories instead.
 * 
 * No API key required.
 */
export const scrapeNextdoor = async (neighborhood, limit = 50) => {
  try {
    console.log(`[LocalBiz] Scraping local businesses for: ${neighborhood}`);
    const leads = [];

    // Strategy: Scrape YellowPages for local service businesses
    const encodedQuery = encodeURIComponent(neighborhood);

    for (let page = 1; page <= Math.ceil(limit / 30) && leads.length < limit; page++) {
      const url = `https://www.yellowpages.com/search?search_terms=home+services&geo_location_terms=${encodedQuery}&page=${page}`;

      const { data: html } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(html);

      // Parse YellowPages business listings
      $('.result').each((i, el) => {
        if (leads.length >= limit) return false;

        const name = $(el).find('.business-name').text().trim();
        const phone = $(el).find('.phones').text().trim();
        const address = $(el).find('.adr').text().trim();
        const website = $(el).find('.track-visit-website').attr('href') || '';
        const categories = $(el).find('.categories').text().trim();

        if (name && name.length > 2) {
          leads.push({
            name,
            phone: phone || '',
            email: '',
            website,
            address: address || neighborhood,
            business_type: categories || 'Home Services',
            source: 'yellowpages',
          });
        }
      });

      // Respect rate limits
      await new Promise(r => setTimeout(r, 2000));
    }

    // Fallback to web search if no results
    if (leads.length === 0) {
      console.log('[LocalBiz] No YellowPages results, falling back to web search');
      const { scrapeWebSearch } = await import('./webSearch.js');
      const webLeads = await scrapeWebSearch(`home services ${neighborhood}`, limit);
      leads.push(...webLeads);
    }

    console.log(`[LocalBiz] Found ${leads.length} leads`);
    return leads.slice(0, limit);
  } catch (error) {
    console.error('[LocalBiz] Scraper error:', error.message);
    // Fallback
    try {
      const { scrapeWebSearch } = await import('./webSearch.js');
      return await scrapeWebSearch(`local businesses ${neighborhood}`, limit);
    } catch {
      throw error;
    }
  }
};
