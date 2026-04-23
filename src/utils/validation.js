function validateNameBody(name) {
  if (name === undefined || name === null || (typeof name === 'string' && name.trim() === '')) {
    return { statusCode: 400, message: 'Missing required field: name' };
  }
  if (typeof name !== 'string') {
    return { statusCode: 422, message: 'Invalid field: name must be a string' };
  }
  if (!isNaN(name)) {
    return { statusCode: 422, message: 'Invalid field: name must be a non-numeric string' };
  }
  return null;
}

function validateQueryParams(query) {
  const { min_age, max_age, min_gender_probability, min_country_probability, page, limit, sort_by, order, gender, age_group } = query;

  const validSortFields = ['age', 'created_at', 'gender_probability'];
  const validOrders = ['asc', 'desc'];
  const validAgeGroups = ['child', 'teenager', 'adult', 'senior'];
  const validGenders = ['male', 'female'];

  if (min_age !== undefined && (isNaN(min_age) || Number(min_age) < 0)) {
    return { statusCode: 400, message: 'Invalid query parameters' };
  }
  if (max_age !== undefined && (isNaN(max_age) || Number(max_age) < 0)) {
    return { statusCode: 400, message: 'Invalid query parameters' };
  }
  if (min_gender_probability !== undefined && (isNaN(min_gender_probability) || Number(min_gender_probability) < 0 || Number(min_gender_probability) > 1)) {
    return { statusCode: 400, message: 'Invalid query parameters' };
  }
  if (min_country_probability !== undefined && (isNaN(min_country_probability) || Number(min_country_probability) < 0 || Number(min_country_probability) > 1)) {
    return { statusCode: 400, message: 'Invalid query parameters' };
  }
  if (sort_by !== undefined && !validSortFields.includes(sort_by)) {
    return { statusCode: 400, message: 'Invalid query parameters' };
  }
  if (order !== undefined && !validOrders.includes(order)) {
    return { statusCode: 400, message: 'Invalid query parameters' };
  }
  if (gender !== undefined && !validGenders.includes(gender.toLowerCase())) {
    return { statusCode: 400, message: 'Invalid query parameters' };
  }
  if (age_group !== undefined && !validAgeGroups.includes(age_group.toLowerCase())) {
    return { statusCode: 400, message: 'Invalid query parameters' };
  }
  if (page !== undefined && (isNaN(page) || Number(page) < 1)) {
    return { statusCode: 400, message: 'Invalid query parameters' };
  }
  // limit > 50 is silently capped at 50 in queryBuilder — NOT rejected
  if (limit !== undefined && (isNaN(limit) || Number(limit) < 1)) {
    return { statusCode: 400, message: 'Invalid query parameters' };
  }

  return null;
}


module.exports = { validateNameBody, validateQueryParams };