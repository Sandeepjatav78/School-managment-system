const express = require('express');
const Vehicle = require('../models/Vehicle');
const Route = require('../models/Route');
const TransportAssignment = require('../models/TransportAssignment');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

/* -------------------------------- Vehicles -------------------------------- */

router.get('/vehicles', authorize('principal'), async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ registrationNo: 1 });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/vehicles', authorize('principal'), async (req, res) => {
  try {
    const { registrationNo } = req.body;
    if (!registrationNo) return res.status(400).json({ message: 'Registration number is required' });
    res.json(await Vehicle.create(req.body));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/vehicles/:id', authorize('principal'), async (req, res) => {
  try {
    const v = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!v) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(v);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/vehicles/:id', authorize('principal'), async (req, res) => {
  try {
    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* --------------------------------- Routes --------------------------------- */

router.get('/routes', async (req, res) => {
  try {
    const routes = await Route.find().populate('vehicle', 'registrationNo type capacity').sort({ name: 1 });
    res.json(routes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/routes', authorize('principal'), async (req, res) => {
  try {
    const { name, stops } = req.body;
    if (!name) return res.status(400).json({ message: 'Route name is required' });
    const doc = await Route.create({
      ...req.body,
      stops: (stops || []).map((s, i) => ({ ...s, order: s.order ?? i + 1 })),
    });
    res.json(await Route.findById(doc._id).populate('vehicle', 'registrationNo type capacity'));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/routes/:id', authorize('principal'), async (req, res) => {
  try {
    const doc = await Route.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Route not found' });
    Object.assign(doc, req.body);
    if (req.body.stops) {
      doc.stops = req.body.stops.map((s, i) => ({ ...s, order: s.order ?? i + 1 }));
    }
    await doc.save();
    res.json(await Route.findById(doc._id).populate('vehicle', 'registrationNo type capacity'));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/routes/:id', authorize('principal'), async (req, res) => {
  try {
    await TransportAssignment.deleteMany({ route: req.params.id });
    await Route.findByIdAndDelete(req.params.id);
    res.json({ message: 'Route deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ------------------------------ Assignments ------------------------------ */

router.get('/assignments', authorize('principal', 'teacher'), async (req, res) => {
  try {
    const list = await TransportAssignment.find()
      .populate('student', 'name')
      .populate({ path: 'route', populate: { path: 'vehicle', select: 'registrationNo type' } })
      .sort({ 'route.name': 1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/assignments', authorize('principal'), async (req, res) => {
  try {
    const { studentId, routeId, stop, amount, pickupTime, dropTime } = req.body;
    if (!studentId || !routeId || !stop) {
      return res.status(400).json({ message: 'Student, route and stop are required' });
    }
    const doc = await TransportAssignment.findOneAndUpdate(
      { student: studentId },
      {
        $set: {
          student: studentId,
          route: routeId,
          stop,
          amount: Number(amount) || 0,
          pickupTime: pickupTime || '',
          dropTime: dropTime || '',
          status: 'Active',
          effectiveFrom: req.body.effectiveFrom || '',
        },
      },
      { upsert: true, new: true }
    );
    res.json(await TransportAssignment.findById(doc._id).populate('student', 'name').populate('route', 'name'));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/assignments/:id', authorize('principal'), async (req, res) => {
  try {
    const doc = await TransportAssignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ message: 'Assignment not found' });
    res.json(await TransportAssignment.findById(doc._id).populate('student', 'name').populate('route', 'name'));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/assignments/:id', authorize('principal'), async (req, res) => {
  try {
    await TransportAssignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assignment removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ---------------------------- Student / parent view ---------------------------- */

router.get('/mine', authorize('student'), async (req, res) => {
  try {
    const doc = await TransportAssignment.findOne({ student: req.user._id, status: 'Active' })
      .populate({ path: 'route', populate: { path: 'vehicle', select: 'registrationNo type capacity driverName driverPhone' } });
    res.json(doc || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/child/:studentId', authorize('parent'), async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.studentId, parent: req.user._id });
    if (!student) return res.status(403).json({ message: 'Not your child' });
    const doc = await TransportAssignment.findOne({ student: student.user, status: 'Active' })
      .populate({ path: 'route', populate: { path: 'vehicle', select: 'registrationNo type capacity driverName driverPhone' } });
    res.json(doc || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;