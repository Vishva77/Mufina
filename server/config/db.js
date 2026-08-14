/**
 * MongoDB Atlas Connection Configuration
 */
const mongoose = require('mongoose');
const dns = require('dns');

// Public DNS configuration for reliable SRV resolution on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  console.warn('DNS server configuration warning:', e.message);
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://vikkivishva77_db_user:Vish%40123@webapp.pgdgv0r.mongodb.net/mufina_artistry?retryWrites=true&w=majority&appName=webapp';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log('✅ Successfully connected to MongoDB Atlas (mufina_artistry)');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
  }
};

module.exports = connectDB;
