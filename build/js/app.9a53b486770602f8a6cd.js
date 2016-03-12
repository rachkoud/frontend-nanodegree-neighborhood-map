webpackJsonp([1],{

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	/*global define, document, window */

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(110)], __WEBPACK_AMD_DEFINE_RESULT__ = function(App) {
	  /**
	   * main module which starts the App when the DOM is loaded
	   * @module main
	   */

	  document.addEventListener("DOMContentLoaded", function() {
	    window.app = new App();
	    window.app.start();
	  });
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },

/***/ 110:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function($) {'use strict';

	/*global define, require, $ */

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(113), __webpack_require__(8), __webpack_require__(3)], __WEBPACK_AMD_DEFINE_RESULT__ = function(TransportViewModel, toastr, ko) {
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
	                var TransportMap = __webpack_require__(112);

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
	  }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ },

/***/ 111:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	/*global define */

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(5), __webpack_require__(4), __webpack_require__(128), __webpack_require__(126), __webpack_require__(127)], __WEBPACK_AMD_DEFINE_RESULT__ = function(
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
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },

/***/ 112:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function($) {'use strict';

	/*global define, $, google */

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(5), __webpack_require__(111), __webpack_require__(4), __webpack_require__(106)], __WEBPACK_AMD_DEFINE_RESULT__ = function(_,
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
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ },

