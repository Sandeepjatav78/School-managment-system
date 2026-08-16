const express = require('express');
const Event = require('../models/Event');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.upcoming === 'true') {
      filter.date = { $gte: new Date().toISOString().slice(0, 10) };
    }
    if (req.query.month) {
      const [y, m] = req.query.month.split('-').map(Number);
      const from = `${y}-${String(m).padStart(2, '0')}-01`;
      const to = `${y}-${String(m).padStart(2, '0')}-31`;
      filter.date = { $gte: from, $lte: to };
    }
    const list = await Event.find(filter).sort({ date: 1, startTime: 1 });
    const types = await Event.distinct('type');
    res.json({ list, types });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authorize('principal'), async (req, res) => {
  try {
    const { title, date } = req.body;
    if (!title || !date) return res.status(400).json({ message: 'Title and date are required' });
    const doc = await Event.create({ ...req.body, createdBy: req.user._id });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', authorize('principal'), async (req, res) => {
  try {
    const doc = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ message: 'Event not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', authorize('principal'), async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;