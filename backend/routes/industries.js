import express from 'express';
const router = express.Router();

/**
 * Industry presets for the lead scraper
 * Each preset contains search parameters optimized for that industry
 */
const industryPresets = {
  hvac: {
    id: 'hvac',
    name: 'HVAC Contractors',
    icon: 'Wrench',
    keywords: ['HVAC', 'heating and cooling', 'air conditioning repair', 'furnace installation', 'AC service'],
    googleMapsCategories: ['HVAC contractor', 'Heating contractor', 'Air conditioning contractor'],
    yelpCategories: ['Heating & Air Conditioning/HVAC'],
    avgLeadsPerSearch: 2400,
    searchLocations: ['Phoenix AZ', 'Dallas TX', 'Houston TX', 'Atlanta GA', 'Charlotte NC'],
    outreachTemplateId: 'hvac_outreach',
    qualificationCriteria: {
      minReviews: 5,
      minRating: 3.0,
      hasWebsite: true,
      hasPhone: true,
    },
  },
  roofing: {
    id: 'roofing',
    name: 'Roofing Companies',
    icon: 'Home',
    keywords: ['roofing', 'roof repair', 'roof replacement', 'storm damage roofing', 'shingles'],
    googleMapsCategories: ['Roofing contractor', 'Roof repair service'],
    yelpCategories: ['Roofing'],
    avgLeadsPerSearch: 3100,
    searchLocations: ['Richmond VA', 'Nashville TN', 'Tampa FL', 'Oklahoma City OK', 'Kansas City MO'],
    outreachTemplateId: 'roofing_outreach',
    qualificationCriteria: {
      minReviews: 3,
      minRating: 3.5,
      hasWebsite: true,
      hasPhone: true,
    },
  },
  plumbing: {
    id: 'plumbing',
    name: 'Plumbing Services',
    icon: 'Droplets',
    keywords: ['plumber', 'plumbing service', 'drain cleaning', 'water heater', 'sewer repair'],
    googleMapsCategories: ['Plumber', 'Plumbing service'],
    yelpCategories: ['Plumbing'],
    avgLeadsPerSearch: 1800,
    searchLocations: ['Los Angeles CA', 'Chicago IL', 'Miami FL', 'Denver CO', 'Portland OR'],
    outreachTemplateId: 'plumbing_outreach',
    qualificationCriteria: {
      minReviews: 5,
      minRating: 3.5,
      hasWebsite: true,
      hasPhone: true,
    },
  },
  electrical: {
    id: 'electrical',
    name: 'Electricians',
    icon: 'Zap',
    keywords: ['electrician', 'electrical contractor', 'panel upgrade', 'wiring', 'EV charger installation'],
    googleMapsCategories: ['Electrician', 'Electrical contractor'],
    yelpCategories: ['Electricians'],
    avgLeadsPerSearch: 1500,
    searchLocations: ['San Diego CA', 'Austin TX', 'Raleigh NC', 'Minneapolis MN', 'Columbus OH'],
    outreachTemplateId: 'electrical_outreach',
    qualificationCriteria: {
      minReviews: 5,
      minRating: 4.0,
      hasWebsite: true,
      hasPhone: true,
    },
  },
  landscaping: {
    id: 'landscaping',
    name: 'Landscaping & Lawn Care',
    icon: 'TreePine',
    keywords: ['landscaping', 'lawn care', 'lawn maintenance', 'hardscaping', 'landscape design'],
    googleMapsCategories: ['Landscaper', 'Lawn care service'],
    yelpCategories: ['Landscaping', 'Lawn Services'],
    avgLeadsPerSearch: 2800,
    searchLocations: ['Charlotte NC', 'Jacksonville FL', 'Phoenix AZ', 'San Antonio TX', 'Orlando FL'],
    outreachTemplateId: 'landscaping_outreach',
    qualificationCriteria: {
      minReviews: 3,
      minRating: 3.0,
      hasWebsite: false,
      hasPhone: true,
    },
  },
  painting: {
    id: 'painting',
    name: 'Painting Contractors',
    icon: 'PaintBucket',
    keywords: ['painter', 'painting contractor', 'house painting', 'commercial painting', 'interior painting'],
    googleMapsCategories: ['Painter', 'Painting contractor'],
    yelpCategories: ['Painters'],
    avgLeadsPerSearch: 1200,
    searchLocations: ['Seattle WA', 'Boston MA', 'Philadelphia PA', 'Nashville TN', 'Denver CO'],
    outreachTemplateId: 'painting_outreach',
    qualificationCriteria: {
      minReviews: 3,
      minRating: 3.5,
      hasWebsite: true,
      hasPhone: true,
    },
  },
  pest_control: {
    id: 'pest_control',
    name: 'Pest Control',
    icon: 'Shield',
    keywords: ['pest control', 'exterminator', 'termite treatment', 'rodent control', 'bed bug treatment'],
    googleMapsCategories: ['Pest control service'],
    yelpCategories: ['Pest Control'],
    avgLeadsPerSearch: 900,
    searchLocations: ['Houston TX', 'Atlanta GA', 'Tampa FL', 'Las Vegas NV', 'New Orleans LA'],
    outreachTemplateId: 'pest_control_outreach',
    qualificationCriteria: {
      minReviews: 5,
      minRating: 3.5,
      hasWebsite: true,
      hasPhone: true,
    },
  },
  healthcare: {
    id: 'healthcare',
    name: 'Home Healthcare',
    icon: 'Stethoscope',
    keywords: ['home healthcare', 'home health aide', 'senior care', 'in-home nursing', 'physical therapy'],
    googleMapsCategories: ['Home health care service', 'Nursing service'],
    yelpCategories: ['Home Health Care'],
    avgLeadsPerSearch: 1600,
    searchLocations: ['New York NY', 'Los Angeles CA', 'Chicago IL', 'Houston TX', 'Phoenix AZ'],
    outreachTemplateId: 'healthcare_outreach',
    qualificationCriteria: {
      minReviews: 3,
      minRating: 4.0,
      hasWebsite: true,
      hasPhone: true,
    },
  },
  legal: {
    id: 'legal',
    name: 'Law Firms',
    icon: 'Scale',
    keywords: ['lawyer', 'attorney', 'law firm', 'personal injury lawyer', 'family law attorney'],
    googleMapsCategories: ['Law firm', 'Attorney', 'Lawyer'],
    yelpCategories: ['Lawyers', 'Personal Injury Law'],
    avgLeadsPerSearch: 2200,
    searchLocations: ['New York NY', 'Los Angeles CA', 'Chicago IL', 'Dallas TX', 'Miami FL'],
    outreachTemplateId: 'legal_outreach',
    qualificationCriteria: {
      minReviews: 10,
      minRating: 4.0,
      hasWebsite: true,
      hasPhone: true,
    },
  },
  auto_detailing: {
    id: 'auto_detailing',
    name: 'Auto Detailing',
    icon: 'Car',
    keywords: ['auto detailing', 'car detailing', 'ceramic coating', 'paint correction', 'mobile detailing'],
    googleMapsCategories: ['Auto detailing service', 'Car wash'],
    yelpCategories: ['Auto Detailing'],
    avgLeadsPerSearch: 700,
    searchLocations: ['Los Angeles CA', 'Miami FL', 'Dallas TX', 'Atlanta GA', 'Las Vegas NV'],
    outreachTemplateId: 'auto_detailing_outreach',
    qualificationCriteria: {
      minReviews: 5,
      minRating: 4.0,
      hasWebsite: true,
      hasPhone: true,
    },
  },
  pet_services: {
    id: 'pet_services',
    name: 'Pet Services',
    icon: 'Dog',
    keywords: ['dog grooming', 'pet grooming', 'dog walker', 'pet sitting', 'dog training'],
    googleMapsCategories: ['Pet groomer', 'Dog walker', 'Pet sitter'],
    yelpCategories: ['Pet Groomers', 'Dog Walkers', 'Pet Sitting'],
    avgLeadsPerSearch: 1100,
    searchLocations: ['San Francisco CA', 'Portland OR', 'Austin TX', 'Denver CO', 'Seattle WA'],
    outreachTemplateId: 'pet_services_outreach',
    qualificationCriteria: {
      minReviews: 5,
      minRating: 4.0,
      hasWebsite: false,
      hasPhone: true,
    },
  },
  real_estate: {
    id: 'real_estate',
    name: 'Real Estate Agents',
    icon: 'Building2',
    keywords: ['real estate agent', 'realtor', 'real estate broker', 'listing agent', 'buyer agent'],
    googleMapsCategories: ['Real estate agent', 'Real estate agency'],
    yelpCategories: ['Real Estate Agents'],
    avgLeadsPerSearch: 4500,
    searchLocations: ['Dallas TX', 'Miami FL', 'Phoenix AZ', 'Atlanta GA', 'Charlotte NC'],
    outreachTemplateId: 'real_estate_outreach',
    qualificationCriteria: {
      minReviews: 10,
      minRating: 4.0,
      hasWebsite: true,
      hasPhone: true,
    },
  },
};

