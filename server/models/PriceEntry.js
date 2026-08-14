const mongoose = require('mongoose');

const lastVersionSchema = new mongoose.Schema({
  title: { type: String },
  category: { type: String },
  amount: { type: String },
  imageUrl: { type: String },
  publicId: { type: String },
  changedAt: { type: Date, default: Date.now }
}, { _id: false });

const pricingSchema = new mongoose.Schema({
  priceId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  publicId: { type: String, default: '' },
  lastVersion: { type: lastVersionSchema, default: null }
}, {
  timestamps: true
});

module.exports = mongoose.model('PriceEntry', pricingSchema);
