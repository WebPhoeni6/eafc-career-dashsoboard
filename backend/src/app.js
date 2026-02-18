const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');
const swaggerUi = require('swagger-ui-express');

const config = require('./config/env');
const logger = require('./config/logger');
const swaggerSpec = require('./config/swagger');
const { generalLimiter } = require('./middlewares/rateLimit');
const { notFound } = require('./utils/response');
const { errorHandler } = require('./middlewares/error');

const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const careersRoutes = require('./modules/careers/careers.routes');
const matchesRoutes = require('./modules/matches/matches.routes');
const seasonsRoutes = require('./modules/seasons/seasons.routes');
const skillsRoutes = require('./modules/skills/skills.routes');
const transfersRoutes = require('./modules/transfers/transfers.routes');
const profileRoutes = require('./modules/profile/profile.routes');
const syncRoutes = require('./modules/sync/sync.routes');

const app = express();
app.set('trust proxy', 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { method: req.method, url: req.url };
      },
    },
  }),
);
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (config.corsOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  }),
);
app.use(cookieParser(config.COOKIE_SECRET));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(generalLimiter);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/careers', careersRoutes);
app.use('/api/careers/:careerId/matches', matchesRoutes);
app.use('/api/careers/:careerId', seasonsRoutes);
app.use('/api/careers/:careerId', skillsRoutes);
app.use('/api/careers/:careerId', transfersRoutes);
app.use('/api/careers/:careerId', profileRoutes);
app.use('/api/sync', syncRoutes);

app.use((req, res) => notFound(res, 'Route not found'));
app.use(errorHandler);

module.exports = app;
