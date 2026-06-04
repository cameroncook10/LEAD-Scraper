import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Real-estate buyer/seller lead scraper (no API key).
 *
 * Sources actual prospects (not agents):
 *   - seller_leads → Craigslist "real estate - by owner" (FSBO sellers)
 *   - buyer_leads  → Craigslist "housing wanted" (people looking to buy/rent)
 *
 * Craigslist anonymizes contact info, so these leads carry intent + location +
 * price rather than phone/email — exactly the signals the realtor portfolio
 * qualifier scores on. Falls back to a web search if Craigslist is unavailable.
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Best-effort city → Craigslist subdomain. Handles the common multi-word regions;
// otherwise slugifies (works for many single-word metros like austin, denver).
const CL_REGION = {
  'new york': 'newyork', 'nyc': 'newyork', 'los angeles': 'losangeles', 'la': 'losangeles',
  'san francisco': 'sfbay', 'sf': 'sfbay', 'bay area': 'sfbay', 'san jose': 'sfbay',
  'washington dc': 'washingtondc', 'dc': 'washingtondc', 'dallas': 'dallas', 'fort worth': 'dallas',
  'san antonio': 'sanantonio', 'las vegas': 'lasvegas', 'salt lake city': 'saltlakecity',
  'new orleans': 'neworleans', 'kansas city': 'kansascity', 'san diego': 'sandiego',
  'oklahoma city': 'oklahomacity', 'long island': 'longisland',
};

function regionSlug(location) {
  const loc = (location || '').toLowerCase().trim();
  // strip a trailing 2-letter state code ("austin tx" → "austin")
  const cityOnly = loc.replace(/,?\s+[a-z]{2}\b.*$/, '').trim();
  for (const [k, v] of Object.entries(CL_REGION)) {
    if (loc.includes(k)) return v;
  }
  return (cityOnly || loc).replace(/[^a-z]/g, '');
}

const CATEGORY = { seller: 'reo', buyer: 'hsw' }; // reo=real estate by owner, hsw=housing wanted

function priceToNumber(text) {
  if (!text) return undefined;
  const m = String(text).replace(/[, ]/g, '').match(/\$?(\d{3,})/);
  return m ? Number(m[1]) : undefined;
}

async function scrapeCraigslist(location, limit, intent) {
  const region = regionSlug(location);
  if (!region) return [];
  const cat = CATEGORY[intent];
  const url = `https://${region}.craigslist.org/search/${cat}`;

  const { data: html } = await axios.get(url, {
    headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'en-US,en;q=0.9' },
    timeout: 15000,
  });

  const $ = cheerio.load(html);
  const leads = [];

  // Craigslist static results: try current + legacy selectors.
  const rows = $('li.cl-static-search-result, li.cl-search-result, .result-row');
  rows.each((i, el) => {
    if (leads.length >= limit) return false;
    const $el = $(el);

    const link = $el.find('a[href]').first().attr('href') || '';
    const title = ($el.attr('title')
      || $el.find('.title, .result-title, .titlestring').first().text()
      || $el.find('a').first().text()).trim();
    const priceText = $el.find('.price, .result-price').first().text().trim();
    const hood = $el.find('.location, .result-hood').first().text().replace(/[()]/g, '').trim();

    if (!title || title.length < 4) return;

    const price = priceToNumber(priceText);
    const where = hood || location;
    leads.push({
      name: title.slice(0, 140),
      phone: '',
      email: '',
      website: link.startsWith('http') ? link : (link ? `https://${region}.craigslist.org${link}` : ''),
      address: where,
      business_type: intent === 'seller' ? 'Home Seller (FSBO)' : 'Home Buyer',
      source: 'craigslist',
      notes: `${intent === 'seller' ? 'For sale by owner' : 'Housing wanted (buyer)'}: ${title}`,
      raw_data: { listing_intent: intent, price, location: where, url: link, title, category: cat },
    });
  });

  return leads;
}

async function scrapeRealEstateLeads(location, limit, intent) {
  if (!location) throw new Error('A location/market area is required (e.g. "Austin TX")');
  try {
    console.log(`[RELeads] Craigslist ${intent} leads for: ${location}`);
    const leads = await scrapeCraigslist(location, limit, intent);
    if (leads.length > 0) return leads.slice(0, limit);
    console.warn('[RELeads] No Craigslist results, falling back to web search');
  } catch (e) {
    console.warn(`[RELeads] Craigslist failed (${e.message}), falling back to web search`);
  }

  // Fallback: web search seeded with intent so downstream scoring still works.
  const { scrapeWebSearch } = await import('./webSearch.js');
  const term = intent === 'seller'
    ? `homeowners selling by owner ${location} FSBO`
    : `home buyers looking to buy ${location}`;
  const webLeads = await scrapeWebSearch(term, limit);
  return webLeads.map(l => ({
    ...l,
    business_type: intent === 'seller' ? 'Home Seller (FSBO)' : 'Home Buyer',
    notes: `${intent === 'seller' ? 'Possible seller' : 'Possible buyer'}: ${l.name}`,
    raw_data: { ...(l.raw_data || {}), listing_intent: intent, location },
  }));
}

export const scrapeSellerLeads = (location, limit = 50) => scrapeRealEstateLeads(location, limit, 'seller');
export const scrapeBuyerLeads  = (location, limit = 50) => scrapeRealEstateLeads(location, limit, 'buyer');
