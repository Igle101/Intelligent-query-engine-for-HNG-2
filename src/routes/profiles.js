const express = require('express');
const router = express.Router();
const { v7: uuidv7 } = require('uuid');

const Profile = require('../models/schema');
const { fetchAllAPIs } = require('../services/externalAPIs');
const { validateNameBody, validateQueryParams } = require('../utils/validation');
const { buildFilter, buildSort, buildPagination } = require('../utils/queryBuilder');
const { parseNLQuery } = require('../utils/notationPasser');

// ── Helpers ───────────────────────────────────────────────────────────────────
function getAgeGroup(age) {
  if (age >= 0 && age <= 12) return 'child';
  if (age >= 13 && age <= 19) return 'teenager';
  if (age >= 20 && age <= 59) return 'adult';
  if (age >= 60) return 'senior';


}



function getTopCountry(countries) {
  if (!countries || countries.length === 0) return null;
  return countries.reduce((top, cur) => cur.probability > top.probability ? cur : top);
}

// ─── GET /api/profiles/search — Natural Language Query ────────────────────────
// IMPORTANT: This route MUST be defined before /:id or Express will treat
// "search" as an id parameter
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required query parameter: q',
      });
    }

    const { filters, interpreted } = parseNLQuery(q);

    if (!interpreted || !filters) {
      return res.status(400).json({
        status: 'error',
        message: 'Unable to interpret query',
      });
    }

    // Convert parsed NLP filters to MongoDB filter
    const mongoFilter = {};
    if (filters.gender) mongoFilter.gender = filters.gender;
    if (filters.age_group) mongoFilter.age_group = filters.age_group;
    if (filters.country_id) mongoFilter.country_id = filters.country_id;
    if (filters.min_age !== undefined || filters.max_age !== undefined) {
      mongoFilter.age = {};
      if (filters.min_age !== undefined) mongoFilter.age.$gte = filters.min_age;
      if (filters.max_age !== undefined) mongoFilter.age.$lte = filters.max_age;
    }

   
   
    const { page, limit, skip } = buildPagination(req.query);
    
    const total = await Profile.countDocuments(mongoFilter);
    const totalPages = Math.ceil(total / limit);
    const profiles = await Profile.find(mongoFilter)
      .sort({ created_at: 1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      status: 'success',
      page,
      limit,
      total,
      total_pages: totalPages,
      data: profiles.map(p => p.toJSON()),
    });

  } catch (err) {
    console.error('GET /search error:', err.message);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'Internal server error',
    });
  }
});

// ─── POST /api/profiles — Create a profile ────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    // Validate input
    const validationError = validateNameBody(name);
    if (validationError) {
      return res.status(validationError.statusCode).json({
        status: 'error',
        message: validationError.message,
      });
    }

    const cleanName = name.trim().toLowerCase();

    // Idempotency — return existing profile if name already stored
    const existing = await Profile.findOne({ name: cleanName });
    if (existing) {
      return res.status(200).json({
        status: 'success',
        message: 'Profile already exists',
        data: existing.toJSON(),
      });
    }

    // Call all 3 external APIs
    let genderData, ageData, nationData;
    try {
      const result = await fetchAllAPIs(cleanName);
      genderData = result.genderData;
      ageData = result.ageData;
      nationData = result.nationData;
    } catch (err) {
      return res.status(502).json({
        status: 'error',
        message: `${err.message} returned an invalid response`,
      });
    }

    // Validate each API response
    if (!genderData.gender || genderData.count === 0) {
      return res.status(502).json({
        status: 'error',
        message: 'Genderize returned an invalid response',
      });

    }


    if (!ageData.age) {
      return res.status(502).json({
        status: 'error',
        message: 'Agify returned an invalid response',
      });
    }

    const topCountry = getTopCountry(nationData.country);
    if (!topCountry) {
      return res.status(502).json({
        status: 'error',
        message: 'Nationalize returned an invalid response',
      });
    }

    // Save to database
    const profile = new Profile({
      _id: uuidv7(),
      name: cleanName,
      gender: genderData.gender,
      gender_probability: genderData.probability,
      sample_size: genderData.count,
      age: ageData.age,
      age_group: getAgeGroup(ageData.age),
      country_id: topCountry.country_id,
      country_name: topCountry.country_id,
      country_probability: topCountry.probability,
      created_at: new Date(),
    });

    await profile.save();

    return res.status(201).json({
      status: 'success',
      data: profile.toJSON(),
    });

  } catch (err) {
    console.error('POST /api/profiles error:', err.message);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'Internal server error',
    });
  }
});

// ─── GET /api/profiles — List with filtering, sorting, pagination ─────────────
router.get('/', async (req, res) => {
  try {
    const validationError = validateQueryParams(req.query);
    if (validationError) {
      return res.status(validationError.statusCode).json({
        status: 'error',
        message: validationError.message,
      });
    }

    const filter = buildFilter(req.query);
    const sort = buildSort(req.query);
    const { page, limit, skip } = buildPagination(req.query);

    const total = await Profile.countDocuments(filter);
    const profiles = await Profile.find(filter).sort(sort).skip(skip).limit(limit);
    const totalPages = Math.ceil(total / limit);

return res.status(200).json({
  status: 'success',
  page,
  limit,
  total,
  total_pages: totalPages,   // ← add this line
  data: profiles.map(p => p.toJSON()),
});

  } catch (err) {
    console.error('GET /api/profiles error:', err.message);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'Internal server error',
    });
  }
});

// ─── GET /api/profiles/:id — Get single profile ───────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: profile.toJSON(),
    });

  } catch (err) {
    console.error('GET /api/profiles/:id error:', err.message);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'Internal server error',
    });
  }
});

// ─── DELETE /api/profiles/:id — Delete a profile ─────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const profile = await Profile.findByIdAndDelete(req.params.id);

    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found',
      });
    }

    return res.status(204).send();

  } catch (err) {
    console.error('DELETE /api/profiles/:id error:', err.message);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'Internal server error',
    });
  }
});

module.exports = router;