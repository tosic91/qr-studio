const express = require('express');
const qrService = require('../services/qr');
const analyticsService = require('../services/analytics');
const { parseDeviceType } = require('../utils/device');
const router = express.Router();

// GET /r/:code — redirect handler for dynamic QR codes
router.get('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const qr = await qrService.getByShortCode(code);

    if (!qr) {
      return res.status(404).send(`
        <html>
          <head><title>QR Code Not Found</title></head>
          <body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#e2e8f0;">
            <div style="text-align:center;">
              <h1 style="font-size:4rem;margin:0;">404</h1>
              <p style="font-size:1.2rem;color:#94a3b8;">This QR code does not exist.</p>
            </div>
          </body>
        </html>
      `);
    }

    if (!qr.isActive) {
      return res.status(410).send(`
        <html>
          <head><title>QR Code Inactive</title></head>
          <body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#e2e8f0;">
            <div style="text-align:center;">
              <h1 style="font-size:2rem;margin:0;">⏸️ QR Code Paused</h1>
              <p style="font-size:1.1rem;color:#94a3b8;">This QR code has been temporarily deactivated.</p>
            </div>
          </body>
        </html>
      `);
    }

    // Log scan analytics (non-blocking)
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    
    analyticsService.logScan(qr.id, {
      ipAddress,
      userAgent,
      deviceType: parseDeviceType(userAgent),
      referer: req.headers['referer'] || null,
    }).catch(err => console.error('Analytics log error:', err));

    // Increment scan count (non-blocking)
    qrService.incrementScanCount(qr.id).catch(err => console.error('Scan count error:', err));

    // Get the target URL from content
    let targetUrl = qr.content.url || qr.content.text || '';
    
    if (!targetUrl) {
      return res.status(400).send('No redirect URL configured');
    }

    // Normalize URL — auto-prepend https:// if missing protocol
    targetUrl = targetUrl.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    // 302 redirect (temporary, so browsers always check for updates)
    res.redirect(302, targetUrl);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
