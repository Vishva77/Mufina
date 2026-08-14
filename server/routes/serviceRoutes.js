const express = require('express');
const router = express.Router();
const ServiceCard = require('../models/ServiceCard');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const verifyOwnerToken = require('../middleware/authMiddleware');

// Protect all mutating endpoints (POST, PUT, DELETE) with verifyOwnerToken
router.use(verifyOwnerToken);

// GET all services
router.get('/', async (req, res) => {
  try {
    const services = await ServiceCard.find().sort({ createdAt: 1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new service card (CREATE with Cloudinary Upload)
router.post('/', async (req, res) => {
  try {
    const { title, category, price, desc, img, badge } = req.body;

    if (!title || !price || !desc) {
      return res.status(400).json({ error: 'Title, price, and description are required.' });
    }

    let finalImg = img || 'images/henna1.jpg';
    let publicId = '';

    if (img && (img.startsWith('data:image') || img.startsWith('http'))) {
      try {
        const cloudRes = await uploadToCloudinary(img, 'mufina_services');
        finalImg = cloudRes.imageUrl || finalImg;
        publicId = cloudRes.publicId || '';
      } catch (cloudErr) {
        console.warn('Cloudinary upload warning for service card:', cloudErr.message);
      }
    }

    const newService = new ServiceCard({
      serviceId: 'service_' + Date.now(),
      title,
      category: category || 'henna',
      price,
      desc,
      img: finalImg,
      publicId,
      badge: badge || '',
      lastVersion: null
    });

    await newService.save();
    res.status(201).json(newService);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create service card: ' + err.message });
  }
});

// PUT update service card (EDIT with 1-Level Backup)
router.put('/:serviceId', async (req, res) => {
  try {
    const { title, price, desc, category, img, badge } = req.body;
    const service = await ServiceCard.findOne({ serviceId: req.params.serviceId });

    if (!service) {
      return res.status(404).json({ error: 'Service card not found' });
    }

    // Create 1-level backup of current state in lastVersion
    service.lastVersion = {
      title: service.title,
      desc: service.desc,
      price: service.price,
      category: service.category,
      img: service.img,
      publicId: service.publicId,
      badge: service.badge,
      changedAt: new Date()
    };

    // Update text fields
    if (title) service.title = title.trim();
    if (price) service.price = price.trim();
    if (desc) service.desc = desc.trim();
    if (category) service.category = category;
    if (badge !== undefined) service.badge = badge;

    // If new image is provided
    if (img && img !== service.img && (img.startsWith('data:image') || img.startsWith('http'))) {
      try {
        const cloudRes = await uploadToCloudinary(img, 'mufina_services');
        if (cloudRes.imageUrl) {
          service.img = cloudRes.imageUrl;
          service.publicId = cloudRes.publicId;
        }
      } catch (cloudErr) {
        console.warn('Cloudinary upload warning during service edit:', cloudErr.message);
        service.img = img;
      }
    }

    await service.save();
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update service card: ' + err.message });
  }
});

// POST Revert Last Change for Service Card
router.post('/:serviceId/revert', async (req, res) => {
  try {
    const service = await ServiceCard.findOne({ serviceId: req.params.serviceId });

    if (!service) {
      return res.status(404).json({ error: 'Service card not found' });
    }

    if (!service.lastVersion) {
      return res.status(400).json({ error: 'No previous version available to revert.' });
    }

    // Delete newly uploaded Cloudinary image if edit changed the image
    if (service.publicId && service.publicId !== service.lastVersion.publicId) {
      try {
        await deleteFromCloudinary(service.publicId);
      } catch (delErr) {
        console.warn('Cloudinary cleanup warning on service revert:', delErr.message);
      }
    }

    // Restore previous state
    service.title = service.lastVersion.title;
    service.desc = service.lastVersion.desc;
    service.price = service.lastVersion.price;
    service.category = service.lastVersion.category;
    service.img = service.lastVersion.img;
    service.publicId = service.lastVersion.publicId;
    service.badge = service.lastVersion.badge;
    service.lastVersion = null; // Clear backup & disable Revert button

    await service.save();
    res.json({ success: true, message: 'Reverted service card to previous version successfully', service });
  } catch (err) {
    res.status(500).json({ error: 'Failed to revert service card: ' + err.message });
  }
});

// DELETE service card (PERMANENT DELETE from MongoDB & Cloudinary)
router.delete('/:serviceId', async (req, res) => {
  try {
    const service = await ServiceCard.findOne({ serviceId: req.params.serviceId });

    if (!service) {
      return res.status(404).json({ error: 'Service card not found' });
    }

    // 1. Delete current image from Cloudinary
    if (service.publicId) {
      try {
        await deleteFromCloudinary(service.publicId);
      } catch (err) {
        console.error('Failed to delete image from Cloudinary:', err.message);
      }
    }

    // 2. Delete lastVersion image from Cloudinary if different
    if (service.lastVersion && service.lastVersion.publicId && service.lastVersion.publicId !== service.publicId) {
      try {
        await deleteFromCloudinary(service.lastVersion.publicId);
      } catch (err) {
        console.error('Failed to delete lastVersion image from Cloudinary:', err.message);
      }
    }

    // 3. Permanently delete document from MongoDB
    await ServiceCard.deleteOne({ serviceId: req.params.serviceId });
    res.json({ success: true, message: 'Service card permanently deleted from Cloudinary and MongoDB' });
  } catch (err) {
    res.status(500).json({ error: 'Permanent deletion failed: ' + err.message });
  }
});

module.exports = router;
