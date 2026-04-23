const https = require('https');
 
const GENDERIZE_URL = 'https://api.genderize.io';
const AGIFY_URL = 'https://api.agify.io';
const NATIONALIZE_URL = 'https://api.nationalize.io';
 

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (err) { reject(new Error('Failed to parse API response')); }
      });
    }).on('error', (err) => reject(err));
  });
}
 

async function fetchAllAPIs(name) {
  const encodedName = encodeURIComponent(name);
 
  const [genderData, ageData, nationData] = await Promise.all([
    httpsGet(`${GENDERIZE_URL}?name=${encodedName}`),
    httpsGet(`${AGIFY_URL}?name=${encodedName}`),
    httpsGet(`${NATIONALIZE_URL}?name=${encodedName}`),
  ]);
 
  return { genderData, ageData, nationData };
}
 
module.exports = { fetchAllAPIs };