const express = require('express');
const Book = require('../models/Book');
const BookIssue = require('../models/BookIssue');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const issuePopulate = [
  { path: 'book', select: 'title author isbn' },
  { path: 'student', select: 'name' },
];

/* --------------------------------- Books --------------------------------- */

router.get('/books', async (req, res) => {
  try {
    const filter = {};
    if (req.query.q) {
      const re = new RegExp(req.query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: re }, { author: re }, { isbn: re }, { category: re }];
    }
    if (req.query.category) filter.category = req.query.category;
    const books = await Book.find(filter).sort({ title: 1 });
    const categories = await Book.distinct('category');
    const stats = await Book.aggregate([
      {
        $group: {
          _id: null,
          titles: { $sum: 1 },
          copies: { $sum: '$copies' },
          available: { $sum: '$available' },
        },
      },
    ]);
    res.json({ books, categories, stats: stats[0] || { titles: 0, copies: 0, available: 0 } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/books', authorize('principal'), async (req, res) => {
  try {
    const { title, copies } = req.body;
    if (!title) return res.status(400).json({ message: 'Book title is required' });
    const n = Number(copies) || 1;
    const book = await Book.create({ ...req.body, copies: n, available: n, status: n > 0 ? 'Available' : 'All Issued' });
    res.json(book);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/books/:id', authorize('principal'), async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    const { copies, ...rest } = req.body;
    Object.assign(book, rest);
    if (copies !== undefined) {
      const diff = Number(copies) - book.copies;
      book.copies = Number(copies);
      book.available = Math.max(0, book.available + diff);
      book.status = book.available > 0 ? 'Available' : 'All Issued';
    }
    await book.save();
    res.json(book);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/books/:id', authorize('principal'), async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: 'Book removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* --------------------------------- Issues --------------------------------- */

router.get('/issues', authorize('principal', 'teacher'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.studentId) filter.student = req.query.studentId;
    const issues = await BookIssue.find(filter).populate(issuePopulate).sort({ issueDate: -1 });
    const stats = await BookIssue.aggregate([
      {
        $group: {
          _id: null,
          issued: { $sum: { $cond: [{ $eq: ['$status', 'Issued'] }, 1, 0] } },
          overdue: { $sum: { $cond: [{ $eq: ['$status', 'Overdue'] }, 1, 0] } },
          fine: { $sum: '$fine' },
        },
      },
    ]);
    res.json({ issues, stats: stats[0] || { issued: 0, overdue: 0, fine: 0 } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/issues', authorize('principal'), async (req, res) => {
  try {
    const { bookId, studentId, dueDays } = req.body;
    if (!bookId || !studentId) return res.status(400).json({ message: 'Book and student are required' });
    const book = await Book.findById(bookId);
    const student = await Student.findById(studentId);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    if (book.available < 1) return res.status(400).json({ message: 'No copies available' });
    const days = Number(dueDays) || 14;
    const issue = await BookIssue.create({
      book: bookId,
      student: student.user,
      issuedBy: req.user._id,
      dueDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    });
    book.available -= 1;
    book.status = book.available > 0 ? 'Available' : 'All Issued';
    await book.save();
    res.json(await BookIssue.findById(issue._id).populate(issuePopulate));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/issues/:id/return', authorize('principal'), async (req, res) => {
  try {
    const issue = await BookIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    if (issue.status === 'Returned') return res.status(400).json({ message: 'Already returned' });
    issue.returnDate = new Date();
    issue.fine = Number(req.body.fine) || 0;
    issue.status = 'Returned';
    await issue.save();
    const book = await Book.findById(issue.book);
    if (book) {
      book.available = Math.min(book.copies, book.available + 1);
      book.status = 'Available';
      await book.save();
    }
    res.json(await BookIssue.findById(issue._id).populate(issuePopulate));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/issues/:id/lost', authorize('principal'), async (req, res) => {
  try {
    const issue = await BookIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    const price = (await Book.findById(issue.book))?.price || 0;
    issue.fine = Number(req.body.fine) || price;
    issue.returnDate = new Date();
    issue.status = 'Returned';
    await issue.save();
    res.json(await BookIssue.findById(issue._id).populate(issuePopulate));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/* ------------------------------ My / child view ------------------------------ */

router.get('/mine', authorize('student'), async (req, res) => {
  try {
    const issues = await BookIssue.find({ student: req.user._id, status: { $ne: 'Returned' } }).populate('book', 'title author isbn');
    const history = await BookIssue.find({ student: req.user._id, status: 'Returned' })
      .populate('book', 'title author isbn')
      .sort({ returnDate: -1 });
    const fine = await BookIssue.aggregate([
      { $match: { student: req.user._id, fine: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$fine' } } },
    ]);
    res.json({ issues, history, fine: fine[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/child/:studentId', authorize('parent'), async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.studentId, parent: req.user._id });
    if (!student) return res.status(403).json({ message: 'Not your child' });
    const issues = await BookIssue.find({ student: student.user, status: { $ne: 'Returned' } }).populate('book', 'title author isbn');
    const history = await BookIssue.find({ student: student.user, status: 'Returned' })
      .populate('book', 'title author isbn')
      .sort({ returnDate: -1 });
    const fine = await BookIssue.aggregate([
      { $match: { student: student.user, fine: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$fine' } } },
    ]);
    res.json({ issues, history, fine: fine[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;