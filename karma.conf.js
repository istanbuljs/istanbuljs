var browserifyIstanbul = require('browserify-istanbul'),
    aliasify = require('aliasify');

module.exports = function (config) {
    config.set({
        coverageReporter: {
            reporters: [
                {type: 'json'},
                {type: 'html'},
                {type: 'text-summary'}
            ]
        },
        frameworks: ['mocha', 'browserify'],
        files: [
            'lib/instrumenter.js',
            'test/**/*.js'
        ],
        exclude: [],
        browserify: {
            transform: [
                aliasify,
                browserifyIstanbul()
            ]
        },
        preprocessors: {
            './lib/**/*.js': ['browserify'],
            './test/**/*.js': ['browserify']
        },
        reporters: ['progress', 'coverage'],
        autoWatch: false,
        browsers: ['Chrome','PhantomJS'],
        singleRun: true,
        logLevel: config.LOG_INFO
    });
};

