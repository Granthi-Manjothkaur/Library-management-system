const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    author: { type: String, required: [true, 'Author is required'], trim: true },
    isbn: { type: String, required: [true, 'ISBN is required'], unique: true, trim: true },
    category: { type: String, required: [true, 'Category is required'], trim: true },
    publisher: { type: String, trim: true, default: '' },
    publicationYear: { type: Number, min: 1000, max: new Date().getFullYear() + 1 },
    description: { type: String, trim: true, default: '', maxlength: 2000 },
    totalCopies: { type: Number, required: [true, 'Total copies is required'], min: [1, 'At least 1 copy'] },
    availableCopies: { type: Number, min: [0, 'Available copies cannot be negative'] },
    coverImage: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

bookSchema.index({ title: 'text', author: 'text', isbn: 'text', category: 'text' });
bookSchema.index({ category: 1 });

bookSchema.pre('validate', function (next) {
  if (this.availableCopies === undefined || this.availableCopies === null) this.availableCopies = this.totalCopies;
  if (this.availableCopies > this.totalCopies) {
    this.invalidate('availableCopies', 'Available copies cannot exceed total copies');
  }
  next();
});

module.exports = mongoose.model('Book', bookSchema);
