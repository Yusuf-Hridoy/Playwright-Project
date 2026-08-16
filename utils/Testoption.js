const config = require('../config');

// Backward-compatible export: returns the config for the current environment
module.exports = {
  base_url: config.baseURL,
};
