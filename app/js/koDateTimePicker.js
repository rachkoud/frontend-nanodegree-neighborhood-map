'use strict';

/*global define, $ */

define(['bootstrap', 'eonasdan-bootstrap-datetimepicker', 'knockout', 'moment'],
  function(
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

  });
