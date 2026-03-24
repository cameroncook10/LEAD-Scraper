import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Web Search Scraper
 * Scrapes business listings from Yelp search results (public pages).
 * Falls back to DuckDuckGo HTML search if Yelp fails.
 *
 * No API key required — uses public web pages.
 */
export const scrapeWebSearch = async (query, limit = 50) => {
  try {
    console.log(`[WebSearch] Scraping for: ${query}`);
    const leads = [];

    // Strategy 1: Scrape Yelp search results (public pages)
    try {
      const yelpLeads = await scrapeYelp(query, limit);
      leads.push(...yelpLeads);
    } catch (e) {
      console.warn('[WebSearch] Yelp scrape failed, trying DuckDuckGo:', e.message);
    }

    // Strategy 2: DuckDuckGo HTML search as fallback
    if (leads.length < limit) {
      try {
        const ddgLeads = await scrapeDuckDuckGo(query, limit - leads.length);
        leads.push(...ddgLeads);
      } catch (e) {
        console.warn('[WebSearch] DuckDuckGo fallback failed:', e.message);
      }
    }

    console.log(`[WebSearch] Total leads found: ${leads.length}`);
    return leads.slice(0, limit);
  } catch (error) {
    console.error('[WebSearch] Scraper error:', error.message);
    throw error;
  }
};

async function scrapeYelp(query, limit) {
  const leads = [];
  const encodedQuery = encodeURIComponent(query);
  
  // Scrape first 3 pages (10 results each)
  for (let page = 0; page < 3 && leads.length < limit; page++) {
    const url = `https://www.yelp.com/search?find_desc=${encodedQuery}&start=${page * 10}`;
    
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(html);

    // Parse Yelp business cards
    $('[data-testid="serp-ia-card"]').each((i, el) => {
      if (leads.length >= limit) return false;

      const name = $(el).find('a[href*="/biz/"]').first().text().trim();
      const href = $(el).find('a[href*="/biz/"]').first().attr('href') || '';
      const address = $(el).find('[class*="secondaryAttributes"]').text().trim();
      const phone = $(el).find('[class*="phone"]').text().trim();

      if (name && name.length > 1) {
        leads.push({
          name: name.replace(/^\d+\.\s*/, ''), // Remove leading number
          phone: phone || '',
          email: '',
          website: href.startsWith('/') ? `https://www.yelp.com${href}` : href,
          address: address || '',
          business_type: query,
          source: 'yelp',
        });
      }
    });

    // Respect rate limits
    await new Promise(r => setTimeout(r, 1500));
  }

  return leads;
}

async function scrapeDuckDuckGo(query, limit) {
  const leads = [];
  const searchQuery = encodeURIComponent(`${query} site:yelp.com OR site:yellowpages.com`);
  
  const { data: html } = await axios.get(
    `https://html.duckduckgo.com/html/?q=${searchQuery}`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    }
  );

  const $ = cheerio.load(html);

  $('.result').each((i, el) => {
    if (leads.length >= limit) return false;

    const title = $(el).find('.result__title').text().trim();
    const url = $(el).find('.result__url').text().trim();
    const snippet = $(el).find('.result__snippet').text().trim();

    // Extract phone numbers from snippets
    const phoneMatch = snippet.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);

    if (title && title.length > 3) {
      leads.push({
        name: title.replace(/ - Yelp$| - Yellow Pages$/i, '').trim(),
        phone: phoneMatch ? phoneMatch[0] : '',
        email: '',
        website: url || '',
        address: '',
        business_type: query,
        source: 'web_search',
      });
    }
  });

  return leads;
}
