const mongoose = require('mongoose');

const schoolSettingSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Athena Public School' },
    tagline: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    pincode: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: '' },
    affiliationNo: { type: String, default: '' },
    udiseCode: { type: String, default: '' },
    board: { type: String, default: 'CBSE' },
    medium: { type: String, default: 'English' },
    academicYear: { type: String, default: '' },
    sessionStart: { type: String, default: 'April' },
    sessionEnd: { type: String, default: 'March' },
    principalName: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    established: { type: String, default: '' },
    features: {
      hostel: { type: Boolean, default: true },
      transport: { type: Boolean, default: true },
      library: { type: Boolean, default: true },
      payroll: { type: Boolean, default: true },
      certificates: { type: Boolean, default: true },
      admissions: { type: Boolean, default: true },
      events: { type: Boolean, default: true },
      homework: { type: Boolean, default: true },
      syllabus: { type: Boolean, default: true },
      exams: { type: Boolean, default: true },
      leaves: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

schoolSettingSchema.statics.get = async function () {
  let s = await this.findOne();
  if (!s) {
    s = await this.create({});
  }
  return s;
};

module.exports = mongoose.model('SchoolSetting', schoolSettingSchema);