/**
 * Parse user agent string to determine device type
 */
function parseDeviceType(userAgent) {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

module.exports = { parseDeviceType };
