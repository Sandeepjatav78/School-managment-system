const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    classApplying: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    source: {
      type: String,
      enum: ['Website', 'Walk-in', 'Phone', 'Referral', 'Ad', 'Other'],
      default: 'Website',
    },
    message: { type: String, default: '' },
    status: { type: String, enum: ['New', 'Contacted', 'Converted', 'Closed'], default: 'New' },
    followUpDate: { type: String },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

enquirySchema.index({ status: 1 });
enquirySchema.index({ phone: 1 });

module.exports = mongoose.model('Enquiry', enquirySchema);