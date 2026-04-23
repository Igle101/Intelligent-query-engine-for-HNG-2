const COUNTRY_MAP = {
  'nigeria': 'NG', 'nigerian': 'NG',
  'kenya': 'KE', 'kenyan': 'KE',
  'ghana': 'GH', 'ghanaian': 'GH',
  'ethiopia': 'ET', 'ethiopian': 'ET',
  'tanzania': 'TZ', 'tanzanian': 'TZ',
  'uganda': 'UG', 'ugandan': 'UG',
  'south africa': 'ZA', 'south african': 'ZA',
  'egypt': 'EG', 'egyptian': 'EG',
  'morocco': 'MA', 'moroccan': 'MA',
  'senegal': 'SN', 'senegalese': 'SN',
  'cameroon': 'CM', 'cameroonian': 'CM',
  'angola': 'AO', 'angolan': 'AO',
  'mozambique': 'MZ', 'mozambican': 'MZ',
  'zambia': 'ZM', 'zambian': 'ZM',
  'zimbabwe': 'ZW', 'zimbabwean': 'ZW',
  'mali': 'ML', 'malian': 'ML',
  'rwanda': 'RW', 'rwandan': 'RW',
  'benin': 'BJ', 'beninese': 'BJ',
  'togo': 'TG', 'togolese': 'TG',
  'guinea': 'GN', 'guinean': 'GN',
  'somalia': 'SO', 'somali': 'SO',
  'sudan': 'SD', 'sudanese': 'SD',
  'niger': 'NE', 'nigerien': 'NE',
  'malawi': 'MW', 'malawian': 'MW',
  'madagascar': 'MG', 'malagasy': 'MG',
  'botswana': 'BW', 'botswanan': 'BW',
  'namibia': 'NA', 'namibian': 'NA',
  'ivory coast': 'CI', "cote d'ivoire": 'CI', 'ivorian': 'CI',
  'dr congo': 'CD', 'congo': 'CD', 'congolese': 'CD',
  'gabon': 'GA', 'gabonese': 'GA',
  'liberia': 'LR', 'liberian': 'LR',
  'sierra leone': 'SL',
  'algeria': 'DZ', 'algerian': 'DZ',
  'tunisia': 'TN', 'tunisian': 'TN',
  'libya': 'LY', 'libyan': 'LY',
  'eritrea': 'ER', 'eritrean': 'ER',
  'djibouti': 'DJ', 'djiboutian': 'DJ',
  'chad': 'TD', 'chadian': 'TD',
  'burkina faso': 'BF',
  'india': 'IN', 'indian': 'IN',
  'france': 'FR', 'french': 'FR',
  'united kingdom': 'GB', 'uk': 'GB', 'british': 'GB',
  'united states': 'US', 'usa': 'US', 'american': 'US',
  'germany': 'DE', 'german': 'DE',
  'china': 'CN', 'chinese': 'CN',
  'brazil': 'BR', 'brazilian': 'BR',
  'canada': 'CA', 'canadian': 'CA',
  'australia': 'AU', 'australian': 'AU',
  'japan': 'JP', 'japanese': 'JP',
};
 function parseNLQuery(q) {
  if (!q || typeof q !== 'string' || q.trim() === '') {
    return { filters: null, interpreted: false };
  }
 
  const lower = q.toLowerCase().trim();
  const filters = {};
  let matched = false;
 
  // gender
  const hasMale = /\b(male|males|man|men)\b/.test(lower);
  const hasFemale = /\b(female|females|woman|women|girl|girls)\b/.test(lower);
 
  if (hasMale && !hasFemale) {
    filters.gender = 'male';
    matched = true;
  } else if (hasFemale && !hasMale) {
    filters.gender = 'female';
    matched = true;
  }
  // if both present = no gender filter (e.g. "male and female")
 
  // ── Age group keywords ────────────────────────────────────────────────────
  if (/\b(child|children|kid|kids)\b/.test(lower)) {
    filters.age_group = 'child';
    matched = true;
  } else if (/\b(teen|teens|teenager|teenagers|adolescent)\b/.test(lower)) {
    filters.age_group = 'teenager';
    matched = true;
  } else if (/\b(senior|seniors|elderly|aged)\b/.test(lower)) {
    filters.age_group = 'senior';
    matched = true;
  } else if (/\b(adult|adults)\b/.test(lower)) {
    filters.age_group = 'adult';
    matched = true;
  }
 
  // ── "young" = ages 16–24 per spec ────────────────────────────────────────
  if (/\byoung\b/.test(lower)) {
    filters.min_age = 16;
    filters.max_age = 24;
    matched = true;
  }
 
  // ── "above/over/older than X" ─────────────────────────────────────────────
  const aboveMatch = lower.match(/\b(?:above|over|older than|greater than|more than)\s+(\d+)\b/);
  if (aboveMatch) {
    filters.min_age = parseInt(aboveMatch[1]);
    matched = true;
  }
 
  // ── "below/under/younger than X" ─────────────────────────────────────────
  const belowMatch = lower.match(/\b(?:below|under|younger than|less than)\s+(\d+)\b/);
  if (belowMatch) {
    filters.max_age = parseInt(belowMatch[1]);
    matched = true;
  }
 
  // ── "between X and Y" ────────────────────────────────────────────────────
  const betweenMatch = lower.match(/\bbetween\s+(\d+)\s+and\s+(\d+)\b/);
  if (betweenMatch) {
    filters.min_age = parseInt(betweenMatch[1]);
    filters.max_age = parseInt(betweenMatch[2]);
    matched = true;
  }
 
  // ── Country detection ─────────────────────────────────────────────────────
  // Check multi-word countries first (e.g. "south africa")
  let countryFound = false;
  for (const [countryName, code] of Object.entries(COUNTRY_MAP)) {
    if (countryName.includes(' ') && lower.includes(countryName)) {
      filters.country_id = code;
      countryFound = true;
      matched = true;
      break;
    }
  }
 
  // Then check single-word after "from", "in", "of"
  if (!countryFound) {
    const fromMatch = lower.match(/\b(?:from|in|of)\s+([a-z]+(?:\s+[a-z]+)?)\b/);
    if (fromMatch) {
      const place = fromMatch[1].trim();
      if (COUNTRY_MAP[place]) {
        filters.country_id = COUNTRY_MAP[place];
        matched = true;
      }
    }
  }
 
  if (!matched) {
    return { filters: null, interpreted: false };
  }
 
  return { filters, interpreted: true };
}
 
module.exports = { parseNLQuery };
 