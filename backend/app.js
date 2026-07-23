const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

/** Comma-separated frontend origins, e.g. https://app.vercel.app,http://localhost:5173 */
const allowedOrigins = String(process.env.CLIENT_URL || process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser / same-origin tools (no Origin header)
      if (!origin) {
        callback(null, true);
        return;
      }
      // Dev convenience: if CLIENT_URL unset, allow all
      if (allowedOrigins.length === 0) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'ok' });
});

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
