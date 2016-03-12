var argv = require('yargs').argv,
  path = require('path');

// app contains the sources and build has the optimizations
var bases = {
  app: path.join(__dirname, 'app'),
  build: path.join(__dirname, 'build'),
};

// Paths to various files
var paths = {
  scripts: ['js/**/*.js'],
  vendorStyles: ['bower_components/bootstrap/dist/css/bootstrap.css',
    'bower_components/bootstrap/dist/css/bootstrap-theme.css',
    'bower_components/map-icons/dist/css/map-icons.css',
    'bower_components/toastr/toastr.css',
    'bower_components/eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.css',
    bases.app + 'css/app.css',
  ],
  appStyles: [path.join(bases.app, 'css', 'app.css')],
  images: ['image/**/*'],
  content: ['index.html']
}

var gulpOptionsApp = { cwd: bases.app };
var guldOptionsBuild = { cwd: bases.build };

var prod = argv.prod || false;
console.log('Build in production mode : ' + prod);

module.exports = {
  bases: bases,
  paths: paths,
  gulpOptionsApp: gulpOptionsApp,
  gulpOptionsBuild: guldOptionsBuild,
  prod: prod
};
