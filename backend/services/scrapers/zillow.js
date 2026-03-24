import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Zillow Scraper — Scrapes real estate agent/broker listings
 * Uses Zillow's public agent directory pages.
 * No API key required.
 */
export const scrapeZillow = async (location, limit = 50) => {
  try {
    console.log(`[Zillow] Scraping agents for: ${location}`);
    const leads = [];
    const encodedLocation = encodeURIComponent(location);

    // Zillow agent directory pages
    for (let page = 1; page <= Math.ceil(limit / 20) && leads.length < limit; page++) {
      const url = `https://www.zillow.com/professionals/real-estate-agent-reviews/${encodedLocation}/?page=${page}`;

      const { data: html } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(html);

      // Parse agent cards
      $('[class*="professional-card"], [class*="agent-card"], .ldb-card').each((i, el) => {
        if (leads.length >= limit) return false;

        const name = $(el).find('[class*="name"], h3, h4').first().text().trim();
        const phone = $(el).find('[class*="phone"], a[href^="tel:"]').first().text().trim();
        const website = $(el).find('a[href*="zillow.com/profile"]').first().attr('href') || '';

        if (name && name.length > 2) {
          leads.push({
            name,
            phone: phone || '',
            email: '',
            website: website.startsWith('/') ? `https://www.zillow.com${website}` : website,
            address: location,
            business_type: 'Real Estate Agent',
            source: 'zillow',
          });
        }
      });

      // Respect rate limits
      await new Promise(r => setTimeout(r, 2000));
    }

    // If Zillow scraping didn't yield enough results, fallback to web search
    if (leads.length === 0) {
      console.log('[Zillow] No direct results, falling back to web search');
      const { scrapeWebSearch } = await import('./webSearch.js');
      const webLeads = await scrapeWebSearch(`real estate agents ${location}`, limit);
      leads.push(...webLeads);
    }

    console.log(`[Zillow] Found ${leads.length} leads`);
    return leads.slice(0, limit);
  } catch (error) {
    console.error('[Zillow] Scraper error:', error.message);
    // Fallback to web search
    try {
      const { scrapeWebSearch } = await import('./webSearch.js');
      return await scrapeWebSearch(`real estate agents ${location}`, limit);
    } catch {
      throw error;
    }
  }
};
