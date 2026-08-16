const express = require('express');
const SchoolSetting = require('../models/SchoolSetting');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const FIELDS = [
  'name',
  'tagline',
  'address',
  'city',
  'pincode',
  'phone',
  'email',
  'website',
  'affiliationNo',
  'udiseCode',
  'board',
  'medium',
  'academicYear',
  'sessionStart',
  'sessionEnd',
  'principalName',
  'logoUrl',
  'established',
];

router.get('/', async (req, res) => {
  try {
    const settings = await SchoolSetting.get();
    if (req.user.role === 'principal') return res.json(settings);
    res.json({
      name: settings.name,
      tagline: settings.tagline,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      board: settings.board,
      medium: settings.medium,
      academicYear: settings.academicYear,
      principalName: settings.principalName,
      logoUrl: settings.logoUrl,
      features: settings.features,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/', authorize('principal'), async (req, res) => {
  try {
    const settings = await SchoolSetting.get();
    for (const f of FIELDS) {
      if (req.body[f] !== undefined) settings[f] = req.body[f];
    }
    if (req.body.features && typeof req.body.features === 'object') {
      for (const [key, value] of Object.entries(req.body.features)) {
        if (settings.features[key] !== undefined) settings.features[key] = Boolean(value);
      }
    }
    await settings.save();
    require('../middleware/featureGate').invalidate();
    res.json(settings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;