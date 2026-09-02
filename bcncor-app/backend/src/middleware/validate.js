/**
 * middleware/validate.js
 *
 * Factory function that returns an Express middleware for validating request bodies.
 * Designed to work with a schema validation library (e.g. Joi or zod).
 * Responsibilities:
 *  - Accept a schema as argument
 *  - Validate req.body against the schema
 *  - Call next() if valid
 *  - Return 400 with validation error details if invalid
 *
 * Usage:
 *  const { validate } = require('../middleware/validate');
 *  router.post('/', validate(createUserSchema), usersController.create);
 *
 * TODO:
 *  - Choose validation library (recommended: zod)
 *  - Implement: function validate(schema) { return (req, res, next) => { ... } }
 *  - On failure: res.status(400).json({ message: 'Validation error', errors: [...] })
 */

function validate(schema) {
  return (req, res, next) => {
    // TODO: implement schema validation against req.body
    next();
  };
}

module.exports = { validate };
