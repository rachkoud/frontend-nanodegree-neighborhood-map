Swiss Transport API POC
=======================

This application relies on [http://knockoutjs.com/](http://knockoutjs.com/) and is part of the [Front-End Web Developer Nanodegree](https://www.udacity.com/course/front-end-web-developer-nanodegree--nd001), it uses the [Swiss Transport API](https://transport.opendata.ch/) and [Google Maps API](https://developers.google.com/maps/).

You can try to search a Swiss Stations, for example, Bern, Lausanne, Moudon, .. the application will try to search the next connections leaving from this specific location. It even works with some location outside of the Switzerland, like Paris, ..

[Try it!](http://rachkoud.github.io/frontend-nanodegree-neighborhood-map/build/index.html)

##### Kown issues

*   The marker animation works incorrectly [#24](https://github.com/scottdejonge/map-icons/issues/24)

##### Futher improvments

*   With the [stationboard API](http://transport.opendata.ch/docs.html#stationboard), we can use a datetime to display the next journey at thi datetime.
*   Better, we can use the [connections API](http://transport.opendata.ch/docs.html#connections) to display a journey from, to a destination, yes, that's what Google Maps already do, but it's intersting!.

##### Principal libraries used

*   [Map Icons](http://map-icons.com/)
*   [Random color generator](http://www.checkman.io/please/)
*   [typeahead.js](https://twitter.github.io/typeahead.js/)

##Documentation

- [Code documentation](http://rachkoud.github.io/frontend-nanodegree-neighborhood-map/docs/)

##Installation
This will build and run the server on http://localhost:1111/ from the build directory

    npm install
    bower install
    gulp

##Development

    gulp

This will run the webserver from the build directory with livereload

##Production

    gulp --prod

This will minify everything (js, html and css) and add JS caching

##JavaScript documentation

    gulp doc

Generate documentation

##Analyze code
Check Javascript with JSHint, HTML5 and CSS validation against the [W3C validator](https://validator.w3.org/)

    gulp analyze

##Webpack

    node_modules/.bin/webpack --config ./webpack.config.js

