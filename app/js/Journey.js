'use strict';

/*global define */

define(['lodash', 'moment', 'google', 'Marker', 'SQUARE_ROUNDED'], function(
  _, moment,
  google, Marker, SQUARE_ROUNDED) {
  /**
   * Journey module.
   * @module Journey
   */

  /**
   * A checkpoint represents an arrival or a departure point (in time and space) of a connection.
   * @class Checkpoint
   * @param {transportApiCheckpoint} [Checkpoint] [checkpoint]{@link http://transport.opendata.ch/docs.html#checkpoint} from Transport API
   */
  var Checkpoint = function(transportApiCheckpoint) {

    /**
     * The id of the station
     * @type {String}
     * @alias stationId
     * @memberOf module:Journey~Checkpoint
     * @instance
     */
    this.stationId = transportApiCheckpoint.station.id;

    /**
     * The station name
     * @type {String}
     * @alias stationName
     * @memberOf module:Journey~Checkpoint
     * @instance
     */
    this.stationName = transportApiCheckpoint.station.name;

    /**
     * The location name
     * @type {String}
     * @alias locationName
     * @memberOf module:Journey~Checkpoint
     * @instance
     */
    this.locationName = transportApiCheckpoint.location.name;

    /**
     * The location coordinates
     * @type {Coordinate}
     * @alias coordinate
     * @memberOf module:Journey~Checkpoint
     * @instance
     */
    this.coordinate = new Coordinate(transportApiCheckpoint.location.coordinate
      .x, transportApiCheckpoint.location.coordinate.y);

    /**
     * The arrival time to the checkpoint
     * @type {moment}
     * @alias arrivalDate
     * @memberOf module:Journey~Checkpoint
     * @instance
     */
    this.arrivalDate = moment(transportApiCheckpoint.arrival).format(
      'HH:mm');
  };

  /**
   * Coordinate (x, y)
   * @class Coordinate
   * @param {x} [String] x (longitude)
   * @param {y} [String] y (latitude)
   */
  var Coordinate = function(x, y) {

    /**
     * x (longitude)
     * @type {String}
     * @alias x
     * @memberOf module:Journey~Coordinate
     * @instance
     */
    this.x = x;

    /**
     * y (latitude)
     * @type {String}
     * @alias y
     * @memberOf module:Journey~Coordinate
     * @instance
     */
    this.y = y;
  };

  /**
   * Journey represented by checkpoints and polyline on the Google Map
   * @constructor
   * @alias module:Journey
   */
  var Journey = function(map, id, transportApiJourney, color) {

    /**
     * The id of this journey
     * @type {Number}
     */
    this.id = id;

    /**
     * Google Map
     * @type {google.maps.Map}
     */
    this.map = map;

    /**
     * Checkpoints the train, bus, .. passed on the journey
     * @type {Checkpoint[]}
     */
    this.checkpoints = _.transform(transportApiJourney.passList, function(
      result, pass) { result.push(new Checkpoint(pass)); }, []);

    /**
     * The operator of the connection's line
     * @type {String}
     */
    this.operator = transportApiJourney.operator;

    /**
     * The final destination of this line
     * @type {String}
     */
    this.to = transportApiJourney.to;

    /**
     * The number of the connection's line, e.g. Bus line 2
     * @type {String}
     */
    this.number = transportApiJourney.number;

    /**
     * Color of the markers and the polyline
     * @type {String}
     */
    this.color = color;

    /**
     * Markers on Google Map representing the checkpoints
     * @type {String}
     */
    this.markers = [];
  };

  /**
   * Draw Google Maps polyline connecting all checkpoints
   */
  Journey.prototype.drawConnectingCheckpointsLineOnMapForJourney = function() {
    var checkpointsCoordinates = _.map(this.checkpoints, function(
      checkpoint) {
      return new google.maps.LatLng({
        lat: checkpoint.coordinate.x,
        lng: checkpoint.coordinate.y
      });
    });

    this.connectingCheckpointsLine = new google.maps.Polyline({
      path: checkpointsCoordinates,
      geodesic: false,
      strokeColor: this.color,
      strokeOpacity: 1.0,
      strokeWeight: 2
    });

    this.connectingCheckpointsLine.setMap(this.map);
  };


  /**
   * Remove checkpoints line from Google Map
   */
  Journey.prototype.removeCheckpointsFromMap = function() {
    this.checkpointsPath.setMap(null);
  };


  /**
   * Add Google Maps Markers and Info Windos for the checkpoints
   * @param {station} [station] selectedStation
   */
  Journey.prototype.addMarkers = function(selectedStation) {
    var self = this;

    // Add markers and info window for the checkpoints
    _(this.checkpoints).forEach(function(checkpoint) {
      var markerCheckpoint = new Marker({
        map: self.map,
        position: new google.maps.LatLng(checkpoint.coordinate.x,
          checkpoint.coordinate.y),
        icon: {
          path: SQUARE_ROUNDED,
          fillColor: self.color,
          fillOpacity: 1,
          strokeColor: '',
          strokeWeight: 0,
          scale: 0.5
        },
        map_icon_label: '<span class="map-icon map-icon-transit-station"></span>'
      });

      /**
       * The built in string object.
       * @external "Google Maps"
       */

      /**
       * @name external:"Google Maps".Marker
       * @see {@link https://github.com/scottdejonge/map-icons}
       * @class
       */

      /**
       * checkpoint
       * @type {Checkpoint}
       * @alias checkpoint
       * @memberOf external:"Google Maps".Marker
       * @instance
       */
      markerCheckpoint.checkpoint = checkpoint;

      self.markers.push(markerCheckpoint);

      // When the user click a station in the left sidebar, make the marker bounce to help him locate it on first load
      if (selectedStation.id !== undefined && checkpoint.stationId ===
        selectedStation.id.substring(2)) {
        markerCheckpoint.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
          markerCheckpoint.setAnimation(null);
        }, 1500);
      }

      /**
       * infoWindow (show arrival date in the marker popup)
       * @type {google.maps.InfoWindow}
       * @alias infoWindow
       * @memberOf external:"Google Maps".Marker
       * @instance
       */
      markerCheckpoint.infoWindow = new google.maps.InfoWindow({
        content: '<p>' + checkpoint.stationName + '</p><p>' +
          checkpoint.arrivalDate + '</p>'
      });

      // Open info window on click
      markerCheckpoint.addListener('click', function() {
        markerCheckpoint.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
          markerCheckpoint.setAnimation(null);
        }, 1500);

        markerCheckpoint.infoWindow.open(self.map,
          markerCheckpoint);
      });
    });
  };

  /**
   * Open info windows of the checkpoint
   * @param {checkpoint} [checkpoint] Checkpoint
   */
  Journey.prototype.openInfoWindowForCheckpoint = function(checkpoint) {
    var self = this;

    // Close all popups before
    _(this.markers.forEach(function(markerCheckpoint) {
      markerCheckpoint.infoWindow.close();
    }));

    // Search markers that must be open
    var markerCheckpoints = _.filter(this.markers, function(marker) {
      return marker.checkpoint.stationId === checkpoint.stationId;
    });

    _(markerCheckpoints).forEach(function(markerCheckpoint) {
      // Bounce the markers for 1500 ms
      markerCheckpoint.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function() {
        markerCheckpoint.setAnimation(null);
      }, 1500);

      // Then open the popup associated to the marker
      markerCheckpoint.infoWindow.open(self.map, markerCheckpoint);
    });
  };

  return Journey;
});
