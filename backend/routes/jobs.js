import express from 'express';

const router = express.Router();

// Get all jobs
router.get('/', async (req, res, next) => {
  try {
    const { status, limit = 50 } = req.query;

    let query = req.app.locals.supabase
      .from('scrape_jobs')
      .select('*');

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({
      jobs: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    next(error);
  }
});

// Get job by ID
router.get('/:jobId', async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const { data: job, error: jobError } = await req.app.locals.supabase
      .from('scrape_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError) throw jobError;
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get job logs
    const { data: logs, error: logsError } = await req.app.locals.supabase
      .from('job_logs')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (logsError) throw logsError;

    const progress = job.total_leads > 0
      ? Math.round((job.processed_leads / job.total_leads) * 100)
      : 0;

    res.json({
      job,
      logs: logs || [],
      progress
    });
  } catch (error) {
    next(error);
  }
});

export default router;
