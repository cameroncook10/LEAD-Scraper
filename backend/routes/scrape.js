import express from 'express';
import { createScrapeJob, startScrapeJob } from '../services/scrapeManager.js';

const router = express.Router();

// Start a new scrape job
router.post('/start', async (req, res, next) => {
  try {
    const { source, query, limit = 100 } = req.body;

    if (!source) {
      return res.status(400).json({ error: 'Source is required' });
    }

    // Create job
    const job = await createScrapeJob(source, query, limit);

    // Start job asynchronously (don't wait for it to complete)
    startScrapeJob(job.id, source, query, limit).catch(error => {
      console.error('Background scrape error:', error);
    });

    res.json({
      jobId: job.id,
      status: 'pending',
      message: 'Scrape job started. Monitor progress with /status endpoint.'
    });
  } catch (error) {
    next(error);
  }
});

// Get scrape job status
router.get('/status/:jobId', async (req, res, next) => {
  try {
    const { jobId } = req.params;
    
    // Get job status
    const { data: jobData, error: jobError } = await req.app.locals.supabase
      .from('scrape_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError) throw jobError;

    // Get job logs
    const { data: logs, error: logsError } = await req.app.locals.supabase
      .from('job_logs')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (logsError) throw logsError;

    res.json({
      job: jobData,
      logs: logs || [],
      progress: jobData.total_leads > 0 
        ? Math.round((jobData.processed_leads / jobData.total_leads) * 100)
        : 0
    });
  } catch (error) {
    next(error);
  }
});

// List all jobs
router.get('/jobs', async (req, res, next) => {
  try {
    const { data, error } = await req.app.locals.supabase
      .from('scrape_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({ jobs: data || [] });
  } catch (error) {
    next(error);
  }
});

export default router;