/***/ 113:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function($) {'use strict';

	/*global define, $, google */

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(5), __webpack_require__(4), __webpack_require__(3), __webpack_require__(8),
	  __webpack_require__(115),
	  __webpack_require__(116), __webpack_require__(114)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function(_, moment, ko, toastr) {
	  /**
	   * TransportViewModel module.
	   * @module TransportViewModel
	   */

	  /**
	   * Knockout VM to bind checkpoints, journeys and filter in the left sidebar and the selected station in the autocomplete and the selected datetime
	   * In other words, manage use interaction (except on Google Maps, which is managed by [journey]{@link module:Journey}
	   * @param {TransportMap} transportMap [description]
	   * @constructor
	   * @alias module:TransportViewModel
	   */
	  var TransportViewModel = function(transportMap) {
	    var self = this;

	    /**
	     * Filter checkpoints in the left side panel
	     * @type {ko.observable(String)}
	     */
	    this.filterStationText = ko.observable("");

	    /**
	     * Selected datetime
	     * @type {ko.observable(moment)}
	     */
	    this.selectedDatetime = ko.observable(moment());

	    /**
	     * Selected Journey
	     * @type {ko.observable(Journey)}
	     */
	    this.selectedJourney = ko.observable(null);

	    /**
	     * All journeys for the selected station and datetime
	     * @type {ko.observable(Journey[])}
	     */
	    this.journeys = ko.observable([]);

	    /**
	     * When a station in the autocomplete is selected, this value is automatically binded
	     * @type {ko.observable(String)}
	     */
	    this.selectedStation = ko.observable('');

	    /**
	     * Selected checkpoint
	     * @type {ko.observable(Checkpoint)}
	     */
	    this.selectedCheckpoint = ko.observable(null);

	    /**
	     * Menu state
	     * @type {ko.observable(Boolean)}
	     */
	    this.menuOpenState = ko.observable(false);

	    /**
	     * Show dialog
	     * @type {ko.observable(Boolean)}
	     */
	    this.showDialog = ko.observable(!Boolean(localStorage.getItem(
	      'hideModalApplication')));

	    /**
	     * Do not display anymore startup modal
	     */
	    this.doNotDisplayAnymoreStartupModal = function() {
	      self.showDialog(true);
	      localStorage.setItem('hideModalApplication', true);
	    };

	    /**
	     * All filtered checkpoints binded to the leff sidebar
	     * @type {ko.computed(Checkpoint[])}
	     */
	    this.filteredJourneyCheckpoints = ko.computed(function() {
	      // Due to a strange bug with map incons, we must hide every markers, polylines and infowindow before
	      _(self.journeys.peek()).forEach(function(journey) {
	        journey.connectingCheckpointsLine.setVisible(false);
	        _(journey.markers).forEach(function(markerCheckpoint) {
	          markerCheckpoint.setVisible(false);
	          markerCheckpoint.infoWindow.close();
	        });
	      });

	      // Display the selected journey on Google Maps
	      if (self.selectedJourney() !== undefined && self.selectedJourney() !==
	        null) {
	        self.selectedJourney().connectingCheckpointsLine.setVisible(
	          true);
	        _(self.selectedJourney().markers).forEach(function(
	          markerCheckpoint) {
	          markerCheckpoint.setVisible(true);
	        });
	      }

	      // If many white spaces in a row, replace with only one white space
	      var searchTerm = self.filterStationText().replace(/\s+/g, ' ');

	      var filteredCheckpoints = [];
	      if (self.selectedJourney() !== null && self.selectedJourney() !==
	        undefined) {
	        filteredCheckpoints = ko.utils.arrayFilter(self.selectedJourney()
	          .checkpoints,
	          function(checkpoint) {
	            var checkpointVisible = false;

	            if (searchTerm.length) {
	              checkpointVisible = (checkpoint.locationName.toUpperCase()
	                .indexOf(searchTerm.toUpperCase()) >= 0);
	            } else {
	              checkpointVisible = true;
	            }

	            _(self.selectedJourney().markers).forEach(function(
	              markerCheckpoint) {
	              if (markerCheckpoint.checkpoint.stationId ===
	                checkpoint.stationId) {
	                // Show/hide checkpoins if it contains the search term
	                markerCheckpoint.setVisible(checkpointVisible);

	                // Close infow window of hidden checkpoints
	                if (!checkpointVisible) {
	                  markerCheckpoint.infoWindow.close();
	                }
	              }
	            });

	            return checkpointVisible;
	          });
	      }

	      return filteredCheckpoints;
	    }, self);

	    /**
	     * Highlight selected checkpoin with a specific css class
	     * @param {Checkpoint} [checkpoint] Checkpoint
	     * @return {String} Style class for selected checkpoints in the left sidebar
	     */
	    this.filteredCheckpoinstCss = function(checkpoint) {
	      return self.selectedCheckpoint() !== null && self.selectedCheckpoint()
	        .stationId === checkpoint.stationId ? "checkpoint-selected" :
	        "";
	    };

	    /**
	     * Set the style of checkpoint in left sidebar to distinguish journey by color
	     * @return {Object} Border left color
	     */
	    this.filteredCheckpoinstStyling = function() {
	      return { borderLeftColor: self.selectedJourney().color };
	    };

	    /**
	     * Set the style of journeys in left sidebar to distinguish
	     * * @param {Journey} [journey] Journey
	     * @return {Object} Background color
	     */
	    this.journeyStyling = function(journey) {
	      return journey.id === self.selectedJourney().id ? {
	        backgroundColor: '#000',
	        borderColor: journey.color,
	        borderWidth: '5px',
	        color: '#FFF'
	      } : {
	        borderColor: '#FFF',
	        borderWidth: '3px',
	        backgroundColor: journey.color
	      };
	    };

	    /**
	     * When a checkpoint is clicked on the left sidebar, open the corresponding Google Maps Info Window and change the {@link TransportViewModel#selectedCheckpoint}
	     * @param {checkpoint} [checkpoint] Checkpoint
	     */
	    this.checkpointClicked = function(checkpoint) {
	      self.selectedJourney().openInfoWindowForCheckpoint(checkpoint);

	      self.selectedCheckpoint(checkpoint);
	    };

	    /**
	     * Load journeys for selected station and datetime
	     */
	    this.loadJourneysForSelectedStationAndDatetime = function() {
	      // Load journey only if selected date and selected station is entered
	      if (self.selectedStation() === '') {
	        return;
	      }

	      transportMap.createJourneysForStationboard(self.selectedStation(),
	          self.selectedDatetime())
	        .done(function(journeys) {
	          transportMap.addMarkersAndDrawLinesOfJourneys(journeys,
	            self.selectedStation());
	          self.selectedJourney(journeys.length > 0 ? journeys[0] :
	            null);
	          self.journeys(journeys);

	          transportMap.centerMapForJourney(self.selectedJourney());
	        })
	        // If the stationboard API is unavailable, an error is displayed
	        .fail(function(message) {
	          toastr.error(message);
	        });
	    };

	    // When the user select a station from the autocomplete, the Journey (markers and polyline) is drawn on the map
	    this.selectedStation.subscribe(function() {
	      self.loadJourneysForSelectedStationAndDatetime();
	    });

	    // When the user select a datetime from the datetime picker, the Journey (markers and polyline) is drawn on the map
	    this.selectedDatetime.subscribe(function() {
	      self.loadJourneysForSelectedStationAndDatetime();
	    });

	    /**
	     * Handle hamburger menu
	     */
	    this.handleHamburgerMenu = function() {
	      this.menuOpenState(!this.menuOpenState());

	      google.maps.event.trigger(transportMap.map, 'resize');
	    };

	    /**
	     * Styling for enlarge/reduce content (map), it relies on {@link TransportViewModel#menuOpenState} state
	     */
	    this.contentStyling = ko.pureComputed(function() {
	      return self.menuOpenState() ?
	        "content col-md-12 col-sm-12 col-xs-12" :
	        "content col-md-9 col-sm-9 col-xs-6";
	    });

	    /**
	     * Styling for open/close left sidebar, it relies on {@link TransportViewModel#menuOpenState} state
	     */
	    this.sidebarStyling = ko.pureComputed(function() {
	      return self.menuOpenState() ? "collapsed" : "";
	    });

	    /**
	     * When the user click on a Journey in the left sidebar, the selected journey is changed and loaded
	     * @param  {Journey} journey Journey
	     */
	    this.changeJourney = function(journey) {
	      self.selectedCheckpoint(null);

	      self.selectedJourney(journey);

	      transportMap.centerMapForJourney(this.selectedJourney());
	    };

	    /**
	     * Define typehead options
	     */
	    this.typeaheadOptions = {
	      name: 'stations', // a name for these options
	      displayKey: 'name', // json property that holds the text value, see the filter function below
	      limit: 10, // max results to display to the user
	      minLength: 0, // min input length from the user
	      remote: {
	        url: transportMap.locationQueryUrl + '?query=%query',
	        wildcard: '%query',
	        filter: function(results) {
	          return results.stations;
	        },
	        transport: function(options, onSuccess, onError) {
	          $.ajax(options.url, options)
	            .done(function done(data) {
	              onSuccess(data);
	            })
	            // If the station API is unavailable, an error is displayed
	            .fail(function(request, textStatus, errorThrown) {
	              toastr.error(
	                'Data can\'t be loaded, there is an error with the <a href="http://transport.opendata.ch/">Swiss Transport API</a>'
	              );
	              onError(errorThrown);
	            });
	        }
	      }
	    };
	  };

	  return TransportViewModel;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ },

/***/ 114:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function($) {'use strict';

	/*global define, $ */

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(7)], __WEBPACK_AMD_DEFINE_RESULT__ = function(ko) {
	  /**
	   * koTypeaheadJS module, used to create a [knockout binding]{@link http://knockoutjs.com/documentation/custom-bindings.html} for [TypeHeadJS]{@link https://twitter.github.io/typeahead.js/}
	   * @module koTypeaheadJS
	   */

	  ko.bindingHandlers.modal = {
	    init: function(element, valueAccessor) {
	      $(element).modal({
	        show: false
	      });

	      var value = valueAccessor();
	      if (ko.isObservable(value)) {
	        $(element).on('hide.bs.modal', function() {
	          value(false);
	        });
	      }
	      ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
	        $(element).modal("destroy");
	      });

	    },
	    update: function(element, valueAccessor) {
	      var value = valueAccessor();
	      if (ko.utils.unwrapObservable(value)) {
	        $(element).modal('show');
	      } else {
	        $(element).modal('hide');
	      }
	    }
	  };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ },

