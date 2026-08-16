const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema(
  {
    applicationNo: { type: String, required: true, unique: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, default: '', trim: true },
    dateOfBirth: { type: String },
    gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
    classApplying: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    parentName: { type: String, required: true },
    parentPhone: { type: String, required: true },
    parentEmail: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    pincode: { type: String, default: '' },
    aadhaar: { type: String, default: '' },
    caste: { type: String, default: '' },
    religion: { type: String, default: '' },
    previousSchool: { type: String, default: '' },
    previousClass: { type: String, default: '' },
    documents: [
      { name: { type: String }, status: { type: String, enum: ['Pending', 'Received', 'Verified'], default: 'Pending' } },
    ],
    status: {
      type: String,
      enum: ['Applied', 'Under Review', 'Interview Scheduled', 'Admitted', 'Rejected', 'Withdrawn'],
      default: 'Applied',
    },
    interviewDate: { type: String },
    remarks: { type: String, default: '' },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    admittedOn: { type: Date },
  },
  { timestamps: true }
);

admissionSchema.index({ status: 1 });
admissionSchema.index({ parentPhone: 1 });

module.exports = mongoose.model('Admission', admissionSchema);