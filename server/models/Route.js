const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    driverName: { type: String, default: '' },
    driverPhone: { type: String, default: '' },
    stops: [
      {
        name: { type: String, required: true },
        order: { type: Number, default: 0 },
        time: { type: String },
        fare: { type: Number, default: 0 },
      },
    ],
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Route', routeSchema);