const express = require('express');
const Hostel = require('../models/Hostel');
const HostelRoom = require('../models/HostelRoom');
const HostelAllotment = require('../models/HostelAllotment');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

/* --------------------------------- Hostels --------------------------------- */

router.get('/hostels', authorize('principal', 'teacher'), async (req, res) => {
  try {
    const hostels = await Hostel.find().populate({ path: 'warden', populate: { path: 'user', select: 'name' } });
    const rooms = await HostelRoom.find();
    const counts = {};
    rooms.forEach((r) => {
      const key = r.hostel.toString();
      counts[key] = (counts[key] || 0) + r.capacity;
    });
    res.json(hostels.map((h) => ({ ...h.toObject(), totalCapacity: counts[h._id.toString()] || 0 })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/hostels', authorize('principal'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Hostel name is required' });
    res.json(await Hostel.create(req.body));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/hostels/:id', authorize('principal'), async (req, res) => {
  try {
    const doc = await Hostel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ message: 'Hostel not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/hostels/:id', authorize('principal'), async (req, res) => {
  try {
    await HostelRoom.deleteMany({ hostel: req.params.id });
    await Hostel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Hostel deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ---------------------------------- Rooms ---------------------------------- */

router.get('/rooms', authorize('principal', 'teacher'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.hostelId) filter.hostel = req.query.hostelId;
    const rooms = await HostelRoom.find(filter).populate('hostel', 'name').sort({ roomNo: 1 });
    const allotments = await HostelAllotment.find({ status: 'Active' });
    const occupied = {};
    allotments.forEach((a) => {
      const key = a.room.toString();
      occupied[key] = (occupied[key] || 0) + 1;
    });
    res.json(rooms.map((r) => ({ ...r.toObject(), occupied: occupied[r._id.toString()] || 0 })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/rooms', authorize('principal'), async (req, res) => {
  try {
    const { hostel, roomNo } = req.body;
    if (!hostel || !roomNo) return res.status(400).json({ message: 'Hostel and room number are required' });
    res.json(await HostelRoom.create(req.body));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/rooms/:id', authorize('principal'), async (req, res) => {
  try {
    const doc = await HostelRoom.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ message: 'Room not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/rooms/:id', authorize('principal'), async (req, res) => {
  try {
    await HostelAllotment.deleteMany({ room: req.params.id });
    await HostelRoom.findByIdAndDelete(req.params.id);
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* -------------------------------- Allotments -------------------------------- */

router.get('/allotments', authorize('principal', 'teacher'), async (req, res) => {
  try {
    const list = await HostelAllotment.find()
      .populate('student', 'name')
      .populate('hostel', 'name')
      .populate('room', 'roomNo floor type')
      .sort({ startDate: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/allotments', authorize('principal'), async (req, res) => {
  try {
    const { studentId, hostelId, roomId, fee, bedNo } = req.body;
    if (!studentId || !hostelId || !roomId) {
      return res.status(400).json({ message: 'Student, hostel and room are required' });
    }
    const room = await HostelRoom.findById(roomId);
    const occupied = await HostelAllotment.countDocuments({ room: roomId, status: 'Active' });
    if (room && occupied >= room.capacity) {
      return res.status(400).json({ message: `Room ${room.roomNo} is full` });
    }
    const doc = await HostelAllotment.findOneAndUpdate(
      { student: studentId },
      {
        $set: {
          student: studentId,
          hostel: hostelId,
          room: roomId,
          bedNo: bedNo || '',
          fee: Number(fee) || 0,
          startDate: req.body.startDate || new Date().toISOString().slice(0, 10),
          status: 'Active',
        },
      },
      { upsert: true, new: true }
    );
    res.json(await HostelAllotment.findById(doc._id).populate('student', 'name').populate('hostel', 'name').populate('room', 'roomNo'));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/allotments/:id', authorize('principal'), async (req, res) => {
  try {
    const doc = await HostelAllotment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ message: 'Allotment not found' });
    res.json(await HostelAllotment.findById(doc._id).populate('student', 'name').populate('hostel', 'name').populate('room', 'roomNo'));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/allotments/:id/vacate', authorize('principal'), async (req, res) => {
  try {
    const doc = await HostelAllotment.findByIdAndUpdate(
      req.params.id,
      { status: 'Vacated', endDate: req.body.endDate || new Date().toISOString().slice(0, 10) },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'Allotment not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/* ------------------------------ Student view ------------------------------ */

router.get('/mine', authorize('student'), async (req, res) => {
  try {
    const doc = await HostelAllotment.findOne({ student: req.user._id, status: 'Active' })
      .populate('hostel', 'name contact address')
      .populate('room', 'roomNo floor type');
    res.json(doc || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/child/:studentId', authorize('parent'), async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.studentId, parent: req.user._id });
    if (!student) return res.status(403).json({ message: 'Not your child' });
    const doc = await HostelAllotment.findOne({ student: student.user, status: 'Active' })
      .populate('hostel', 'name contact address')
      .populate('room', 'roomNo floor type');
    res.json(doc || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;