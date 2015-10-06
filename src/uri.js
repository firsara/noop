/*
 * uri.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define(function(){

  // TODO: also parse TLD, path, etc.

  /**
   * @example
   *
   * uri(window.location.href).getQuery('page')
   * uri.parse('http://www.google.de?q=search').getQuery('q')
   *
   * @class URI
   **/
  function URI(url){
    // store url that needs to be parsed
    this.url = url;

    // assume url has no query string at all
    var query = '';

    // if it has a query string
    if (this.url.indexOf('?') >= 0) {
      // store it
      query = this.url.substring(this.url.indexOf('?'));
    }

    // and parse query string properly
    this.query = uri.parseQuery(query);
  }

  /**
   * gets a query value by key
   *
   * @method getQuery
   * @memberof URI
   * @instance
   * @param {String} key to get from query string
   **/
  URI.prototype.getQuery = function(key){
    return this.query[key];
  };

  /**
   * shorthand function to call new URI(path)
   *
   * @method uri
   * @memberof URI
   * @instance
   **/
  var uri = function(url){
    return new URI(url);
  };

  /**
   * parses a url's individual parts (query, tld, path, etc)
   *
   * @method parse
   * @memberof uri
   * @param {String} url that should be parsed
   **/
  uri.parse = function(url){
    var instance = new URI(url);
    return instance;
  };

  /**
   * parses a query string and returns a key-value object
   *
   * @exmaple
   *
   * uri.parseQuery('username=me&password=secret') // {username: 'me', password: 'secret'}
   *
   * @method parseQuery
   * @memberof uri
   * @param {String} query that should be parsed
   **/
  uri.parseQuery = function(query){
    var data = {};
    query = query.replace('?', '').split('&');

    for (var i = 0, _len = query.length; i < _len; i++) {
      var keyValuePair = query[i].split('=');
      var key = keyValuePair[0];
      var value = keyValuePair[1];
      if (! isNaN(value)) value = parseFloat(value);
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      data[key] = value;
    }

    return data;
  };

  return uri;
});
