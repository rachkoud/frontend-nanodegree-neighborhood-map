'use strict';

/*global define, $ */

define(['knockout', 'typeahead.js'], function(ko, Bloodhound) {
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
});
