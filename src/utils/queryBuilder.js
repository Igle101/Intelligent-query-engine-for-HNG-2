function buildFilter(query) {
  const { gender, country_id, age_group, min_age, max_age, min_gender_probability, min_country_probability } = query;
 
  const filter = {};
 
  if (gender) filter.gender = gender.toLowerCase();
  if (country_id) filter.country_id = country_id.toUpperCase();
  if (age_group) filter.age_group = age_group.toLowerCase();
 
  if (min_age !== undefined || max_age !== undefined) {
    filter.age = {};
    if (min_age !== undefined) filter.age.$gte = Number(min_age);
    if (max_age !== undefined) filter.age.$lte = Number(max_age);
  }
 
  if (min_gender_probability !== undefined) {
    filter.gender_probability = { $gte: Number(min_gender_probability) };
  }
 
  if (min_country_probability !== undefined) {
    filter.country_probability = { $gte: Number(min_country_probability) };
  }
 
  return filter;
}
 
// Builds MongoDB sort object
function buildSort(query) {
  const { sort_by, order } = query;
  if (!sort_by) return { created_at: 1 };
  return { [sort_by]: order === 'desc' ? -1 : 1 };
}
 
// Returns page, limit, skip values
function buildPagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
 
module.exports = { buildFilter, buildSort, buildPagination };