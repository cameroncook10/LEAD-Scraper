import { supabase } from '../server.js';
import { scrapeGoogleMaps } from './scrapers/googleMaps.js';
import { scrapeZillow } from './scrapers/zillow.js';
import { scrapeNextdoor } from './scrapers/nextdoor.js';
import { scrapeWebSearch } from './scrapers/webSearch.js';
import { scrapeBuyerLeads, scrapeSellerLeads } from './scrapers/realEstateLeads.js';
import { batchQualifyLeads } from './aiQualification.js';
import { v4 as uuidv4 } from 'uuid';

const scrapers = {
  google_maps: scrapeGoogleMaps,
  zillow: scrapeZillow,
  nextdoor: scrapeNextdoor,
  web_search: scrapeWebSearch,
  buyer_leads: scrapeBuyerLeads,    // Craigslist "housing wanted" — buyers
  seller_leads: scrapeSellerLeads,  // Craigslist FSBO — sellers
};

export const createScrapeJob = async (source, query, limit = 100, userId = null) => {
  if (!supabase) throw new Error('Supabase is not configured');

  try {
    const jobId = uuidv4();

    const { data, error } = await supabase
      .from('scrape_jobs')
      .insert({
        id: jobId,
        user_id: userId,
        source,
        query,
        status: 'pending',
        total_leads: 0,
        processed_leads: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating scrape job:', error);
    throw error;
  }
};

export const startScrapeJob = async (jobId, source, query, limit = 100, userId = null) => {
  try {
    // Update job status to running
    await supabase
      .from('scrape_jobs')
      .update({
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('id', jobId);

    // Get scraper function
    const scraperFn = scrapers[source];
    if (!scraperFn) {
      throw new Error(`Unknown scraper: ${source}`);
    }

    // Log start
    await logJob(jobId, `Starting scrape job for ${source}`, 'info');

    // Run scraper
    const leads = await scraperFn(query, limit);
    const leadCount = leads.length;

    // Log scrape results
    await logJob(jobId, `Scraped ${leadCount} leads from ${source}`, 'info');

    // Qualify leads with AI
    await logJob(jobId, `Starting AI qualification for ${leadCount} leads`, 'info');
    
    const qualifiedLeads = await batchQualifyLeads(leads, async (progress) => {
      await supabase
        .from('scrape_jobs')
        .update({
          processed_leads: progress.current
        })
        .eq('id', jobId);
    });

    // Store qualified leads in database, tagged with the owning user so they
    // show up under that account's tenant-scoped queries. Whitelist columns so
    // extra fields from any scraper (rating, price_level, …) can't break insert.
    if (qualifiedLeads.length > 0) {
      const LEAD_COLUMNS = ['name', 'phone', 'email', 'website', 'address', 'business_type', 'source', 'ai_score', 'ai_category', 'ai_confidence', 'raw_data', 'tags', 'notes'];
      const leadsToInsert = qualifiedLeads
        .filter(l => l && l.name)            // name is NOT NULL in the schema
        .map(l => {
          const row = { user_id: userId };
          for (const k of LEAD_COLUMNS) if (l[k] !== undefined) row[k] = l[k];
          return row;
        });

      if (leadsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('leads')
          .insert(leadsToInsert);
        if (insertError) throw insertError;
      }
    }

    // Mark job as complete
    await supabase
      .from('scrape_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_leads: leadCount,
        processed_leads: leadCount
      })
      .eq('id', jobId);

    await logJob(jobId, `Scrape job completed successfully. ${leadCount} leads processed.`, 'info');

    return {
      jobId,
      status: 'completed',
      totalLeads: leadCount,
      processedLeads: leadCount
    };
  } catch (error) {
    console.error('Error in scrape job:', error);
    
    // Update job with error
    await supabase
      .from('scrape_jobs')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);

    await logJob(jobId, `Job failed: ${error.message}`, 'error');

    throw error;
  }
};

export const getJobStatus = async (jobId) => {
  try {
    const { data, error } = await supabase
      .from('scrape_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting job status:', error);
    throw error;
  }
};

export const getAllJobs = async (limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('scrape_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting jobs:', error);
    throw error;
  }
};

export const logJob = async (jobId, message, level = 'info') => {
  try {
    await supabase
      .from('job_logs')
      .insert({
        job_id: jobId,
        message,
        level
      });
  } catch (error) {
    console.error('Error logging job:', error);
  }
};
