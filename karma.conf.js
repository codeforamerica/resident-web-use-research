module.exports = function(config) {
  config.set({

    basePath: '',
    frameworks: ['mocha', 'chai', 'sinon-chai', 'fixture'],
    files: [
      'node_modules/leaflet/dist/leaflet.js',
      '*.js',
      'test/**/*Spec.js'
    ],
    exclude: [
      '**/*.swp'
    ],
    preprocessors: {
      '**/*.json'   : ['html2js'],
      'lib.js': 'coverage'
    },
    reporters: ['progress','coverage'],
    coverageReporter: {
      type : 'lcov',
      dir : 'coverage/'
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['PhantomJS'],
    singleRun: false
  });
};
