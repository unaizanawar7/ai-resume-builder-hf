/**
 * Validation Middleware - Input validation and sanitization
 * 
 * Provides utilities for:
 * - XSS sanitization
 * - NoSQL injection protection
 * - Email validation
 * - Password validation
 * - String sanitization
 */

/**
 * Sanitize string to prevent XSS attacks
 * Removes or escapes potentially dangerous HTML/script tags
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  
  // Remove HTML tags
  let sanitized = str.replace(/<[^>]*>/g, '');
  
  // Escape special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized;
}

/**
 * Sanitize object recursively to prevent NoSQL injection
 * Removes MongoDB operators from object keys and values
 */
export function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    // Remove MongoDB operators from strings
    return obj.replace(/\$|\{|\[|\]|\}/g, '');
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    const dangerousKeys = ['$where', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin', '$regex', '$exists', '$type'];
    
    for (const [key, value] of Object.entries(obj)) {
      // Remove dangerous MongoDB operators from keys
      if (dangerousKeys.some(dk => key.includes(dk))) {
        continue; // Skip dangerous keys
      }
      
      // Remove $ from keys
      const cleanKey = key.replace(/^\$/, '');
      sanitized[cleanKey] = sanitizeObject(value);
    }
    
    return sanitized;
  }
  
  return obj;
}

/**
 * Validate email format
 */
export function validateEmail(email) {
  if (typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate password strength
 * Requirements:
 * - At least 6 characters
 * - Can include letters, numbers, and special characters
 */
export function validatePassword(password) {
  if (typeof password !== 'string') return { valid: false, error: 'Password must be a string' };
  
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters long' };
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Password must be less than 128 characters' };
  }
  
  return { valid: true };
}

/**
 * Validate phone number format (flexible)
 * Accepts various formats: +1234567890, (123) 456-7890, 123-456-7890, etc.
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return true; // Phone is optional
  
  // Remove common separators
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Check if it contains only digits and optional + at start
  const phoneRegex = /^\+?[0-9]{7,15}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Validate string length
 */
export function validateStringLength(str, min = 0, max = Infinity) {
  if (typeof str !== 'string') return { valid: false, error: 'Must be a string' };
  
  const length = str.trim().length;
  
  if (length < min) {
    return { valid: false, error: `Must be at least ${min} characters long` };
  }
  
  if (length > max) {
    return { valid: false, error: `Must be less than ${max} characters long` };
  }
  
  return { valid: true };
}

/**
 * Middleware to sanitize request body
 */
export function sanitizeBody(req, res, next) {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
}

/**
 * Middleware to validate and sanitize request body based on schema
 */
export function validateBody(validator) {
  return (req, res, next) => {
    const { error, value } = validator(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message || 'Validation failed',
        details: error.details || []
      });
    }
    
    // Replace body with sanitized value
    req.body = value;
    next();
  };
}

/**
 * Create a simple validator function
 */
export function createValidator(schema) {
  return (data) => {
    const errors = [];
    const sanitized = {};
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      
      // Check required
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }
      
      // Skip validation if field is optional and not provided
      if (!rules.required && (value === undefined || value === null || value === '')) {
        continue;
      }
      
      // Type validation
      if (rules.type && typeof value !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}`);
        continue;
      }
      
      // String validations
      if (rules.type === 'string') {
        const sanitizedValue = sanitizeString(value);
        
        // Length validation
        if (rules.minLength || rules.maxLength) {
          const lengthCheck = validateStringLength(sanitizedValue, rules.minLength || 0, rules.maxLength || Infinity);
          if (!lengthCheck.valid) {
            errors.push(lengthCheck.error);
            continue;
          }
        }
        
        // Email validation
        if (rules.email && !validateEmail(sanitizedValue)) {
          errors.push(`${field} must be a valid email address`);
          continue;
        }
        
        // Phone validation
        if (rules.phone && !validatePhone(sanitizedValue)) {
          errors.push(`${field} must be a valid phone number`);
          continue;
        }
        
        sanitized[field] = sanitizedValue;
      }
      
      // Array validations
      else if (rules.type === 'array') {
        if (!Array.isArray(value)) {
          errors.push(`${field} must be an array`);
          continue;
        }
        
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must have at least ${rules.minLength} items`);
          continue;
        }
        
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must have at most ${rules.maxLength} items`);
          continue;
        }
        
        // Recursively sanitize array items
        sanitized[field] = value.map(item => {
          if (typeof item === 'string') {
            return sanitizeString(item);
          } else if (typeof item === 'object') {
            return sanitizeObject(item);
          }
          return item;
        });
      }
      
      // Object validations
      else if (rules.type === 'object') {
        if (typeof value !== 'object' || Array.isArray(value)) {
          errors.push(`${field} must be an object`);
          continue;
        }
        
        sanitized[field] = sanitizeObject(value);
      }
      
      // Default: just sanitize
      else {
        sanitized[field] = sanitizeObject(value);
      }
    }
    
    if (errors.length > 0) {
      return {
        error: {
          message: 'Validation failed',
          details: errors
        }
      };
    }
    
    return { error: null, value: sanitized };
  };
}


