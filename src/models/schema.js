const mongoose = require('mongoose');
 
 
const profileSchema = new mongoose.Schema({
  _id: { type: String },
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  gender: { type: String },
  gender_probability: { type: Number },
  sample_size: { type: Number },
  age: { type: Number },
  age_group: {
    type: String,
    enum: ['child', 'teenager', 'adult', 'senior'],
  },
  country_id: { type: String },
  country_name: { type: String },
  country_probability: { type: Number },
  created_at: {
    type: Date,
    default: () => new Date(),
  },
});
 


profileSchema.index({
  gender: 1,
  country_id: 1,
  age_group: 1,
  age: 1,
  gender_probability: 1,
  country_probability: 1,
  created_at: 1,



});
 
profileSchema.methods.toJSON = function () {
  const obj = this.toObject();
  return {
    id: obj._id,
    name: obj.name,
    gender: obj.gender,
    gender_probability: obj.gender_probability,
    sample_size: obj.sample_size,
    age: obj.age,
    age_group: obj.age_group,
    country_id: obj.country_id,
    country_name: obj.country_name,
    country_probability: obj.country_probability,
    created_at: obj.created_at.toISOString(),
  };
};
 
const Profile = mongoose.model('Profile', profileSchema);
module.exports = Profile;