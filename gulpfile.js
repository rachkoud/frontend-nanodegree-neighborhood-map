'use strict';

var gulp = require('gulp'),
  jsdoc = require('gulp-jsdoc3'),
  webpackStream = require('webpack-stream'),
  webpack = require('webpack'),
  webserver = require('gulp-webserver'),
  minifyCSS = require('gulp-minify-css'),
  minifyhtml = require('gulp-minify-html'),
  webpackConfig = require('./webpack.config.js'),
  clean = require('gulp-clean'),
  jshint = require('gulp-jshint'),
  notify = require('gulp-notify'),
  w3cjs = require('gulp-w3cjs'),
  gulpW3cCss = require('gulp-w3c-css'),
  async = require('async'),
  w3cCss = require('w3c-css'),
  gutil = require('gulp-util'),
  argv = require('yargs').argv,
  gulpif = require('gulp-if'),
  csslint = require('gulp-csslint');

// app contains the sources and build has the optimizations
var bases = {
  app: 'app/',
  build: 'build/',
};

// Paths to various files
var paths = {
  scripts: ['js/**/*.js'],
  styles: ['css/**/*.css'],
  images: ['image/**/*'],
  content: ['index.html'],
  copy: ['**/*.woff', '**/*.ttf', 'js/vendor/map-icons.js', '*.png']
}

var gulpOptions = { cwd: bases.app };

var dev = argv.dev || false;
console.log('Dev : ' + dev);

// Delete the build directory
gulp.task('clean', function() {
  return gulp.src(bases.build).pipe(clean());
});


// Minify styles
gulp.task('styles', ['clean'], function() {
  return gulp.src(paths.styles, gulpOptions)
    .pipe(gulpif(!dev, minifyCSS()))
    .pipe(gulp.dest(bases.build + 'css'))
});

// Minifies our HTML files and outputs them to build/*.html
gulp.task('content', ['clean'], function() {
  return gulp.src(paths.content, gulpOptions)
    .pipe(gulpif(!dev, minifyhtml({
      empty: true,
      quotes: true
    })))
    .pipe(gulp.dest(bases.build))
});

// Bundle and minify scrips
gulp.task('scripts', ['clean'], function() {
  if (dev) {
    // Do not minify!
    webpackConfig.plugins = [
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery'
      })
    ];
  }

  // Todo : use the chunk technic and vendor separation : https://medium.com/@okonetchnikov/long-term-caching-of-static-assets-with-webpack-1ecb139adb95#.dheux9gjd
  return gulp.src(bases.app + 'js/main.js')
    .pipe(webpackStream(webpackConfig))
    .pipe(gulp.dest(bases.build + 'js'));
});

// Launches a test webserver
gulp.task('webserver', function() {
  gulp.src(bases.build)
    .pipe(webserver({
      livereload: dev,
      port: 1111
    }));
});

// Copy all other files to dist directly
gulp.task('copy', ['clean'], function() {
  return Promise.all([
    new Promise(function(resolve, reject) {
      gulp.src(paths.copy, gulpOptions)
        .pipe(gulp.dest(bases.build))
        .on('error', reject)
        .on('end', resolve)
    }),
    new Promise(function(resolve, reject) {
      gulp.src('js/vendor/map-icons.js', gulpOptions)
        .pipe(gulp.dest(bases.build + 'js/vendor'))
        .on('error', reject)
        .on('end', resolve)
    })
  ]);
});

// Build
gulp.task('build', ['scripts', 'content', 'styles', 'copy'], function() {});

// Watches for changes to our files and executes required scripts
gulp.task('watch', function() {
  gulp.watch(paths.scripts.concat(paths.content, paths.styles), gulpOptions, [
    'build'
  ]);
});

// Generate doc
gulp.task('doc', function(cb) {
  var config = require('./jsdoc.json');
  gulp.src(['README.md', './js/App.js', './js/Journey.js',
      './js/TransportMap.js',
      './js/koDateTimePicker.js', './js/koTypeaheadJS.js',
      './js/main.js', './js/TransportViewModel.js'
    ], { cwd: bases.app, read: false })
    .pipe(jsdoc(config, cb));
});

// JS Hint
gulp.task('lint', function() {
  return gulp.src('js/*.js', gulpOptions)
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'))
    .pipe(notify({
      title: 'JSHint',
      message: 'JSHint Passed. Let it fly!',
    }))
});

// Validate HTML against W3C
gulp.task('w3c-html', function() {
  return gulp.src(paths.content, gulpOptions)
    .pipe(w3cjs())
    .pipe(w3cjs.reporter());
});

// Validate CSS agains W3C with gulp w3c-css module
gulp.task('gulp-w3c-css', function() {
  return gulp.src('css/main.css', gulpOptions)
    .pipe(gulpW3cCss())
    .pipe(gutil.buffer(function(err, files) {
      console.log(err);
      files.forEach(function(file, index, array) {
        var result = JSON.parse(file.contents.toString());

        console.log(result);
      });
      // err - an error encountered
      // files - array of validation results
      // files[i].contents is empty if there are no errors or warnings found
    }));
});

// CSS Lint
gulp.task('css-lint', function() {
  gulp.src('css/main.css', gulpOptions)
    .pipe(csslint())
    .pipe(csslint.reporter());
});

// Analyze HTML against W3C, JSHint scripts
gulp.task('analyze', ['gulp-w3c-css', 'w3c-html', 'lint'], function() {});

gulp.task('default', ['build', 'watch', 'webserver']);
