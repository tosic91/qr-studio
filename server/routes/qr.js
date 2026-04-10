const express = require('express');
const { requireAuth } = require('../middleware/auth');
const qrService = require('../services/qr');
const router = express.Router();

// All QR routes require authentication
router.use(requireAuth);

// GET /api/qr — list all QR codes for current user
router.get('/', async (req, res, next) => {
  try {
    const qrs = await qrService.listByUser(req.session.userId);
    res.json({ qrCodes: qrs });
  } catch (err) {
    next(err);
  }
});

// POST /api/qr — create a new QR code
router.post('/', async (req, res, next) => {
  try {
    const { type, contentType, content, title, styleConfig } = req.body;

    if (!type || !contentType || !content) {
      return res.status(400).json({ error: 'type, contentType, and content are required' });
    }
    if (!['static', 'dynamic'].includes(type)) {
      return res.status(400).json({ error: 'type must be "static" or "dynamic"' });
    }

    const qr = await qrService.create(req.session.userId, {
      type, contentType, content, title, styleConfig
    });
    res.status(201).json({ qrCode: qr });
  } catch (err) {
    next(err);
  }
});

// GET /api/qr/:id — get a single QR code
router.get('/:id', async (req, res, next) => {
  try {
    const qr = await qrService.getById(parseInt(req.params.id), req.session.userId);
    if (!qr) {
      return res.status(404).json({ error: 'QR code not found' });
    }
    res.json({ qrCode: qr });
  } catch (err) {
    next(err);
  }
});

// PUT /api/qr/:id — update a QR code
router.put('/:id', async (req, res, next) => {
  try {
    const { content, title, styleConfig, isActive } = req.body;
    const qr = await qrService.update(parseInt(req.params.id), req.session.userId, {
      content, title, styleConfig, isActive
    });
    if (!qr) {
      return res.status(404).json({ error: 'QR code not found' });
    }
    res.json({ qrCode: qr });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/qr/:id/toggle — toggle active state
router.patch('/:id/toggle', async (req, res, next) => {
  try {
    const qr = await qrService.toggleActive(parseInt(req.params.id), req.session.userId);
    if (!qr) {
      return res.status(404).json({ error: 'QR code not found' });
    }
    res.json({ qrCode: qr });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/qr/:id — delete a QR code
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await qrService.delete(parseInt(req.params.id), req.session.userId);
    if (!deleted) {
      return res.status(404).json({ error: 'QR code not found' });
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
