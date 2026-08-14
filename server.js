/**
 * Mufina's Artistry - Main Express & MongoDB Server
 * Modularized Architecture
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

const connectDB = require('./server/config/db');

// Import Mongoose Models
const OwnerUser = require('./server/models/OwnerUser');
const GalleryPhoto = require('./server/models/GalleryPhoto');
const ServiceCard = require('./server/models/ServiceCard');
const PriceEntry = require('./server/models/PriceEntry');

// Import Express Routes
const galleryRoutes = require('./server/routes/galleryRoutes');
const serviceRoutes = require('./server/routes/serviceRoutes');
const pricingRoutes = require('./server/routes/pricingRoutes');
const bookingRoutes = require('./server/routes/bookingRoutes');
const ownerRoutes = require('./server/routes/ownerRoutes');

const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 8080;

// Enable Helmet Security Headers & CORS
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve static frontend files from current directory
app.use(express.static(path.join(__dirname)));

// Connect MongoDB Atlas
connectDB().then(() => {
  seedDatabaseIfNeeded();
});

// Seed Initial Data if Collections are Empty
async function seedDatabaseIfNeeded() {
  try {
    const ownerCount = await OwnerUser.countDocuments();
    if (ownerCount === 0) {
      await OwnerUser.create({ username: 'mufina', password: 'Mufina@123' });
      console.log('🌱 Seeded default Owner credentials (User ID: mufina)');
    }

    const photoCount = await GalleryPhoto.countDocuments();
    if (photoCount === 0) {
      const defaultPhotos = [
        { id: 'client_henna1', src: 'images/client_henna1.jpg', title: 'Back-Hand Floral Vine', category: 'client' },
        { id: 'client_henna2', src: 'images/client_henna2.jpg', title: 'Both Palms Henna Artwork', category: 'client' },
        { id: 'client_henna3', src: 'images/client_henna3.jpg', title: 'Full Forearms & Mandala Palms', category: 'client' },
        { id: 'client_henna4', src: 'images/client_henna4.jpg', title: 'Royal Both Arms Bridal Mehendi', category: 'client' },
        { id: 'client_henna5', src: 'images/client_henna5.jpg', title: 'Rose & Leaves Finger Vine', category: 'client' },
        { id: 'henna1', src: 'images/henna1.jpg', title: 'Traditional Bridal Mehendi', category: 'bridal' },
        { id: 'henna2', src: 'images/henna2.jpg', title: 'Arabic Flowing Pattern', category: 'henna' },
        { id: 'henna3', src: 'images/henna3.jpg', title: 'Bridal Foot Artwork', category: 'bridal' },
        { id: 'henna4', src: 'images/henna4.jpg', title: 'Fresh Homemade Cones', category: 'henna' },
        { id: 'henna5', src: 'images/henna5.jpg', title: 'Kanjeevaram Saree Pleating', category: 'saree' },
        { id: 'makeup1', src: 'images/makeup1.jpg', title: 'Classic Bridal Makeover', category: 'makeup' },
        { id: 'makeup2', src: 'images/makeup2.jpg', title: 'Soft Glam Guest Look', category: 'makeup' },
        { id: 'makeup3', src: 'images/makeup3.jpg', title: 'HD Airbrush Radiant Look', category: 'makeup' }
      ];
      await GalleryPhoto.insertMany(defaultPhotos);
      console.log('🌱 Seeded default Gallery Photos into MongoDB Atlas');
    }

    const serviceCount = await ServiceCard.countDocuments();
    if (serviceCount === 0) {
      const defaultServices = [
        { serviceId: 'saree_pleating', title: 'Saree Pre-Pleating & Draping', category: 'saree', price: '₹200', desc: 'Professional box pleating, iron pressing, and pin setting for your silk sarees. Allows instant 2-minute draping.', img: 'images/henna5.jpg', badge: 'Popular' },
        { serviceId: 'henna_cone', title: 'Homemade Natural Cone', category: 'henna', price: '₹25', desc: 'Freshly prepared organic henna cones made with triple-sifted Sojat henna powder & eucalyptus oil. 100% chemical free.', img: 'images/henna4.jpg', badge: '100% Organic' },
        { serviceId: 'full_hand_mehendi', title: 'Two Full Hand Mehendi', category: 'henna', price: '₹2,000', desc: 'Intricate front and back full hand henna design reaching up to the forearm.', img: 'images/client_henna4.jpg', badge: 'Real Client Work' },
        { serviceId: 'hands_feet_package', title: 'Hands & Feet Mehendi Package', category: 'henna', price: '₹2,500', desc: 'Full arm traditional or Arabic henna design paired with intricate matching feet mehendi artwork.', img: 'images/client_henna3.jpg', badge: 'Bridal Favorite' },
        { serviceId: 'palm_hand', title: 'Palm Hand Henna Design', category: 'henna', price: '₹100', desc: 'Simple, fast, and elegant Arabic pattern applied on the palm area. Ideal for guests and kids.', img: 'images/client_henna2.jpg', badge: 'Real Client Work' },
        { serviceId: 'party_makeup', title: 'Basic / Party Guest Glam', category: 'makeup', price: '₹2,000 – ₹8,000', desc: 'Subtle, radiant, and lightweight event makeup with eye enhancement, blush, and lip shade.', img: 'images/makeup2.jpg' },
        { serviceId: 'traditional_bridal_makeup', title: 'Classic Traditional Bridal', category: 'makeup', price: '₹8,000 – ₹15,000', desc: 'Timeless traditional Indian bridal makeup look including lash application, saree draping, hair styling.', img: 'images/makeup1.jpg' },
        { serviceId: 'hd_bridal_makeup', title: 'HD Bridal Makeup', category: 'makeup', price: '₹15,000 – ₹30,000', desc: 'High-definition camera-ready bridal makeup designed for 4K photography. Fresh finish up to 16 hours.', img: 'images/makeup3.jpg', badge: 'High Definition' },
        { serviceId: 'airbrush_bridal_makeup', title: 'Airbrush Luxury Makeup', category: 'makeup', price: '₹20,000 – ₹45,000', desc: 'Ultra-lightweight, sweatproof, and smudge-resistant airbrush foundation technology.', img: 'images/makeup1.jpg', badge: 'Luxury' }
      ];
      await ServiceCard.insertMany(defaultServices);
      console.log('🌱 Seeded default Service Cards into MongoDB Atlas');
    }

    const priceCount = await PriceEntry.countDocuments();
    if (priceCount === 0) {
      const defaultPricing = [
        { priceId: 'price_saree_pleating', title: 'Saree Pre-Pleating & Draping', category: 'saree', amount: '₹200' },
        { priceId: 'price_henna_cone', title: 'Homemade Organic Henna Cone', category: 'henna', amount: '₹25 / cone' },
        { priceId: 'price_palm_hand', title: 'Palm Hand Mehendi', category: 'henna', amount: '₹100' },
        { priceId: 'price_full_hand', title: 'Two Full Hand Mehendi Cone', category: 'henna', amount: '₹2,000' },
        { priceId: 'price_hands_feet', title: 'Hands & Feet Bridal Mehendi', category: 'henna', amount: '₹2,500' },
        { priceId: 'price_basic_makeup', title: 'Basic / Regular Party Makeup', category: 'makeup', amount: '₹2,000 – ₹8,000' },
        { priceId: 'price_party_glam', title: 'Party / Guest Glam Look', category: 'makeup', amount: '₹3,000 – ₹15,000' },
        { priceId: 'price_bridal_makeup', title: 'Classic / Traditional Bridal Makeup', category: 'makeup', amount: '₹8,000 – ₹15,000' },
        { priceId: 'price_hd_makeup', title: 'HD Bridal Makeup', category: 'makeup', amount: '₹15,000 – ₹30,000' },
        { priceId: 'price_airbrush_makeup', title: 'Airbrush Luxury Makeup', category: 'makeup', amount: '₹20,000 – ₹45,000' }
      ];
      await PriceEntry.insertMany(defaultPricing);
      console.log('🌱 Seeded default Pricing Entries into MongoDB Atlas');
    }
  } catch (err) {
    console.error('Error seeding initial data:', err);
  }
}

// API Routes
app.use('/api/gallery', galleryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/owner', ownerRoutes);

// Catch-all route to serve single page app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Express Server only when executed directly (not when imported as a serverless function)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

module.exports = { app };
