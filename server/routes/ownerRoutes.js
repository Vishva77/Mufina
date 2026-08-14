const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const OwnerUser = require('../models/OwnerUser');
const GalleryPhoto = require('../models/GalleryPhoto');
const ServiceCard = require('../models/ServiceCard');
const PriceEntry = require('../models/PriceEntry');
const verifyOwnerToken = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'mufina_artistry_owner_secure_jwt_secret_key_2026_x89a';

// Brute-force Login Rate Limiter (Max 5 login attempts per 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    error: 'Too many failed login attempts from this IP. Security lock active. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// POST Owner Login Authentication with JWT & Bcrypt Support
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'User ID and Password are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const owner = await OwnerUser.findOne({ username: cleanUsername });

    let isMatch = false;

    if (owner) {
      if (owner.password.startsWith('$2a$') || owner.password.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(password, owner.password);
      } else {
        isMatch = owner.password === password;
      }
    } else if (cleanUsername === 'mufina' && password === 'Mufina@123') {
      isMatch = true;
    }

    if (isMatch) {
      // Generate signed JWT Security Token (expires in 24 hours)
      const token = jwt.sign(
        { username: 'mufina', role: 'owner', loginTime: new Date() },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        message: 'Owner security authentication successful',
        token: token,
        expiresIn: '24h'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Security verification failed: Invalid Owner User ID or Password.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Server authentication error: ' + err.message });
  }
});

// POST Reset Database to Initial Factory Defaults (Protected by verifyOwnerToken)
router.post('/reset', verifyOwnerToken, async (req, res) => {
  try {
    await GalleryPhoto.deleteMany({});
    await ServiceCard.deleteMany({});
    await PriceEntry.deleteMany({});

    // Seed default photos
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

    // Seed default services
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

    // Seed default pricing
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

    res.json({ success: true, message: 'Database reset to default settings' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
