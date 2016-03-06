'use strict';

/*global define, $ */

define(['ko', 'bootstrap'], function(ko) {
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
});
