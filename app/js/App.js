'use strict';

/*global define, require, $ */

define('App', ['TransportViewModel', 'toastr', 'ko', 'moment', 'moment'],
  function(TransportViewModel, toastr, ko) {
    /**
     * App module.
     * @module App
     */

    /**
     * App is the orchestrator, it has an instance of {@link TransportViewModel} which manages user interaction. {@link TransportViewModel} has a
     * dependency to {@link TransportMap} to draw the {@link Journey}s (markers and checkpoins of the Journeys) on the Google Maps
     * @constructor
     * @alias module:App
     */
    var App = function App() {
      var self = this;

      /**
       * @type {TransportMap}
       */
      this.transportMap = null;

      /**
       * @type {TransportViewModel}
       */
      this.transportViewModel = null;

      /**
       * Start the app
       */
      this.start = function() {
        toastr.options = {
          "closeButton": true,
          "timeOut": 0,
          "extendedTimeOut": 0,
          "tapToDismiss": false
        };

        $.getScript("https://maps.googleapis.com/maps/api/js")
          .done(function() {
            $.getScript("js/vendor/map-icons.js")
              .done(function() {
                // To manage async load of Google Maps, we must require TransportMap here and not in define at the top
                // google, Marker, SQUARE_ROUNDED are defined as externals in webpack.config
                var TransportMap = require('TransportMap');

                self.transportMap = new TransportMap();

                self.transportViewModel = new TransportViewModel(self
                  .transportMap);

                self.transportMap.initMap();

                ko.applyBindings(self.transportViewModel);
              })
              .fail(function() {
                toastr.error(
                  'This application relies on Google Maps icons and it can\'t be loaded! Maybe there is a network issue on your side.'
                );
              });
          })
          .fail(function() {
            toastr.error(
              'This application relies on Google Maps and it can\'t be loaded! Maybe there is a network issue on your side.'
            );
          });
      };
    };

    return App;
  });
