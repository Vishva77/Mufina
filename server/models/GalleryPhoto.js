const mongoose = require('mongoose');

const lastVersionSchema = new mongoose.Schema({
  title: { type: String },
  category: { type: String },
  src: { type: String },
  publicId: { type: String },
  changedAt: { type: Date, default: Date.now }
}, { _id: false });

const gallerySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  src: { type: String, required: true },
  publicId: { type: String, default: '' },
  title: { type: String, required: true },
  category: { type: String, required: true },
  lastVersion: { type: lastVersionSchema, default: null }
}, {
  timestamps: true
});

module.exports = mongoose.model('GalleryPhoto', gallerySchema);
