var webpack = require('webpack'),
  path = require('path'),
  bowerWebpackPlugin = require('bower-webpack-plugin'),
  manifestPlugin = require('webpack-manifest-plugin'),
  chunkManifestPlugin = require('chunk-manifest-webpack-plugin'),
  fs = require('fs'),
  _ = require('underscore'),
  buildConfig = require('./buildConfig.js');

var webpackConfig = {
  entry: {
    vendor: ['jquery', 'toastr', 'knockout', 'lodash', 'moment', 'bootstrap',
      'eonasdan-bootstrap-datetimepicker', 'typeahead.js', 'Please'
    ],
    app: './main.js'
  },
  context: __dirname + '/app/js',
  watch: false,
  resolve: {
    modulesDirectories: ['js', 'node_modules'],
    alias: {
      // The main property in bower.json if wrong for pleasejs so we must specify exactly the package
      Please: __dirname + '/bower_components/pleasejs/dist/Please.js',
      // Lodash is resolve from node_modules and it's not the latest version, we force it to resolve it from bower
      lodash: __dirname + '/bower_components/lodash/dist/lodash.js'
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    }),
    new bowerWebpackPlugin({
      includes: /.*\.js/
    })
  ],
  externals: {
    google: 'google',
    Marker: 'Marker',
    SQUARE_ROUNDED: 'SQUARE_ROUNDED'
  }
};

// In production mode :
//  - Uglify JS
//  - Caching
if (buildConfig.prod) {
  webpackConfig.output = {
    path: path.join(buildConfig.bases.build, 'js'),
    filename: '[name].[chunkhash].js',
    chunkFilename: '[name].[chunkhash].js'
  };

  webpackConfig.plugins.push(
    // More info about this technic here : https://medium.com/@okonetchnikov/long-term-caching-of-static-assets-with-webpack-1ecb139adb95#.44l4akv2c
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      filename: 'vendor/[name].[chunkhash].js',
      minChunks: Infinity,
    }),
    new manifestPlugin(),
    new chunkManifestPlugin({
      filename: 'wrong-chunk-manifest.json',
      manifestVariable: 'webpackManifest'
    }),
    // This is a fix due to chunk-manifest-webpack-plugin issue
    // More info here : https://github.com/diurnalist/chunk-manifest-webpack-plugin/issues/6
    // generates correct chunks-manifest-file for js sources
    function() {
      this.plugin('done', function(stats) {
        var result = {}
        stats.toJson().assets.filter(function(item) {
          return item.name.match('.js$') !== null
        }).forEach(function(item) {
          result[item.chunks[0]] = item.name
        })
        fs.writeFileSync(
          path.join(path.join(__dirname, 'build'),
            'chunk-manifest.json'),
          JSON.stringify(result));
      });
    },
    // Remove incorrectly generated file
    function() {
      this.plugin('done', function() {
        fs.unlink(path.join(path.join(__dirname, 'build', 'js'),
          'wrong-chunk-manifest.json'))
      });
    },
    // Replace chunk in index.html
    function() {
      this.plugin('done', function(statsData) {
        var stats = statsData.toJson();
        if (!stats.errors.length) {
          var chunkManifest = JSON.parse(fs.readFileSync(path.join(
            buildConfig.bases.build, 'chunk-manifest.json')));

          var htmlFileName = 'index.html';
          var html = fs.readFileSync(path.join(buildConfig.bases.app,
            htmlFileName), 'utf8');

          var htmlCompiled = _.template(html);
          var htmlReplaced = htmlCompiled({
            webpackManifest: JSON.stringify(chunkManifest) + ';',
            vendorChunkId: _.find(chunkManifest, function(value,
              key) {
              return value.startsWith('vendor');
            }),
            appChunkId: _.find(chunkManifest, function(value, key) {
              return value.startsWith('app');
            })
          });

          fs.writeFileSync(
            path.join(buildConfig.bases.build, 'index.html'),
            htmlReplaced);
        }

      })
    },
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin());
} else {
  webpackConfig.output = {
    path: path.join(buildConfig.bases.build, 'js'),
    filename: 'app.js'
  };

  webpackConfig.plugins.push(
    new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor/vendor.js'),
    // Replace chunk in index.html
    function() {
      this.plugin('done', function(statsData) {
        var stats = statsData.toJson();

        if (!stats.errors.length) {
          var htmlFileName = 'index.html';
          var html = fs.readFileSync(path.join(buildConfig.bases.app,
              htmlFileName),
            'utf8');

          var htmlCompiled = _.template(html);
          var htmlReplaced = htmlCompiled({
            webpackManifest: '{};',
            vendorChunkId: 'vendor/vendor.js',
            appChunkId: 'app.js'
          });

          fs.writeFileSync(
            path.join(buildConfig.bases.build, htmlFileName),
            htmlReplaced);
        }
      })
    });
}

module.exports = webpackConfig;
