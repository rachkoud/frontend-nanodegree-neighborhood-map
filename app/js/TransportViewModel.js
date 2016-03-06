'use strict';

/*global define, $, google */

define('TransportViewModel', ['moment', '_', 'ko', 'toastr', 'koDateTimePicker',
  'koTypeaheadJS', 'koBootstrapModal'
], function(moment, _, ko, toastr) {
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
});
