const express = require('express');
const router = express.Router();
const PriceEntry = require('../models/PriceEntry');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const verifyOwnerToken = require('../middleware/authMiddleware');

// Protect all mutating endpoints (POST, PUT, DELETE) with verifyOwnerToken
router.use(verifyOwnerToken);

// GET all pricing entries
router.get('/', async (req, res) => {
  try {
    const pricing = await PriceEntry.find().sort({ createdAt: 1 });
    res.json(pricing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new pricing entry (CREATE with Cloudinary Upload)
router.post('/', async (req, res) => {
  try {
    const { title, category, amount, imageUrl } = req.body;

    if (!title || !amount) {
      return res.status(400).json({ error: 'Title and amount are required.' });
    }

    let finalImg = imageUrl || '';
    let publicId = '';

    if (imageUrl && (imageUrl.startsWith('data:image') || imageUrl.startsWith('http'))) {
      try {
        const cloudRes = await uploadToCloudinary(imageUrl, 'mufina_pricing');
        finalImg = cloudRes.imageUrl || finalImg;
        publicId = cloudRes.publicId || '';
      } catch (cloudErr) {
        console.warn('Cloudinary upload warning for price entry:', cloudErr.message);
      }
    }

    const newPrice = new PriceEntry({
      priceId: 'price_' + Date.now(),
      title,
      category: category || 'henna',
      amount,
      imageUrl: finalImg,
      publicId,
      lastVersion: null
    });

    await newPrice.save();
    res.status(201).json(newPrice);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create pricing entry: ' + err.message });
  }
});

// PUT update pricing entry (EDIT with 1-Level Backup)
router.put('/:priceId', async (req, res) => {
  try {
    const { title, category, amount, imageUrl } = req.body;
    const priceEntry = await PriceEntry.findOne({ priceId: req.params.priceId });

    if (!priceEntry) {
      return res.status(404).json({ error: 'Pricing entry not found' });
    }

    // Create 1-level backup of current state in lastVersion
    priceEntry.lastVersion = {
      title: priceEntry.title,
      category: priceEntry.category,
      amount: priceEntry.amount,
      imageUrl: priceEntry.imageUrl,
      publicId: priceEntry.publicId,
      changedAt: new Date()
    };

    // Update text fields
    if (title) priceEntry.title = title.trim();
    if (category) priceEntry.category = category;
    if (amount) priceEntry.amount = amount.trim();

    // If new image is provided
    if (imageUrl && imageUrl !== priceEntry.imageUrl && (imageUrl.startsWith('data:image') || imageUrl.startsWith('http'))) {
      try {
        const cloudRes = await uploadToCloudinary(imageUrl, 'mufina_pricing');
        if (cloudRes.imageUrl) {
          priceEntry.imageUrl = cloudRes.imageUrl;
          priceEntry.publicId = cloudRes.publicId;
        }
      } catch (cloudErr) {
        console.warn('Cloudinary upload warning during price edit:', cloudErr.message);
        priceEntry.imageUrl = imageUrl;
      }
    }

    await priceEntry.save();
    res.json(priceEntry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update pricing entry: ' + err.message });
  }
});

// POST Revert Last Change for Pricing Entry
router.post('/:priceId/revert', async (req, res) => {
  try {
    const priceEntry = await PriceEntry.findOne({ priceId: req.params.priceId });

    if (!priceEntry) {
      return res.status(404).json({ error: 'Pricing entry not found' });
    }

    if (!priceEntry.lastVersion) {
      return res.status(400).json({ error: 'No previous version available to revert.' });
    }

    // Delete newly uploaded Cloudinary image if edit changed the image
    if (priceEntry.publicId && priceEntry.publicId !== priceEntry.lastVersion.publicId) {
      try {
        await deleteFromCloudinary(priceEntry.publicId);
      } catch (delErr) {
        console.warn('Cloudinary cleanup warning on pricing revert:', delErr.message);
      }
    }

    // Restore previous state
    priceEntry.title = priceEntry.lastVersion.title;
    priceEntry.category = priceEntry.lastVersion.category;
    priceEntry.amount = priceEntry.lastVersion.amount;
    priceEntry.imageUrl = priceEntry.lastVersion.imageUrl;
    priceEntry.publicId = priceEntry.lastVersion.publicId;
    priceEntry.lastVersion = null; // Clear backup & disable Revert button

    await priceEntry.save();
    res.json({ success: true, message: 'Reverted pricing entry to previous version successfully', priceEntry });
  } catch (err) {
    res.status(500).json({ error: 'Failed to revert pricing entry: ' + err.message });
  }
});

// DELETE pricing entry (PERMANENT DELETE from MongoDB & Cloudinary)
router.delete('/:priceId', async (req, res) => {
  try {
    const priceEntry = await PriceEntry.findOne({ priceId: req.params.priceId });

    if (!priceEntry) {
      return res.status(404).json({ error: 'Pricing entry not found' });
    }

    // 1. Delete current image from Cloudinary if present
    if (priceEntry.publicId) {
      try {
        await deleteFromCloudinary(priceEntry.publicId);
      } catch (err) {
        console.error('Failed to delete image from Cloudinary:', err.message);
      }
    }

    // 2. Delete lastVersion image from Cloudinary if different
    if (priceEntry.lastVersion && priceEntry.lastVersion.publicId && priceEntry.lastVersion.publicId !== priceEntry.publicId) {
      try {
        await deleteFromCloudinary(priceEntry.lastVersion.publicId);
      } catch (err) {
        console.error('Failed to delete lastVersion image from Cloudinary:', err.message);
      }
    }

    // 3. Permanently delete document from MongoDB
    await PriceEntry.deleteOne({ priceId: req.params.priceId });
    res.json({ success: true, message: 'Pricing entry permanently deleted from Cloudinary and MongoDB' });
  } catch (err) {
    res.status(500).json({ error: 'Permanent deletion failed: ' + err.message });
  }
});

module.exports = router;
