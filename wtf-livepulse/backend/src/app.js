require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { initWebSocket } = require('./websocket/wsServer');
const { startAnomalyDetection } = require('./jobs/anomalyDetection');
const pool = require('./db/pool');

const gymsRouter      = require('./routes/gyms');
const membersRouter   = require('./routes/members');
const checkinsRouter  = require('./routes/checkins');
const paymentsRouter  = require('./routes/payments');
const anomaliesRouter = require('./routes/anomalies');
const dashboardRouter = require('./routes/dashboard');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'disconnected', error: err.message });
  }
});

app.use('/api/gyms',      gymsRouter);
app.use('/api/members',   membersRouter);
app.use('/api/checkins',  checkinsRouter);
app.use('/api/payments',  paymentsRouter);
app.use('/api/anomalies', anomaliesRouter);
app.use('/api/dashboard', dashboardRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const server = http.createServer(app);
initWebSocket(server);

if (process.env.NODE_ENV !== 'test') {
  startAnomalyDetection();
}

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🏋️  FitCore backend running on port ${PORT}`);
    console.log(`   ENV: ${process.env.NODE_ENV}`);
  });
}

module.exports = { app, server };
