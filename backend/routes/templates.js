import express from 'express';
import { supabase } from '../server.js';
import { requireAuth } from '../middleware/auth.js';
import { auditLog } from '../utils/auditLog.js';

const router = express.Router();

// Middleware
router.use(requireAuth);

/**
 * GET /api/templates
 * Get all message templates for user
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      templates: data || [],
      total: (data || []).length
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

/**
 * GET /api/templates/:id
 * Get template details
 */
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Template not found' });

    res.json(data);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

/**
 * POST /api/templates
 * Create new message template
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      type, // 'email' | 'sms' | 'whatsapp'
      subject, // For email
      body,
      variables = [], // Placeholders like {{firstName}}, {{company}}
      tags = []
    } = req.body;

    if (!name || !type || !body) {
      return res.status(400).json({
        error: 'Missing required fields: name, type, body'
      });
    }

    const { data: template, error } = await supabase
      .from('message_templates')
      .insert({
        user_id: req.user.userId,
        name,
        type,
        subject: subject || null,
        body,
        variables,
        tags,
        preview_text: body.substring(0, 150)
      })
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await auditLog(
      req.user.userId,
      'TEMPLATE_CREATED',
      'message_template',
      template.id,
      { name, type }
    );

    res.status(201).json({
      template,
      message: 'Template created successfully'
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

/**
 * PUT /api/templates/:id
 * Update template
 */
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      subject,
      body,
      variables,
      tags
    } = req.body;

    // Verify ownership
    const { data: existing } = await supabase
      .from('message_templates')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (subject !== undefined) updates.subject = subject;
    if (body !== undefined) {
      updates.body = body;
      updates.preview_text = body.substring(0, 150);
    }
    if (variables !== undefined) updates.variables = variables;
    if (tags !== undefined) updates.tags = tags;

    const { data: template, error } = await supabase
      .from('message_templates')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await auditLog(
      req.user.userId,
      'TEMPLATE_UPDATED',
      'message_template',
      req.params.id,
      { name: template.name }
    );

    res.json({
      template,
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

/**
 * DELETE /api/templates/:id
 * Delete template
 */
router.delete('/:id', async (req, res) => {
  try {
    // Verify ownership
    const { data: template } = await supabase
      .from('message_templates')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .single();

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    // Audit log
    await auditLog(
      req.user.userId,
      'TEMPLATE_DELETED',
      'message_template',
      req.params.id,
      { name: template.name }
    );

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

/**
 * POST /api/templates/:id/preview
 * Preview template with sample data
 */
router.post('/:id/preview', async (req, res) => {
  try {
    const { sampleData = {} } = req.body;

    const { data: template } = await supabase
      .from('message_templates')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .single();

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Replace variables in body and subject
    let previewBody = template.body;
    let previewSubject = template.subject || '';

    template.variables?.forEach(variable => {
      const placeholder = new RegExp(`{{${variable}}}`, 'g');
      const value = sampleData[variable] || `[${variable}]`;
      previewBody = previewBody.replace(placeholder, value);
      previewSubject = previewSubject.replace(placeholder, value);
    });

    res.json({
      body: previewBody,
      subject: previewSubject || null,
      variables: template.variables || []
    });
  } catch (error) {
    console.error('Error previewing template:', error);
    res.status(500).json({ error: 'Failed to preview template' });
  }
});

export default router;