/***/ 115:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function($) {'use strict';

	/*global define, $ */

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(7), __webpack_require__(108), __webpack_require__(3), __webpack_require__(4)], __WEBPACK_AMD_DEFINE_RESULT__ = function(
	    bootstrap, datetimepicker, ko) {
	    /**
	     * koDateTimePicker module, used to create a [knockout binding]{@link http://knockoutjs.com/documentation/custom-bindings.html} for [Date/time picker widget]{@link  https://github.com/Eonasdan/bootstrap-datetimepicker}
	     * @module koDateTimePicker
	     */

	    ko.bindingHandlers.dateTimePicker = {
	      // This will be called when the binding is first applied to an element
	      // Set up any initial state, event handlers, etc. here
	      init: function(element, valueAccessor, allBindingsAccessor) {
	        //initialize datepicker with some optional options
	        var options = allBindingsAccessor().dateTimePickerOptions || {};
	        $(element).datetimepicker(options)
	          //when a user changes the date, update the view model
	          .on('dp.change', function(event) {
	            var value = valueAccessor();
	            if (ko.isObservable(value)) {
	              if (event.date !== null && !(event.date instanceof Date)) {
	                value(event.date.toDate());
	              } else {
	                value(event.date);
	              }
	            }
	          });

	        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
	          var picker = $(element).data("DateTimePicker");
	          if (picker) {
	            picker.destroy();
	          }
	        });
	      },
	      // This will be called once when the binding is first applied to an element,
	      // and again whenever any observables/computeds that are accessed change
	      // Update the DOM element based on the supplied values here.
	      update: function(element, valueAccessor) {
	        var picker = $(element).data("DateTimePicker");
	        //when the view model is updated, update the widget
	        if (picker) {
	          var koDate = ko.utils.unwrapObservable(valueAccessor());

	          //in case return from server datetime i am get in this form for example /Date(93989393)/ then fomat this
	          koDate = (typeof(koDate) !== 'object') ? new Date(parseFloat(
	            koDate.replace(/[^0-9]/g, ''))) : koDate;

	          picker.date(koDate);
	        }
	      }
	    };

	  }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ },

