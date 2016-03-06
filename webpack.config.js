var webpack = require('webpack');

module.exports = {
  /*entry: './main',*/
  context: __dirname + '/js',
  watch: false,
  output: {
    path: __dirname,
    filename: 'app.js'
  },
  resolve: {
    modulesDirectories: ['js', 'js/vendor', 'node_modules'],
    alias: {
      jquery: 'jquery-2.2.0.min',
      bootstrap: 'bootstrap',
      _: 'lodash',
      ko: 'knockout-3.4.0',
      Bloodhound: 'typeahead.bundle'
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    }),
    new webpack.optimize.UglifyJsPlugin()
  ],
  externals: {
    google: 'google',
    Marker: 'Marker',
    SQUARE_ROUNDED: 'SQUARE_ROUNDED'
  }
};
