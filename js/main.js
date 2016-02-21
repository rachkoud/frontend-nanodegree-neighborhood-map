'use strict';

/*global ko, $, Bloodhound, toastr, Please, _, moment , google, Marker, SQUARE_ROUNDED */

ko.bindingHandlers.typeaheadJS = {
  init: function (element, valueAccessor, allBindingsAccessor) {
    var el = $(element);
    var options = ko.utils.unwrapObservable(valueAccessor());
    var allBindings = allBindingsAccessor();

    var data = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace(options.displayKey),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      limit: options.limit,
      prefetch: options.prefetch, // pass the options from the model to typeahead
      remote: options.remote      // pass the options from the model to typeahead
    });

    el.attr("autocomplete", "off").typeahead(null, {
      name: options.name,
      displayKey: options.displayKey,
      // `ttAdapter` wraps the suggestion engine in an adapter that
      // is compatible with the typeahead jQuery plugin
      source: data.ttAdapter()

    }).on('typeahead:selected', function (obj, datum) {
      // set the selectedStation observable when a user selects an option from the typeahead list
      allBindings.selectedStation(datum);
    });
  }
};

/**
 * Knockout VM to bind checkpoints in the left sidebar and the selected station in the autocomplete
 * @param {TransportMap} transportMap [description]
 * @class TransportViewModel
 * @constructor
 */
var TransportViewModel = function(transportMap) {
  var self = this;
  /**
   * Filter checkpoints in the left side panel
   * @function
   * @alias filterStationText
   * @memberof TransportViewModel
   * @instance
   */
  self.filterStationText = ko.observable("");

  /**
   * All checkpoints for a journey
   * @function
   * @alias journeyCheckpoints
   * @memberof TransportViewModel
   * @instance
   */
  self.journeyCheckpoints = ko.observableArray();

  /**
   * All filtered checkpoints binded to the leff sidebar
   * @function
   * @alias filteredJourneyCheckpoints
   * @memberof TransportViewModel
   * @instance
   */
  self.filteredJourneyCheckpoints = ko.computed(function() {
    // If many white spaces in a row, replace with only one white space
    var searchTerm = self.filterStationText().replace(/\s+/g, ' ');

    var filteredCheckpoints = ko.utils.arrayFilter(self.journeyCheckpoints(), function(checkpoint) {
      var checkpointVisible = false;

      if (searchTerm.length) {
        checkpointVisible = (checkpoint.location.name.toUpperCase().indexOf(searchTerm.toUpperCase()) >= 0);
      } else {
        checkpointVisible = true;
      }

      transportMap.setMarkerVisible(checkpoint, checkpointVisible);

      return checkpointVisible;
    });
    return filteredCheckpoints;
  }, self);

  /**
   * Selected checkpoint
   * @function
   * @alias selectedCheckpoint
   * @memberof TransportViewModel
   * @instance
   */
  self.selectedCheckpoint = ko.observable();

  /**
   * Style class for selected checkpoints in the left sidebar
   * @function
   * @param {location} [location] Location
   * @alias filteredCheckpoinstStyling
   * @memberof TransportViewModel
   * @instance
   */
  self.filteredCheckpoinstStyling = function(location) {
    return self.selectedCheckpoint() !== undefined && self.selectedCheckpoint().station.id === location.station.id ? "checkpoint-selected" : "";
  };

  /**
   * When a checkpoint is clicked on the left sidebar, open the corresponding Google Maps Info Window and change {@link TransportViewModel#selectedCheckpoint}
   * @function
   * @param {checkpoint} [checkpoint] Checkpoint
   * @alias checkpointClicked
   * @memberof TransportViewModel
   * @instance
   */
  self.checkpointClicked = function(checkpoint) {
    transportMap.openInfoWindowForCheckpoint(checkpoint);

    self.selectedCheckpoint(checkpoint);
  };

  /**
   * When a station in the autocomplete is selected, this value is automatically binded
   * @function
   * @alias checkpointClicked
   * @memberof TransportViewModel
   * @instance
   */
  self.selectedStation = ko.observable('');

  // When the user click on the station in the autocomplete, the markers for the journey are added to Google Maps
  // and a line that connect every checkpoints is drawn in the map
  self.selectedStation.subscribe(function() {
    transportMap.loadStationboard(self.selectedStation())
      .done(function(message) {
        transportMap.addMarkersForJourney(self.selectedStation());
        transportMap.drawConnectingCheckpointsLineOnMap();
        transportMap.centerMapForJourney();

        self.journeyCheckpoints(transportMap.journey.passList);

        if (message !== undefined) {
          toastr.success(message);
        }
      })
      // If the stationboard API is unavailable, an error is displayed
      .fail(function(message) {
        toastr.error(message);
      });
  });

  /**
   * Define typehead options
   * @alias typeaheadOptions
   * @memberof TransportViewModel
   * @instance
   */
  self.typeaheadOptions = {
    name: 'stations',   // a name for these options
    displayKey: 'name', // json property that holds the text value, see the filter function below
    limit: 10,          // max results to display to the user
    minLength: 0,       // min input length from the user
    remote: {
      url: transportMap.locationQueryUrl+'?query=%query',
      wildcard: '%query',
      filter: function (results) {
        return results.stations;
      },
      transport: function (options, onSuccess, onError) {
        $.ajax(options.url, options)
          .done(function done(data) {
            onSuccess(data);
          })
          // If the station API is unavailable, an error is displayed
          .fail(function(request, textStatus, errorThrown) {
            toastr.error('Data can\'t be loaded, there is an error with the <a href="http://transport.opendata.ch/">Swiss Transport API</a>');
            onError(errorThrown);
          });
      }
    }
  };
};