/***/ 116:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function($) {'use strict';

	/*global define, $ */

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(109)], __WEBPACK_AMD_DEFINE_RESULT__ = function(ko, Bloodhound) {
	  /**
	   * koTypeaheadJS module, used to create a [knockout binding]{@link http://knockoutjs.com/documentation/custom-bindings.html} for [TypeHeadJS]{@link https://twitter.github.io/typeahead.js/}
	   * @module koTypeaheadJS
	   */

	  ko.bindingHandlers.typeaheadJS = {
	    init: function(element, valueAccessor, allBindingsAccessor) {
	      var el = $(element);
	      var options = ko.utils.unwrapObservable(valueAccessor());
	      var allBindings = allBindingsAccessor();

	      var data = new Bloodhound({
	        datumTokenizer: Bloodhound.tokenizers.obj.whitespace(
	          options.displayKey),
	        queryTokenizer: Bloodhound.tokenizers.whitespace,
	        limit: options.limit,
	        prefetch: options.prefetch, // pass the options from the model to typeahead
	        remote: options.remote // pass the options from the model to typeahead
	      });

	      el.attr("autocomplete", "off").typeahead(null, {
	        name: options.name,
	        displayKey: options.displayKey,
	        // `ttAdapter` wraps the suggestion engine in an adapter that
	        // is compatible with the typeahead jQuery plugin
	        source: data.ttAdapter()

	      }).on('typeahead:selected', function(obj, datum) {
	        // set the selectedStation observable when a user selects an option from the typeahead list
	        allBindings.selectedStation(datum);
	      });
	    }
	  };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ },

/***/ 126:
/***/ function(module, exports) {

	module.exports = Marker;

/***/ },

/***/ 127:
/***/ function(module, exports) {

	module.exports = SQUARE_ROUNDED;

/***/ },

/***/ 128:
/***/ function(module, exports) {

	module.exports = google;

/***/ }

});