// GET /api/industries — list all industry presets
router.get('/', (req, res) => {
  const list = Object.values(industryPresets).map(p => ({
    id: p.id,
    name: p.name,
    icon: p.icon,
    avgLeadsPerSearch: p.avgLeadsPerSearch,
    keywordCount: p.keywords.length,
    locationCount: p.searchLocations.length,
  }));
  res.json({ industries: list, total: list.length });
});

// GET /api/industries/:id — get full preset details
router.get('/:id', (req, res) => {
  const preset = industryPresets[req.params.id];
  if (!preset) {
    return res.status(404).json({ error: `Industry preset '${req.params.id}' not found` });
  }
  res.json(preset);
});

// GET /api/industries/:id/search-config — get ready-to-use scrape config
router.get('/:id/search-config', (req, res) => {
  const preset = industryPresets[req.params.id];
  if (!preset) {
    return res.status(404).json({ error: `Industry preset '${req.params.id}' not found` });
  }

  const location = req.query.location || preset.searchLocations[0];
  const config = {
    keywords: preset.keywords,
    location,
    categories: preset.googleMapsCategories,
    qualificationCriteria: preset.qualificationCriteria,
    outreachTemplateId: preset.outreachTemplateId,
    estimatedLeads: preset.avgLeadsPerSearch,
  };

  res.json(config);
});

export default router;
