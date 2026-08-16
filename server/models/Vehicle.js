const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    registrationNo: { type: String, required: true, unique: true, trim: true },
    type: { type: String, enum: ['Bus', 'Van', 'Auto', 'Car', 'Other'], default: 'Bus' },
    capacity: { type: Number, default: 40 },
    driverName: { type: String, default: '' },
    driverPhone: { type: String, default: '' },
    conductorName: { type: String, default: '' },
    insuranceExpiry: { type: String },
    rcExpiry: { type: String },
    status: { type: String, enum: ['Active', 'Under Maintenance', 'Retired'], default: 'Active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);