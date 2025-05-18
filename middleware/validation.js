const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Middleware to validate request data
 * @param {Array} validations - Array of express-validator validations
 * @returns {Function} - Express middleware function
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    
    // Log validation errors
    logger.warn(`Validation error: ${JSON.stringify(errors.array())}`);
    
    return res.status(400).json({
      status: 'error',
      errors: errors.array()
    });
  };
};

module.exports = validate;