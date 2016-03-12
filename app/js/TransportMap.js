'use strict';

/*global define, $, google */

define('TransportMap', ['lodash', 'Journey', 'moment', 'Please'], function(_,
  Journey,
  moment, Please) {
  /**
   * TransportMap module.
   * @module TransportMap
   */

  /**
   * Class to load the next leaving [journey]{@link http://transport.opendata.ch/docs.html#journey}s (bus, train, ) from the nearest station and
   * draw markers and connecting line for the [journey]{@link module:Journey}
   * @constructor
   * @alias module:TransportMap
   */
  var TransportMap = function() {
    var self = this;

    /**
     * Google Map
     * @type {google.maps.Map}
     */
    this.map = null;

    /**
     * [Locations API url]{@link http://transport.opendata.ch/docs.html#locations}
     * @type {String}
     */
    this.locationQueryUrl = 'http://transport.opendata.ch/v1/locations';

    /**
     * [Stationboard API url]{@link http://transport.opendata.ch/docs.html#stationboard}
     * @type {String}
     */
    this.stationBoardUrl = 'http://transport.opendata.ch/v1/stationboard';

    /**
     * Create the next leaving journeys (bus, train, ) from [Transport API]{@link http://transport.opendata.ch/docs.html#stationboard} for the station
     * @param {station} [station] Station ([represented by a location object]{@link http://transport.opendata.ch/docs.html#location})
     * @param {datetime} [datetime] datetime
     * @alias createJourneysForStationboard
     * @memberof module:TransportMap
     * @instance
     */
    this.createJourneysForStationboard = function(station, datetime) {
      var url = self.stationBoardUrl + '?id=' + station.id +
        '&limit=5&datetime=' + moment(datetime).format(
          'YYYY-MM-DD hh:mm');

      var deferred = $.Deferred();

      if (station === '') {
        deferred.resolve([]);
      } else {
        // Load journeys (known as stationboard in the Transport API)
        $.getJSON(url, function() {})
          .done(function(data) {
            var journeys = [];
            var id = 0;
            _(data.stationboard).forEach(function(journey) {
              // Create the journeys by using the the stationboard object
              var randomColor = Please.make_color({
                saturation: 1.0
              });
              journeys.push(new Journey(self.map, id++, journey,
                randomColor[0]));
            });

            deferred.resolve(journeys);
          })
          // Manage network or anything else failure
          .fail(function() {
            deferred.reject(
              'Data can\'t be loaded, there is an error with the <a href="http://transport.opendata.ch/">Swiss Transport API</a>'
            );
          });
      }

      return deferred;
    };

    /**
     * Init Google Map
     * @alias initMap
     * @memberof module:TransportMap
     * @instance
     */
    this.initMap = function() {
      this.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 8,
        center: new google.maps.LatLng(46.996719, 6.935708)
      });
    };

    /**
     * Add Google Maps Markers and Info Windos of the [Journeys]{@link module:Journey} checkpoints
     * @param {Journey[]} [journeys] Journeys
     * @param {station} [selectedStation] selected station
     * @alias addMarkersAndDrawLinesOfJourneys
     * @memberof module:TransportMap
     * @instance
     */
    self.addMarkersAndDrawLinesOfJourneys = function(journeys,
      selectedStation) {
      _(journeys).forEach(function(journey) {
        journey.addMarkers(selectedStation);
        journey.drawConnectingCheckpointsLineOnMapForJourney();
      });
    };

    /**
     * Auto zoom/center Google Map for the current journey
     * @alias centerMapForJourney
     * @memberof module:TransportMap
     * @instance
     */
    self.centerMapForJourney = function(journey) {
      var bounds = new google.maps.LatLngBounds();

      if (journey !== undefined && journey !== null && journey.checkpoints !==
        undefined) {
        _(journey.checkpoints).forEach(function(checkpoint) {
          bounds.extend(new google.maps.LatLng({
            lat: checkpoint.coordinate.x,
            lng: checkpoint.coordinate.y
          }));
        });
      }

      // auto-zoom
      self.map.fitBounds(bounds);
      // auto-center
      self.map.panToBounds(bounds);
    };
  };

  return TransportMap;
});
