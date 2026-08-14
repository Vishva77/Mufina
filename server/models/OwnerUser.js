const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

module.exports = mongoose.model('OwnerUser', ownerSchema);
