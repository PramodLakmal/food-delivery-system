const morgan = require('morgan');

// Configure different logging formats based on environment
const logger = (app) => {
  if (process.env.NODE_ENV === 'development') {
    // Dev format: detailed colored output
    app.use(morgan('dev'));
  } else {
    // Production format: Apache common log format
    app.use(morgan('common'));
  }
};

module.exports = logger; 