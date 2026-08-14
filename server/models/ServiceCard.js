const mongoose = require('mongoose');

const lastVersionSchema = new mongoose.Schema({
  title: { type: String },
  desc: { type: String },
  price: { type: String },
  category: { type: String },
  img: { type: String },
  publicId: { type: String },
  badge: { type: String },
  changedAt: { type: Date, default: Date.now }
}, { _id: false });

const serviceSchema = new mongoose.Schema({
  serviceId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: String, required: true },
  desc: { type: String, required: true },
  img: { type: String, default: 'images/henna1.jpg' },
  publicId: { type: String, default: '' },
  badge: { type: String, default: '' },
  lastVersion: { type: lastVersionSchema, default: null }
}, {
  timestamps: true
});

module.exports = mongoose.model('ServiceCard', serviceSchema);
