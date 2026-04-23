require('dotenv').config();
console.log('MONGO URI:', process.env.MONGODB_URI ? 'loaded' : 'NOT FOUND');
 
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const profilesRouter = require('./routes/profiles');
 
const app = express();
 

app.use(cors());
app.use(express.json());
 

app.use('/api/profiles', profilesRouter);
 

app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});
 

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err.message);
  res.status(500).json({ status: 'error', message: err.message || 'Internal server error' });
});
 

const PORT = process.env.PORT || 3000;
 
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Profiles:  http://localhost:${PORT}/api/profiles`);
    console.log(`Search:    http://localhost:${PORT}/api/profiles/search?q=young males from nigeria`);
  });
});
 
module.exports = app;