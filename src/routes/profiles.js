const express = require('express');
const router = express.Router();
const { v7: uuidv7 } = require('uuid');

const Profile = require('../models/schema');
const { fetchAllAPIs } = require('../services/externalAPIs');
const { validateNameBody, validateQueryParams } = require('../utils/validation');
const { buildFilter, buildSort, buildPagination } = require('../utils/queryBuilder');
const { parseNLQuery } = require('../utils/notationPasser');

// ─── AGE GROUP ─────────────────────────────
function getAgeGroup(age) {
  if (age >= 0 && age <= 12) return 'child';
  if (age >= 13 && age <= 19) return 'teenager';
  if (age >= 20 && age <= 59) return 'adult';
  if (age >= 60) return 'senior';
  return null;
}

// ─── TOP COUNTRY ───────────────────────────
function getTopCountry(countries) {
  if (!countries || countries.length === 0) return null;
  return countries.reduce((top, cur) =>
    cur.probability > top.probability ? cur : top
  );
}

// ─── SEARCH (NATURAL LANGUAGE) ─────────────
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required query parameter: q',
      });
    }

    const { filters } = parseNLQuery(q);

    // IMPORTANT FIX: do NOT reject partial interpretation
    if (!filters) {
      return res.status(400).json({
        status: 'error',
        message: 'Unable to interpret query',
      });
    }

    const mongoFilter = buildFilter(filters);
    const sort = buildSort(req.query);
    const { page, limit, skip } = buildPagination(req.query);

    const total = await Profile.countDocuments(mongoFilter);
    const profiles = await Profile.find(mongoFilter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      status: 'success',
      data: profiles.map(p => p.toJSON()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (err) {
    console.error('GET /search error:', err.message);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'Internal server error',
    });
  }
});

// ─── CREATE PROFILE ─────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    const validationError = validateNameBody(name);
    if (validationError) {
      return res.status(validationError.statusCode).json({
        status: 'error',
        message: validationError.message,
      });
    }

    const cleanName = name.trim().toLowerCase();

    const existing = await Profile.findOne({ name: cleanName });
    if (existing) {
      return res.status(200).json({
        status: 'success',
        message: 'Profile already exists',
        data: existing.toJSON(),
      });
    }

    const { genderData, ageData, nationData } = await fetchAllAPIs(cleanName);

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

// ─── GET ALL PROFILES ───────────────────────
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
    const profiles = await Profile.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      status: 'success',
      data: profiles.map(p => p.toJSON()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (err) {
    console.error('GET /api/profiles error:', err.message);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'Internal server error',
    });
  }
});

// ─── GET BY ID ──────────────────────────────
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

// ─── DELETE PROFILE ─────────────────────────
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