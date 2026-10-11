const mongoose = require('mongoose');

// One document = one book borrowed by one student (a transaction record).
const issueSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date, default: null },
    status: { type: String, enum: ['issued', 'returned'], default: 'issued' },
    fine: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// A student cannot hold the same book twice at the same time.
issueSchema.index(
  { student: 1, book: 1 },
  { unique: true, partialFilterExpression: { status: 'issued' } }
);
issueSchema.index({ status: 1, dueDate: 1 });
issueSchema.index({ issueDate: -1 });

module.exports = mongoose.model('Issue', issueSchema);
