require('dotenv').config();

const ENV = process.env.ENV || 'dev';

const environments = {
  dev: {
    baseURL: 'https://www.saucedemo.com/',
  },
  staging: {
    baseURL: 'https://staging.your-app.com/',
  },
  prod: {
    baseURL: 'https://your-app.com/',
  },
};

const config = {
  env: ENV,
  baseURL: environments[ENV]?.baseURL || environments.dev.baseURL,
  paths: {
    loginData: '../TestData/LoginData.json',
    checkoutData: '../TestData/CheckoutData.json',
  },
  timeouts: {
    navigation: 30000,
    action: 10000,
    expect: 5000,
  },
  features: {
    uiLogin: true,
    networkMocking: true,
    visualTesting: true,
  },
};

module.exports = config;
