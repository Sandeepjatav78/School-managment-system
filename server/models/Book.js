const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, default: '' },
    isbn: { type: String, default: '' },
    category: { type: String, default: 'General' },
    publisher: { type: String, default: '' },
    lang: { type: String, default: 'English' },
    rack: { type: String, default: '' },
    copies: { type: Number, default: 1 },
    available: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    purchaseDate: { type: String },
    status: { type: String, enum: ['Available', 'All Issued', 'Discarded'], default: 'Available' },
  },
  { timestamps: true }
);

bookSchema.index({ title: 'text', author: 'text', isbn: 'text' });

module.exports = mongoose.model('Book', bookSchema);