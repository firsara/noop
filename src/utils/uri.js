/*
 * uri.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define(function(){

  /**
   * @example
   *
   * uri(window.location.href).getQuery('page')
   * uri.parse('http://www.google.de?q=search').getQuery('q')
   *
   * @class URI
   **/
  function URI(url){
    if (! url) url = window.location.href.toString();

    // store url that needs to be parsed
    this.url = url;

    // and parse protocol string properly
    this.protocol = uri.extractProtocol(this.url);

    // and parse domain string properly
    this.domain = uri.extractDomain(this.url);

    // and parse port string properly
    this.port = uri.extractPort(this.url);

    // and parse path string properly
    this.path = uri.extractPath(this.url);

    // and parse query string properly
    this.query = uri.parseQuery(this.url);

    // and parse hash string properly
    this.hash = uri.extractHash(this.url);

    // and parse hostname properly
    this.host = this.domain + (this.port.length > 0 ? ':' + this.port : '');
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
    if (! key) {
      var parts = [];

      for (var k in this.query) {
        parts.push(k + '=' + this.query[k]);
      }

      var str = parts.join('&');
      if (str.length > 0) str = '?' + str;

      return str;
    }

    return this.query[key];
  };

  /**
   * joins parsed uri parts to generate full path
   *
   * @method join
   * @memberof URI
   * @instance
   * @param {Array} options which parts should be included (includes all parts by default):
   * * "protocol"
   * * "domain"
   * * "port"
   * * "path"
   * * "query"
   * * "hash"
   **/
  URI.prototype.join = function(options){
    if (! options) options = ['protocol', 'domain', 'port', 'path', 'query', 'hash'];

    var str = '';

    if (options.indexOf('protocol') !== -1) str += this.protocol;
    if (options.indexOf('domain') !== -1) str += this.domain;
    if (options.indexOf('port') !== -1) str += (this.port.length > 0 ? ':' + this.port : '');
    if (options.indexOf('path') !== -1)  str += this.path;
    if (options.indexOf('query') !== -1) str += this.getQuery();
    if (options.indexOf('hash') !== -1) str += this.hash;

    return str;
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
   * extracts the domain of a specific url
   *
   * @example
   *
   * uri.extractProtocol('http://www.youtube.com/?v=12345') // http://
   * uri.extractProtocol('https://youtube.com/?v=12345') // https://
   * uri.extractProtocol('file:///Users/username/path/file.png') // file://
   * uri.extractProtocol('www.youtube.com') // ''
   *
   * @method extractProtocol
   * @memberof uri
   * @param {String} url that should be parsed
   **/
  uri.extractProtocol = function(url) {
    var index = url.indexOf('://');
    if (index === -1) return '';
    return url.substring(0, index + 3);
  };

  /**
   * extracts the domain of a specific url
   *
   * @example
   *
   * uri.extractDomain('http://www.youtube.com/?v=12345') // www.youtube.com
   * uri.extractDomain('https://youtube.com/?v=12345') // youtube.com
   *
   * @method extractDomain
   * @memberof uri
   * @param {String} url that should be parsed
   **/
  uri.extractDomain = function(url) {
    var domain = null;

    //find & remove protocol (http, ftp, etc.) and get domain
    if (url.indexOf('://') > -1) {
      domain = url.split('/')[2];
    } else {
      domain = url.split('/')[0];
    }

    //find & remove port number
    return domain.split(':')[0];
  };

  /**
   * extracts the domain of a specific url
   *
   * @example
   *
   * uri.extractPort('http://www.youtube.com:1337/?v=12345') // 1337
   * uri.extractPort('https://youtube.com/?v=12345') // ''
   *
   * @method extractPort
   * @memberof uri
   * @param {String} url that should be parsed
   **/
  uri.extractPort = function(url) {
    url = url.replace(uri.extractProtocol(url), '');

    var portIndex = url.indexOf(':');
    var pathIndex = url.indexOf('/');
    var queryIndex = url.indexOf('?');
    var hashIndex = url.indexOf('#');

    var subIndex = pathIndex;
    if (queryIndex !== -1 && queryIndex < pathIndex) subIndex = queryIndex;
    if (hashIndex !== -1 && hashIndex < pathIndex) subIndex = hashIndex;

    if (portIndex === -1) return '';
    if (subIndex !== -1 && subIndex < portIndex) return '';

    if (subIndex === -1) return url.substring(portIndex + 1);
    return url.substring(portIndex + 1, subIndex);
  };

  /**
   * extracts the domain of a specific url
   *
   * @example
   *
   * uri.extractPath('http://www.youtube.com:1337/?v=12345') // '/'
   * uri.extractPath('http://youtube.com/users/1/') // '/users/1/'
   * uri.extractPath('http://youtube.com') // ''
   *
   * @method extractPath
   * @memberof uri
   * @param {String} url that should be parsed
   **/
  uri.extractPath = function(url) {
    url = url.replace(uri.extractProtocol(url), '');

    var pathIndex = url.indexOf('/');
    var queryIndex = url.indexOf('?');
    var hashIndex = url.indexOf('#');

    var subIndex = queryIndex;
    if (hashIndex !== -1 && hashIndex < pathIndex) subIndex = hashIndex;

    if (pathIndex === -1) return '';

    if (subIndex === -1) return url.substring(pathIndex);
    return url.substring(pathIndex, subIndex);
  };

  /**
   * parses a query string and returns a key-value object
   *
   * @example
   *
   * uri.parseQuery('username=me&password=secret') // {username: 'me', password: 'secret'}
   * uri.parseQuery('http://www.site.com/?username=me&password=secret') // {username: 'me', password: 'secret'}
   *
   * @method parseQuery
   * @memberof uri
   * @param {String} url that should be parsed
   **/
  uri.parseQuery = function(url){
    // remove hash from url
    url = url.replace(uri.extractHash(url), '');

    // assume url has no query string at all
    var query = '';

    // if it has a query string
    if (url.indexOf('?') >= 0) {
      // store it
      query = url.substring(url.indexOf('?'));
    }

    var data = {};
    query = query.replace('?', '').split('&');

    for (var i = 0, _len = query.length; i < _len; i++) {
      if (query[i].length === 0) continue;
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

  /**
   * extracts the domain of a specific url
   *
   * @example
   *
   * uri.extractHash('http://www.youtube.com:1337/?v=12345') // ''
   * uri.extractHash('http://youtube.com/users/1/#test') // '#test'
   *
   * @method extractHash
   * @memberof uri
   * @param {String} url that should be parsed
   **/
  uri.extractHash = function(url) {
    var index = url.indexOf('#');
    if (index === -1) return '';
    return url.substring(index);
  };

  return uri;
});
