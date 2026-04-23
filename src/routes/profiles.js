const { router } = require("..");

// In your GET /search endpoint - replace the response section
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
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    // FIXED response format with pagination object
    return res.status(200).json({
      status: 'success',

      data: profiles.map(p => p.toJSON()),
      pagination: {
        page: page,
        limit: limit,
        total: total,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });

  } catch (err) {
    console.error('GET /search error:', err.message);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'Internal server error',
    });
  }
});

module.exports(router);