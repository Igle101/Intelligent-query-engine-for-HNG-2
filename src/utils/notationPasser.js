// src/utils/notationPasser.js

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

  // ── Gender (FIXED: using strings, not variables) ──────────────────────────
  const hasMale = /\b(male|males|man|men|boys|boy)\b/.test(lower);
  const hasFemale = /\b(female|females|woman|women|girl|girls)\b/.test(lower);
  const bothGenders = hasMale && hasFemale;

  if (!bothGenders) {
    if (hasMale) {
      filters.gender = 'male';
      matched = true;
    } else if (hasFemale) {
      filters.gender = 'female';
      matched = true;
    }
  } else {
    // Both genders mentioned - no gender filter, but query is valid
    matched = true;
  }

  // ── Age group keywords ────────────────────────────────────────────────────
  if (/\b(teen|teens|teenager|teenagers|adolescent|adolescents)\b/.test(lower)) {
    filters.age_group = 'teenager';
    matched = true;
    
  } else if (/\b(adult|adults)\b/.test(lower)) {
    filters.age_group = 'adult';
    matched = true;
  } else if (/\b(child|children|kid|kids)\b/.test(lower)) {
    filters.age_group = 'child';
    matched = true;
  } else if (/\b(senior|seniors|elderly|old)\b/.test(lower)) {
    filters.age_group = 'senior';
    matched = true;
  }

  // ── "young" keyword (specifically for "young males" test) ─────────────────
  if (lower.includes('young')) {
    filters.min_age = 16;
    filters.max_age = 24;
    matched = true;
  }

  // ── "above/over X" ────────────────────────────────────────────────────────
  const aboveMatch = lower.match(/\b(?:above|over|older\s+than)\s+(\d+)\b/);
  if (aboveMatch) {
    filters.min_age = parseInt(aboveMatch[1]);
    matched = true;
  }

  // ── Country detection (with "from" keyword priority) ──────────────────────
  // Look for "from X" pattern first
  const fromMatch = lower.match(/\bfrom\s+([a-z]+(?:\s+[a-z]+)?)\b/);
  if (fromMatch) {
    const countryName = fromMatch[1].trim();
    if (COUNTRY_MAP[countryName]) {
      filters.country_id = COUNTRY_MAP[countryName];
      matched = true;

    }
  }

  // If no country found yet, check each word
  if (!filters.country_id) {
    const words = lower.split(/\s+/);
    for (const word of words) {
      if (COUNTRY_MAP[word]) {
        filters.country_id = COUNTRY_MAP[word];
        matched = true;
        break;
      }
    }
  }

  // If still nothing matched, return uninterpreted
  if (!matched) {
    return { filters: null, interpreted: false };
  }

  return { filters, interpreted: true };
}

module.exports = { parseNLQuery };