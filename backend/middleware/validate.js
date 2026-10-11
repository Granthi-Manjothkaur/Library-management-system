const { validationResult } = require('express-validator');

// Put this after express-validator rules; returns 400 with the first problem.
module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const list = errors.array();
    return res.status(400).json({ message: list[0].msg, errors: list.map((e) => ({ field: e.path, message: e.msg })) });
  }
  next();
};
