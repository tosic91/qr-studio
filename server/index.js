const express = require('express');
const session = require('express-session');
const path = require('path');
const config = require('./config');

const app = express();

// ── Body parsing ──
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Sessions ──
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.isProd,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// ── Static files ──
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── Redirect handler (must be before API routes, high priority) ──
const redirectRouter = require('./routes/redirect');
app.use('/r', redirectRouter);

// ── API routes ──
const authRouter = require('./routes/auth');
const qrRouter = require('./routes/qr');
const analyticsRouter = require('./routes/analytics');

app.use('/api/auth', authRouter);
app.use('/api/qr', qrRouter);
app.use('/api/analytics', analyticsRouter);

// ── SPA fallback for HTML pages ──
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'register.html'));
});

// ── Error handler ──
const errorHandler = require('./middleware/error');
app.use(errorHandler);

// ── Start server ──
app.listen(config.port, '0.0.0.0', () => {
  console.log(`🚀 QR Code App running on port ${config.port}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   URL: ${config.appUrl}`);
});

module.exports = app;
