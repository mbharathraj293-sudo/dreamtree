import sanitizeHtml from 'sanitize-html';

const sanitizeOptions = {
  allowedTags: [], // Strip all HTML tags
  allowedAttributes: {} // Strip all HTML attributes
};

const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return sanitizeHtml(value, sanitizeOptions).trim();
  }
  if (typeof value === 'object' && value !== null) {
    return sanitizeObject(value);
  }
  return value;
};

const sanitizeObject = (obj) => {
  const sanitized = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      sanitized[key] = sanitizeValue(obj[key]);
    }
  }
  return sanitized;
};

export const xssSanitizer = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};
