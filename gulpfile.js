'use strict';

var gulp = require('gulp'),
  jsdoc = require('gulp-jsdoc3'),
  webpack = require('webpack'),
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
  gulpif = require('gulp-if'),
  csslint = require('gulp-csslint'),
  merge = require('merge-stream'),
  bowerWebpackPlugin = require('bower-webpack-plugin'),
  manifestPlugin = require('webpack-manifest-plugin'),
  chunkManifestPlugin = require('chunk-manifest-webpack-plugin'),
  buildConfig = require('./buildConfig.js'),
  path = require('path'),
  concat = require('gulp-concat');

// Delete the build directory
gulp.task('clean', function() {
  return gulp.src(buildConfig.bases.build).pipe(clean());
});


// Minify styles
gulp.task('styles', ['clean'], function() {
  var appStyles = gulp.src(buildConfig.paths.appStyles)
    .pipe(concat('app.css'))
    .pipe(gulpif(buildConfig.prod, minifyCSS()))
    .pipe(gulp.dest(path.join(buildConfig.bases.build, 'css')));

  var vendorStyles = gulp.src(buildConfig.paths.vendorStyles)
    .pipe(concat('vendor.css'))
    .pipe(gulpif(buildConfig.prod, minifyCSS()))
    .pipe(gulp.dest(path.join(buildConfig.bases.build, 'css')));

  return merge(appStyles, vendorStyles);
});

// Minifies our HTML files and outputs them to build/*.html
gulp.task('content', ['clean', 'scripts'], function() {
  return gulp.src(buildConfig.paths.content, buildConfig.gulpOptionsBuild)
    .pipe(gulpif(buildConfig.prod, minifyhtml({
      empty: true,
      quotes: true
    })))
    .pipe(gulp.dest(buildConfig.bases.build))
});

// Bundle and minify scrips
gulp.task('scripts', ['clean'], function(callback) {
  // run webpack
  webpack(webpackConfig, function(err, stats) {
    if (err) throw new gutil.PluginError('webpack', err);
    gutil.log('[webpack]', stats.toString({
      // output options
    }));
    callback();
  });
});

// Launches a test webserver
gulp.task('webserver', function() {
  gulp.src(buildConfig.bases.build)
    .pipe(webserver({
      livereload: !buildConfig.prod,
      port: 1111
    }));
});

// Copy all other files to dist directly
gulp.task('copy', ['clean'], function() {
  var fonts = gulp.src(['bower_components/bootstrap/dist/fonts/*.*',
      'bower_components/map-icons/dist/fonts/*.*'
    ])
    .pipe(gulp.dest(path.join(buildConfig.bases.build, 'fonts')));

  var mapIcons = gulp.src(
      'bower_components/map-icons/dist/js/map-icons.js')
    .pipe(gulp.dest(path.join(buildConfig.bases.build, 'js', 'vendor')));

  var icons = gulp.src(['*.png', 'favicon.ico'], buildConfig.gulpOptionsApp)
    .pipe(gulp.dest(buildConfig.bases.build));

  return merge(fonts, mapIcons, icons);
});

// Build
gulp.task('build', ['scripts', 'content', 'styles', 'copy'], function() {});

// Watches for changes to our files and executes required scripts
gulp.task('watch', function() {
  gulp.watch(buildConfig.paths.scripts.concat(buildConfig.paths.content,
      buildConfig.paths.appStyles, buildConfig.paths.vendorStyles),
    buildConfig.gulpOptionsApp, [
      'build'
    ]);
});

// Generate doc
gulp.task('doc', function(cb) {
  var jsDocConfig = require('./jsdoc.json');
  gulp.src(['README.md', './js/App.js', './js/Journey.js',
      './js/TransportMap.js',
      './js/koDateTimePicker.js', './js/koTypeaheadJS.js',
      './js/main.js', './js/TransportViewModel.js'
    ], { cwd: buildConfig.bases.app, read: false })
    .pipe(jsdoc(jsDocConfig, cb));
});

// JS Hint
gulp.task('lint', function() {
  return gulp.src('js/*.js', buildConfig.gulpOptionsApp)
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
  return gulp.src(buildConfig.paths.content, buildConfig.gulpOptionsApp)
    .pipe(w3cjs())
    .pipe(w3cjs.reporter());
});

// Validate CSS agains W3C with gulp w3c-css module
gulp.task('gulp-w3c-css', function() {
  return gulp.src(path.join(buildConfig.bases.app, 'css', 'app.css'))
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
  gulp.src(path.join(buildConfig.bases.app, 'css', 'main.css'), buildConfig
      .gulpOptionsApp)
    .pipe(csslint())
    .pipe(csslint.reporter());
});

// Analyze HTML against W3C, JSHint scripts
gulp.task('analyze', ['gulp-w3c-css', 'w3c-html', 'lint'], function() {});

gulp.task('default', ['build', 'watch', 'webserver']);
