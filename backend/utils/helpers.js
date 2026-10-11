const DAY_MS = 24 * 60 * 60 * 1000;

const config = () => ({
  borrowDays: Number(process.env.BORROW_DAYS) || 14,
  finePerDay: Number(process.env.FINE_PER_DAY) || 5,
  maxActive: Number(process.env.MAX_ACTIVE_ISSUES) || 5,
});

// Whole days late (0 if on time)
const overdueDays = (dueDate, endDate = new Date()) => {
  const diff = new Date(endDate) - new Date(dueDate);
  return diff > 0 ? Math.ceil(diff / DAY_MS) : 0;
};

const calcFine = (dueDate, endDate = new Date()) => overdueDays(dueDate, endDate) * config().finePerDay;

// Adds live overdue information to an issue record.
const decorateIssue = (issue) => {
  const obj = issue.toObject ? issue.toObject() : { ...issue };
  if (obj.status === 'issued') {
    obj.overdueDays = overdueDays(obj.dueDate);
    obj.isOverdue = obj.overdueDays > 0;
    obj.fine = calcFine(obj.dueDate);
  } else {
    obj.overdueDays = overdueDays(obj.dueDate, obj.returnDate);
    obj.isOverdue = false;
  }
  return obj;
};

const escapeRegex = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Builds a date range filter from ?from=YYYY-MM-DD&to=YYYY-MM-DD
const dateRange = (from, to) => {
  const range = {};
  if (from) {
    const d = new Date(from);
    if (!isNaN(d)) range.$gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!isNaN(d)) {
      d.setHours(23, 59, 59, 999);
      range.$lte = d;
    }
  }
  return Object.keys(range).length ? range : null;
};

module.exports = { DAY_MS, config, overdueDays, calcFine, decorateIssue, escapeRegex, dateRange };