/**
 * Class to load the next leaving [journey]{@link http://transport.opendata.ch/docs.html#journey} (bus, train, ) from the nearest station and
 * draw markers and connecting line for the [journey]{@link http://transport.opendata.ch/docs.html#journey}
 * @class TransportMap
 * @constructor
 */
var TransportMap = function () {
  var self = this;

  /**
   * Random color used to drwa the connecting Google Maps polyline for the journey and the Google marker symbol
   * @type {String}
   * @alias randomColor
   * @memberof TransportMap
   * @instance
   */
  self.randomColor = Please.make_color();

  /**
   * Journey loaded
   * @type {stationboard}
   * @alias journey
   * @memberof TransportMap
   * @instance
   */
  self.journey = null
  ;

  /**
   * Google Map
   * @type {google.maps.Map}
   * @alias map
   * @memberof TransportMap
   * @instance
   */
  self.map = null;

  /**
   * Google Maps markers for the {@link TransportMap#journey}
   * @type {Marker}
   * @alias markers
   * @memberof TransportMap
   * @instance
   */
  self.markers = [];

  /**
   * Google Maps connecting line for the {@link TransportMap#journey}
   * @type {google.maps.Polyline}
   * @alias checkpointsPath
   * @memberof TransportMap
   * @instance
   */
  self.checkpointsPath = null;

  /**
   * [Stationboard API url]{@link http://transport.opendata.ch/docs.html#locations}
   * @type {String}
   * @alias locationQueryUrl
   * @memberof TransportMap
   * @instance
   */
  self.locationQueryUrl = 'http://transport.opendata.ch/v1/locations';

  /**
   * [Stationboard API url]{@link http://transport.opendata.ch/docs.html#stationboard}
   * @type {String}
   * @alias stationBoardUrl
   * @memberof TransportMap
   * @instance
   */
  self.stationBoardUrl = 'http://transport.opendata.ch/v1/stationboard';

  /**
   * Load the next leaving [journey]{@link http://transport.opendata.ch/docs.html#stationboard} (bus, train, ) for this station
   * the journey is stored in {@link TransportMap#journey}
   * @function
   * @param {station} [station] Station
   * @alias loadStationboard
   * @memberof TransportMap
   * @instance
   */
  self.loadStationboard = function(station) {
    var url = self.stationBoardUrl + '?id=' + station.id + '&limit=1';

    var deferred = $.Deferred();

    $.getJSON(url, function() {

    })
    .done(function(data) {
      self.journey = _.head(data.stationboard);

      if (self.journey.passList !== undefined) {
        _(self.journey.passList).forEach(function(checkpoint) {
          checkpoint.arrivalDate = moment(checkpoint.arrival).format('HH:mm');
        });
      }

      if (data.station.id !== station.id) {
        deferred.resolve('Could not find an exact station board for ' + station.name + ', the nearest station is ' + self.journey.stop.station.name);
      }
      else {
        deferred.resolve();
      }
    })
    .fail(function() {
      deferred.reject('Data can\'t be loaded, there is an error with the <a href="http://transport.opendata.ch/">Swiss Transport API</a>');
    });

    return deferred;
  };

  /**
   * Init Google Map
   * @function
   * @alias initMap
   * @memberof TransportMap
   * @instance
   */
  self.initMap = function() {
    self.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 8,
      center: new google.maps.LatLng(46.996719, 6.935708)
    });
  };

  /**
   * Draw Google Maps polyline connecting all checkpoints of the {@link TransportMap#journey}
   * @function
   * @alias drawConnectingCheckpointsLineOnMap
   * @memberof TransportMap
   * @instance
   */
  self.drawConnectingCheckpointsLineOnMap = function() {
    var checkpointsCoordinates = _.map(self.journey.passList, function(checkpoint) {
      return new google.maps.LatLng({
          lat: checkpoint.location.coordinate.x,
          lng: checkpoint.location.coordinate.y
        });
    });

    self.checkpointsPath = new google.maps.Polyline({
      path: checkpointsCoordinates,
      geodesic: false,
      strokeColor: self.randomColor,
      strokeOpacity: 1.0,
      strokeWeight: 2
    });

    self.checkpointsPath.setMap(self.map);
  };

  /**
   * Remove checkpoints line from Google Map
   * @function
   * @alias removeCheckpointsFromMap
   * @memberof TransportMap
   * @instance
   */
  self.removeCheckpointsFromMap = function() {
    self.checkpointsPath.setMap(null);
  };

  /**
   * Set marker checkpoint visible
   * @function
   * @param {checkpoint} [checkpoint] Checkpoint
   * @param {Boolean} [visible] Visible
   * @alias setMarkerVisible
   * @memberof TransportMap
   * @instance
   */
  self.setMarkerVisible = function(checkpoint, visible) {
    var filteredMarkerCheckpoints = _.filter(self.markers, function(marker) {
      return marker.checkpoint.station.id === checkpoint.station.id;
    });

    _(filteredMarkerCheckpoints.forEach(function(markerCheckpoint) {
      markerCheckpoint.setVisible(visible);
    }));
  };

  /**
   * Add Google Maps Markers and Info Windos of the {@link TransportMap#journey}'s checkpoints
   * @function
   * @param {station} [station] selectedStation
   * @alias addMarkersForJourney
   * @memberof TransportMap
   * @instance
   */
  self.addMarkersForJourney = function(selectedStation) {
    // Remove old markers
    _(self.markers.forEach(function(markerCheckpoint) {
      markerCheckpoint.setMap(null);
    }));

    self.markers = [];

    // Add markers and info window for journey
    _(self.journey.passList).forEach(function(checkpoint) {
      var markerCheckpoint = new Marker({
        map: self.map,
        position: new google.maps.LatLng(checkpoint.location.coordinate.x, checkpoint.location.coordinate.y),
        icon: {
          path: SQUARE_ROUNDED,
          fillColor: self.randomColor,
          fillOpacity: 1,
          strokeColor: '',
          strokeWeight: 0,
          scale: 0.5
        },
        map_icon_label: '<span class="map-icon map-icon-transit-station"></span>'
      });

      markerCheckpoint.checkpoint = checkpoint;

      self.markers.push(markerCheckpoint);

      // When the user click a station in the list, make the marker bounce
      if (selectedStation.id !== undefined && checkpoint.station.id === selectedStation.id.substring(2)) {
        markerCheckpoint.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
          markerCheckpoint.setAnimation(null);
        }, 1500);
      }

      markerCheckpoint.infoWindow = new google.maps.InfoWindow({
        content: '<p>' + checkpoint.station.name + '</p><p>' + checkpoint.arrivalDate + '</p>'
      });

      // Open info window on click
      markerCheckpoint.addListener('click', function() {
        markerCheckpoint.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
          markerCheckpoint.setAnimation(null);
        }, 1500);

        markerCheckpoint.infoWindow.open(self.map, markerCheckpoint);
      });
    });
  };

  /**
   * Auto zoom/center Google Map for the current journey
   * @function
   * @alias addMarkersForJourney
   * @memberof TransportMap
   * @instance
   */
  self.centerMapForJourney = function() {
    var bounds = new google.maps.LatLngBounds();

    if (self.journey !== null && self.journey !== undefined && self.journey.passList !== undefined) {
      _(self.journey.passList).forEach(function(checkpoint) {
        bounds.extend(new google.maps.LatLng({
          lat: checkpoint.location.coordinate.x,
          lng: checkpoint.location.coordinate.y
        }));
      });
    }

    // auto-zoom
    self.map.fitBounds(bounds);
    // auto-center
    self.map.panToBounds(bounds);
  };

  /**
   * Open info windows of the checkpoint
   * @function
   * @param {checkpoint} [checkpoint] Checkpoint
   * @alias openInfoWindowForCheckpoint
   * @memberof TransportMap
   * @instance
   */
  self.openInfoWindowForCheckpoint = function(checkpoint) {
    _(self.markers.forEach(function(markerCheckpoint) {
      markerCheckpoint.infoWindow.close();
    }));

    var markerCheckpoints = _.filter(self.markers, function(marker) {
      return marker.checkpoint.station.id === checkpoint.station.id;
    });

    _(markerCheckpoints).forEach(function(markerCheckpoint) {
      markerCheckpoint.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function() {
        markerCheckpoint.setAnimation(null);
      }, 1500);

      markerCheckpoint.infoWindow.open(self.map, markerCheckpoint);
    });
  };
};

/**
 * App that handles {@link TransportMap} and {@link TransportViewModel}
 * @class App
 * @constructor
 */
var App = function() {
  var self = this;

  /**
   * @type {TransportMap}
   */
  this.transportMap = new TransportMap();

  /**
   * @type {TransportViewModel}
   */
  this.transportViewModel = new TransportViewModel(this.transportMap);

  /**
   * Start the app
   * @function
   */
  this.start = function() {
    this.transportMap.initMap();

    // Handle collapse menu
    $("#menu-toggle").click(function() {
      $("#sidebar").toggleClass("collapsed");

      $("#content").toggleClass("col-md-12 col-md-9");

      google.maps.event.trigger(self.transportMap.map, 'resize');

    });

    toastr.options = {
      "closeButton": true,
      "timeOut": 0,
      "extendedTimeOut": 0,
      "tapToDismiss": false
    };

    if (!localStorage.getItem('hideModalApplication')) {
      $('#modal-application').modal('show');

      $("#button-modal-application").click(function() {
        localStorage.setItem('hideModalApplication', true);
      });
    }

    ko.applyBindings(this.transportViewModel);
  };
};

// Kick off the app when the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
  var app = new App();
  app.start();
});
