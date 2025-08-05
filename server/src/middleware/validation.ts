import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

/**
 * Middleware to check validation results and return errors
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : error.type,
        message: error.msg,
        value: error.type === 'field' ? error.value : undefined
      }))
    });
  }
  next();
};

/**
 * User registration validation rules
 */
export const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('role')
    .optional()
    .isIn(['ADMIN', 'TEACHER'])
    .withMessage('Role must be either ADMIN or TEACHER'),
  handleValidationErrors
];

/**
 * User login validation rules
 */
export const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

/**
 * Course creation/update validation rules
 */
export const validateCourse = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Course name must be between 1 and 255 characters'),
  body('code')
    .trim()
    .isLength({ min: 1, max: 20 })
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Course code must be alphanumeric uppercase and between 1 and 20 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  handleValidationErrors
];

/**
 * Student registration validation rules
 */
export const validateStudent = [
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('studentId')
    .trim()
    .isLength({ min: 1, max: 20 })
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Student ID must be alphanumeric with hyphens and between 1 and 20 characters'),
  body('fingerprintTemplate')
    .notEmpty()
    .withMessage('Fingerprint template is required')
    .isBase64()
    .withMessage('Fingerprint template must be valid base64 encoded data'),
  body('courseIds')
    .optional()
    .isArray()
    .withMessage('Course IDs must be an array'),
  body('courseIds.*')
    .optional()
    .isString()
    .withMessage('Each course ID must be a string'),
  handleValidationErrors
];

/**
 * Attendance marking validation rules
 */
export const validateAttendance = [
  body('courseId')
    .notEmpty()
    .isString()
    .withMessage('Course ID is required'),
  body('fingerprintTemplate')
    .notEmpty()
    .withMessage('Fingerprint template is required')
    .isBase64()
    .withMessage('Fingerprint template must be valid base64 encoded data'),
  handleValidationErrors
];

/**
 * Generic ID parameter validation
 */
export const validateId = [
  param('id')
    .isString()
    .notEmpty()
    .withMessage('ID parameter is required'),
  handleValidationErrors
];

/**
 * Pagination validation rules
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

/**
 * Date range validation rules
 */
export const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  handleValidationErrors
];

/**
 * Attendance status validation rules
 */
export const validateAttendanceStatus = [
  body('status')
    .isIn(['PRESENT', 'ABSENT', 'LATE'])
    .withMessage('Status must be PRESENT, ABSENT, or LATE'),
  handleValidationErrors
];

/**
 * Custom validation middleware for file uploads
 */
export const validateFileUpload = (fieldName: string, allowedTypes: string[] = [], maxSize: number = 5 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} file is required`
      });
    }

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      });
    }

    // Check file size
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File size too large. Maximum size: ${maxSize / (1024 * 1024)}MB`
      });
    }

    next();
  };
};

/**
 * Rate limiting validation
 */
export const validateRateLimit = (windowMs: number, maxRequests: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip + req.get('User-Agent');
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    for (const [key, value] of requests.entries()) {
      if (value.resetTime < windowStart) {
        requests.delete(key);
      }
    }

    // Check current client
    const clientData = requests.get(clientId);
    
    if (!clientData) {
      requests.set(clientId, { count: 1, resetTime: now });
      next();
    } else if (clientData.resetTime < windowStart) {
      requests.set(clientId, { count: 1, resetTime: now });
      next();
    } else if (clientData.count >= maxRequests) {
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((windowStart + windowMs - now) / 1000)
      });
    } else {
      clientData.count++;
      next();
    }
  };
};
