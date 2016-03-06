'use strict';

/*global define, document, window */

define('main', ['App'], function(App) {
  /**
   * main module which starts the App when the DOM is loaded
   * @module main
   */

  document.addEventListener("DOMContentLoaded", function() {
    window.app = new App();
    window.app.start();
  });
});
