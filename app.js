const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const moment = require('moment');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const fileUpload = require('express-fileupload');

const { connect } = require('./src/database/connect');
const parentRoute = require('./src/parent/route/route');
const schoolOwnerRoute = require('./src/school/route/schoolOwner');
const log = require('./src/common/logger/logger');
require('dotenv').config();
const { PORT, NODE_ENV } = process.env;

// start express app
const app = express();
app.use(cors());
app.use(fileUpload());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(morgan('combined'));

const limiter = rateLimit({
  max: 100,
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  message:
    'We received too many requests from this IP. Please try again in 24hrs to this time',
});

app.use('/api', limiter);
app.use(helmet());
app.use(mongoSanitize());
app.use(compression());

app.use((req, res, next) => {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept',
  );
  next();
});

app.use((req, res, next) => {
  req.time = moment().format('LLLL');
  log.info(`Requested At: ${req.time}`);
  next();
});

app.get('/', (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'Welcome to tedalink API',
  });
});

app.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'tedalink health is up',
  });
});

app.use('/api/v1/parents', parentRoute);
app.use('/api/v1/school-owners', schoolOwnerRoute);

// Non existed routes fallback
app.all('*', (req, res) => {
  return res.status(404).json({
    status: 'failed',
    message: `Could not find ${req.originalUrl} on the server`,
  });
});

app.listen(PORT, async () => {
  log.info(`Application mode: ${NODE_ENV}`);
  log.info(`Server running on port: ${PORT || 3000}`);
  await connect();
});
