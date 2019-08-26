// Karma configuration
process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function(config) {
  config.set({
    basePath: '',
    // frameworks to use
    frameworks: ['jasmine'],
    files: [
      './../node_modules/fetch-mock/dist/es5/client-bundle.js',

      './../js/**/*.js',
      './**/*.spec.js'
    ],
    exclude: [],
    // preprocess matching files before serving them to the browser
    preprocessors: {
      './../js/**/*.js': 'coverage'
    },
    // test results reporter to use
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'coverage'],
    coverageReporter: {
      type: 'html', dir: '../coverage/'
    },
    // web server port
    port: 9876,
    // enable / disable colors in the output (reporters and logs)
    colors: true,
    // level of logging
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['ChromeHeadless'],
    singleRun: true,
    concurrency: Infinity
  });
};
