require('dotenv').config();

// Read environment from `.env`, default to `dev`
const env = process.env.ENV || 'dev';

const allUrl = {
  dev: {
    base_url: 'https://www.saucedemo.com/'
  },
  staging: {
    base_url: 'https://staging.your-app.com/'
  },
  prod: {
    base_url: 'https://your-app.com/'
  }
};

// Export the config for the chosen environment
module.exports = allUrl[env];
