const express = require('express');
const router = express.Router();
const GalleryPhoto = require('../models/GalleryPhoto');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const verifyOwnerToken = require('../middleware/authMiddleware');

// Protect all mutating endpoints (POST, PUT, DELETE) with verifyOwnerToken
router.use(verifyOwnerToken);

// GET all gallery photos
router.get('/', async (req, res) => {
  try {
    const photos = await GalleryPhoto.find().sort({ createdAt: -1 });
    res.json(photos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new photo (CREATE with Cloudinary Upload)
router.post('/', async (req, res) => {
  try {
    const { src, title, category } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'Title and category are required.' });
    }

    let finalSrc = src;
    let publicId = '';

    // Upload to Cloudinary if image is provided as base64 or file
    if (src && (src.startsWith('data:image') || src.startsWith('http'))) {
      try {
        const cloudRes = await uploadToCloudinary(src, 'mufina_gallery');
        finalSrc = cloudRes.imageUrl || src;
        publicId = cloudRes.publicId || '';
      } catch (cloudErr) {
        console.warn('Cloudinary upload warning, fallback to direct src:', cloudErr.message);
      }
    }

    const newPhoto = new GalleryPhoto({
      id: 'photo_' + Date.now(),
      src: finalSrc,
      publicId: publicId,
      title,
      category,
      lastVersion: null
    });

    await newPhoto.save();
    res.status(201).json(newPhoto);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create gallery photo: ' + err.message });
  }
});

// PUT update photo (EDIT with 1-Level Backup)
router.put('/:id', async (req, res) => {
  try {
    const { title, category, src } = req.body;
    const photo = await GalleryPhoto.findOne({ id: req.params.id });

    if (!photo) {
      return res.status(404).json({ error: 'Gallery photo not found' });
    }

    // Create 1-level backup of current state in lastVersion
    photo.lastVersion = {
      title: photo.title,
      category: photo.category,
      src: photo.src,
      publicId: photo.publicId,
      changedAt: new Date()
    };

    // Update text fields
    if (title) photo.title = title.trim();
    if (category) photo.category = category;

    // If a new image is provided
    if (src && src !== photo.src && (src.startsWith('data:image') || src.startsWith('http'))) {
      try {
        const cloudRes = await uploadToCloudinary(src, 'mufina_gallery');
        if (cloudRes.imageUrl) {
          photo.src = cloudRes.imageUrl;
          photo.publicId = cloudRes.publicId;
        }
      } catch (cloudErr) {
        console.warn('Cloudinary upload warning during edit:', cloudErr.message);
        photo.src = src;
      }
    }

    await photo.save();
    res.json(photo);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update photo: ' + err.message });
  }
});

// POST Revert Last Change for Gallery Photo
router.post('/:id/revert', async (req, res) => {
  try {
    const photo = await GalleryPhoto.findOne({ id: req.params.id });

    if (!photo) {
      return res.status(404).json({ error: 'Gallery photo not found' });
    }

    if (!photo.lastVersion) {
      return res.status(400).json({ error: 'No previous version available to revert.' });
    }

    // If edit introduced a NEW Cloudinary image, delete newly uploaded image from Cloudinary
    if (photo.publicId && photo.publicId !== photo.lastVersion.publicId) {
      try {
        await deleteFromCloudinary(photo.publicId);
      } catch (delErr) {
        console.warn('Cloudinary cleanup warning on revert:', delErr.message);
      }
    }

    // Restore previous state
    photo.title = photo.lastVersion.title;
    photo.category = photo.lastVersion.category;
    photo.src = photo.lastVersion.src;
    photo.publicId = photo.lastVersion.publicId;
    photo.lastVersion = null; // Clear backup & disable Revert button

    await photo.save();
    res.json({ success: true, message: 'Reverted to previous version successfully', photo });
  } catch (err) {
    res.status(500).json({ error: 'Failed to revert changes: ' + err.message });
  }
});

// DELETE photo (PERMANENT DELETE from MongoDB & Cloudinary)
router.delete('/:id', async (req, res) => {
  try {
    const photo = await GalleryPhoto.findOne({ id: req.params.id });

    if (!photo) {
      return res.status(404).json({ error: 'Gallery photo not found' });
    }

    // 1. Delete current image from Cloudinary
    if (photo.publicId) {
      try {
        await deleteFromCloudinary(photo.publicId);
      } catch (err) {
        console.error('Failed to delete image from Cloudinary:', err.message);
      }
    }

    // 2. Delete lastVersion image from Cloudinary if different
    if (photo.lastVersion && photo.lastVersion.publicId && photo.lastVersion.publicId !== photo.publicId) {
      try {
        await deleteFromCloudinary(photo.lastVersion.publicId);
      } catch (err) {
        console.error('Failed to delete lastVersion image from Cloudinary:', err.message);
      }
    }

    // 3. Permanently delete document from MongoDB
    await GalleryPhoto.deleteOne({ id: req.params.id });
    res.json({ success: true, message: 'Photo permanently deleted from Cloudinary and MongoDB' });
  } catch (err) {
    res.status(500).json({ error: 'Permanent deletion failed: ' + err.message });
  }
});

module.exports = router;
