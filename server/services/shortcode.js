const { nanoid } = require('nanoid');

/**
 * Generate a unique short code for dynamic QR codes
 * Uses nanoid for URL-safe, compact IDs
 */
function generateShortCode(length = 8) {
  return nanoid(length);
}

module.exports = { generateShortCode };
