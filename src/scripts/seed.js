require('dotenv').config();
const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');
const path = require('path');
 
const Profile = require('../models/Profile');
 
async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('Connected to MongoDB');
 
    // Load seed file from project root
    const seedData = require(path.join(__dirname, '../../seed_profiles.json'));
    const profiles = seedData.profiles;
    console.log(`Found ${profiles.length} profiles to seed...`);
 
    let inserted = 0;
    let skipped = 0;
 
    for (const profile of profiles) {
      const cleanName = profile.name.trim().toLowerCase();
 
      // Skip if already exists — prevents duplicates on re-run
      const exists = await Profile.findOne({ name: cleanName });
      if (exists) {
        skipped++;
        continue;
      }
 
      await Profile.create({
        _id: uuidv7(),
        name: cleanName,
        gender: profile.gender,
        gender_probability: profile.gender_probability,
        sample_size: null,
        age: profile.age,
        age_group: profile.age_group,
        country_id: profile.country_id,
        country_name: profile.country_name,
        country_probability: profile.country_probability,
        created_at: new Date(),
      });
 
      inserted++;
 
      // Log progress every 200 records
      if ((inserted + skipped) % 200 === 0) {
        console.log(`Progress: ${inserted + skipped}/${profiles.length}`);
      }
    }
 
    console.log(`\nSeed complete!`);
    console.log(`Inserted: ${inserted}`);
    console.log(`Skipped (already existed): ${skipped}`);
    process.exit(0);
 
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}
 
seed();