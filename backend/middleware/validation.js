import Joi from 'joi';

/**
 * Request Validation Middleware
 * Uses Joi for schema validation
 */

// Validation schemas
export const schemas = {
  // Auth
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
  }),

  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().required()
  }),

  // Scrape jobs
  createScrapeJob: Joi.object({
    urls: Joi.array().items(Joi.string().uri()).required(),
    keywords: Joi.array().items(Joi.string()).required(),
    selectors: Joi.object().required(),
    qualityThreshold: Joi.number().min(0).max(1).optional()
  }),

  // Leads
  createLead: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[\d\s\-\(\)\+]{10,}$/).optional(),
    company: Joi.string().optional(),
    title: Joi.string().optional(),
    source: Joi.string().required(),
    data: Joi.object().optional()
  }),

  updateLead: Joi.object({
    name: Joi.string().optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^[\d\s\-\(\)\+]{10,}$/).optional(),
    company: Joi.string().optional(),
    title: Joi.string().optional(),
    status: Joi.string().valid('new', 'qualified', 'contacted', 'closed').optional(),
    quality_score: Joi.number().min(0).max(1).optional(),
    data: Joi.object().optional()
  }),

  // Email campaigns
  createEmailCampaign: Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid('email', 'sms', 'whatsapp').required(),
    template_id: Joi.number().required(),
    recipient_ids: Joi.array().items(Joi.number()).optional(),
    quality_threshold: Joi.number().min(0).max(1).optional(),
    schedule_time: Joi.date().iso().optional()
  }),

  // Message templates
  createTemplate: Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid('email', 'sms', 'whatsapp').required(),
    subject: Joi.string().when('type', {
      is: 'email',
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    body: Joi.string().required(),
    variables: Joi.array().items(Joi.string()).optional(),
    tags: Joi.array().items(Joi.string()).optional()
  }),

  updateTemplate: Joi.object({
    name: Joi.string().optional(),
    subject: Joi.string().optional(),
    body: Joi.string().optional(),
    variables: Joi.array().items(Joi.string()).optional(),
    tags: Joi.array().items(Joi.string()).optional()
  }),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sort: Joi.string().optional(),
    order: Joi.string().valid('asc', 'desc').optional()
  })
};

/**
 * Validation middleware factory
 */
export const validate = (schema, options = {}) => {
  return (req, res, next) => {
    const source = options.source || 'body';
    const dataToValidate = source === 'body' ? req.body :
                           source === 'params' ? req.params :
                           source === 'query' ? req.query :
                           req.body;

    const validationOptions = {
      abortEarly: options.abortEarly !== false,
      stripUnknown: options.stripUnknown !== false,
      ...options.joiOptions
    };

    const { error, value } = schema.validate(dataToValidate, validationOptions);

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details,
        message: error.message
      });
    }

    // Attach validated data to request
    if (source === 'body') {
      req.validatedData = value;
    } else if (source === 'params') {
      req.validatedParams = value;
    } else if (source === 'query') {
      req.validatedQuery = value;
    }

    next();
  };
};

/**
 * Convenience middleware for common validations
 */
export const validateBody = (schema) => validate(schema, { source: 'body' });
export const validateParams = (schema) => validate(schema, { source: 'params' });
export const validateQuery = (schema) => validate(schema, { source: 'query' });

/**
 * Custom validation rules
 */
export const customValidators = {
  isValidPhoneNumber: (phone) => {
    const phoneRegex = /^[\d\s\-\(\)\+]{10,}$/;
    return phoneRegex.test(phone);
  },

  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidURL: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isValidCompanyDomain: (domain) => {
    // Domain should match company naming conventions
    return /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/.test(domain);
  }
};

/**
 * Error formatter for validation errors
 */
export const formatValidationError = (error) => {
  if (!error.details) {
    return {
      error: 'Invalid request',
      message: error.message
    };
  }

  const formatted = error.details.reduce((acc, detail) => {
    const field = detail.path.join('.');
    acc[field] = {
      message: detail.message,
      type: detail.type
    };
    return acc;
  }, {});

  return {
    error: 'Validation failed',
    fields: formatted,
    count: error.details.length
  };
};

export default {
  validate,
  validateBody,
  validateParams,
  validateQuery,
  schemas,
  customValidators,
  formatValidationError
};
