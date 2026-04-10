const express = require('express');
const { requireAuth } = require('../middleware/auth');
const analyticsService = require('../services/analytics');
const router = express.Router();

router.use(requireAuth);

// GET /api/analytics/overview — user overview
router.get('/overview', async (req, res, next) => {
  try {
    const overview = await analyticsService.getOverview(req.session.userId);
    res.json(overview);
  } catch (err) {
    next(err);
  }
});

// GET /api/qr/:id/analytics — analytics for specific QR code
// Note: mounted at /api/analytics but we handle the qr/:id pattern
router.get('/qr/:id', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const analytics = await analyticsService.getForQR(parseInt(req.params.id), days);
    res.json(analytics);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
