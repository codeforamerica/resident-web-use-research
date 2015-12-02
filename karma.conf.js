module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['mocha', 'chai', 'sinon-chai', 'fixture'],
    files: [
      'node_modules/leaflet/dist/leaflet.js',
      'node_modules/underscore/underscore.js',
      'node_modules/jquery/dist/jquery.js',
      '*.js',
      'test/**/*Spec.js',
      { pattern: 'test/mocks/**/*' }
    ],
    exclude: [
      '**/*.swp'
    ],
    preprocessors: {
      'lib.js': 'coverage',
      'census-reporter.js': 'coverage'
    },
    reporters: ['progress','coverage'],
    coverageReporter: {
      dir : 'coverage/',
      reporters: [
        { type: 'html', subdir: 'report-html' },
        { type: 'lcov', subdir: 'report-lcov' }
      ]
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['PhantomJS'],
    singleRun: false
  });
};
