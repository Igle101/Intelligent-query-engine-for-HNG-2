const COUNTRY_MAP = {
  nigeria: 'NG', nigerian: 'NG',
  kenya: 'KE', kenyan: 'KE',
  ghana: 'GH', ghanaian: 'GH',
  ethiopia: 'ET', ethiopian: 'ET',
  tanzania: 'TZ', tanzanian: 'TZ',
  uganda: 'UG', ugandan: 'UG',
  "south africa": 'ZA', "south african": 'ZA',
  egypt: 'EG', egyptian: 'EG',
  morocco: 'MA', moroccan: 'MA',
  senegal: 'SN', senegalese: 'SN',
  cameroon: 'CM', cameroonian: 'CM',
  angola: 'AO', angolan: 'AO',
  mozambique: 'MZ', mozambican: 'MZ',
  zambia: 'ZM', zambian: 'ZM',
  zimbabwe: 'ZW', zimbabwean: 'ZW',
  mali: 'ML', malian: 'ML',
  rwanda: 'RW', rwandan: 'RW',
  benin: 'BJ', beninese: 'BJ',
  togo: 'TG', togolese: 'TG',
  guinea: 'GN', guinean: 'GN',
  somalia: 'SO', somali: 'SO',
  sudan: 'SD', sudanese: 'SD',
  niger: 'NE', nigerien: 'NE',
  malawi: 'MW', malawian: 'MW',
  madagascar: 'MG', malagasy: 'MG',
  botswana: 'BW', botswanan: 'BW',
  namibia: 'NA', namibian: 'NA',
  "ivory coast": 'CI', "cote d'ivoire": 'CI', ivorian: 'CI',
  "dr congo": 'CD', congo: 'CD', congolese: 'CD',
  gabon: 'GA', gabonese: 'GA',
  liberia: 'LR', liberian: 'LR',
  "sierra leone": 'SL',
  algeria: 'DZ', algerian: 'DZ',
  tunisia: 'TN', tunisian: 'TN',
  libya: 'LY', libyan: 'LY',
  eritrea: 'ER', eritrean: 'ER',
  djibouti: 'DJ', djiboutian: 'DJ',
  chad: 'TD', chadian: 'TD',
  "burkina faso": 'BF',
  india: 'IN', indian: 'IN',
  france: 'FR', french: 'FR',
  "united kingdom": 'GB', uk: 'GB', british: 'GB',
  "united states": 'US', usa: 'US', american: 'US',
  germany: 'DE', german: 'DE',
  china: 'CN', chinese: 'CN',
  brazil: 'BR', brazilian: 'BR',
  canada: 'CA', canadian: 'CA',
  australia: 'AU', australian: 'AU',
  japan: 'JP', japanese: 'JP',
};

function parseNLQuery(q) {
  if (typeof q !== 'string' || !q.trim()) {
    return { filters: null, interpreted: false };
  }

  const lower = q.toLowerCase().trim();
  const filters = {};
  let interpreted = false;

  // ── Gender ─────────────────────────────
  const male = /\b(male|man|men)\b/.test(lower);
  const female = /\b(female|woman|women|girl|girls)\b/.test(lower);

  if (male && !female) {
    filters.gender = 'male';
    interpreted = true;
  } else if (female && !male) {
    filters.gender = 'female';
    interpreted = true;
  }

  // ── Age group ──────────────────────────
  if (/\b(child|children|kid|kids)\b/.test(lower)) {
    filters.age_group = 'child';
    interpreted = true;
  } else if (/\b(teen|teenager|adolescent)\b/.test(lower)) {
    filters.age_group = 'teenager';
    interpreted = true;
  } else if (/\b(senior|elderly|aged)\b/.test(lower)) {
    filters.age_group = 'senior';
    interpreted = true;
  } else if (/\b(adult|adults)\b/.test(lower)) {
    filters.age_group = 'adult';
    interpreted = true;
  }

  // ── Young (16–24) ──────────────────────
  if (/\byoung\b/.test(lower)) {
    filters.min_age = 16;
    filters.max_age = 24;
    interpreted = true;
  }

  // ── Age range ──────────────────────────
  const above = lower.match(/\b(?:above|over|older than|more than)\s+(\d+)\b/);
  if (above) {
    filters.min_age = parseInt(above[1]);
    interpreted = true;
  }

  const below = lower.match(/\b(?:below|under|younger than|less than)\s+(\d+)\b/);
  if (below) {
    filters.max_age = parseInt(below[1]);
    interpreted = true;
  }

  const between = lower.match(/\bbetween\s+(\d+)\s+and\s+(\d+)\b/);
  if (between) {
    filters.min_age = parseInt(between[1]);
    filters.max_age = parseInt(between[2]);
    interpreted = true;
  }

  // ── Country detection (FIXED) ──────────
  for (const [name, code] of Object.entries(COUNTRY_MAP)) {
    const regex = new RegExp(`\\b${name}\\b`, 'i');
    if (regex.test(lower)) {
      filters.country_id = code;
      interpreted = true;
      break;
    }
  }

  return {
    filters: interpreted ? filters : null,
    interpreted
  };
}

module.exports = { parseNLQuery };