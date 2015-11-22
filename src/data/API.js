/*
 * API.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define(['../utils/uri', '../vendor/Base64'], function(uri, Base64){

  /**
   * api function wrapper
   * handles local storage, calls server api, authenticates, etc
   *
   * @example
   *
   * api.prefix = 'my_application_id_';
   * api.init('my application secret');
   *
   * // handling local storage
   * api.get('start');
   * api.set('myData', 'data');
   *
   * @example
   * // retrieve token by logging user in
   * api.set('token', 'MY ACCESS TOKEN');
   *
   * @namespace api
   * @memberof data
   */
  var api = {};

  /**
   * local storage key prefixer (also used for obfuscating)
   * @memberof api
   * @instance
   * @var {String} prefix
   */
  api.prefix = '';

  /**
   * server api endpoint url
   * @memberof api
   * @instance
   * @var {String} prefix
   */
  api.endpoint = '';

  /**
   * encoded storage prefix to obfuscate data
   * @memberof api
   * @instance
   * @var {String} _encodedPrefix
   * @private
   */
  var _encodedPrefix = '';

  /**
   * local storage identifier
   * @memberof api
   * @instance
   * @var {String} _localStorageKey
   * @private
   */
  var _localStorageKey = '';

  /**
   * initializes default values on local storage
   *
   * @method init
   * @memberof api
   * @instance
   **/
  api.init = function(salt){
    _encodedPrefix = Base64.encode(api.prefix + salt);
    _localStorageKey = api.prefix + 'data';

    // if no storage key was found at all
    if (! localStorage[_localStorageKey]) {
      // set basic storage object and generate a unique hash for encoding purposes
      _setLocalStorage({hash: Base64.encode(Math.round(Math.random() * Date.now() * 10000).toString())});
    }
  };

  /**
   * gets a locally stored value by passed key<br>
   * if no key is passed returns object that contains all localStorage items
   *
   * @method get
   * @memberof api
   * @instance
   * @param {String} key to get from local storage
   **/
  api.get = function(key){
    var storage = _getLocalStorage();

    // get all data if no key was set
    if (! key) {
      var data = {};
      var realKey = null;

      for (var k in storage) {
        if (storage.hasOwnProperty(k)) {
          if (k !== 'hash') {
            key = _apiDecode(k);
            data[key] = api.get(key);
          }
        }
      }

      return data;
    }

    key = _apiEncode(key);
    var value = storage[key];

    if (value) {
      value = _apiDecode(value);

      // convert value to an object if it was a json string
      if (value.substring(0, 1) === '{' || value.substring(0, 1) === '[') value = JSON.parse(value);

      // convert value to a number if it is one
      if (isNaN(value) === false) value = parseFloat(value);

      // convert value to a boolean if it is one
      if (value === 'true') value = true;
      if (value === 'false') value = false;

      // return value
      return value;
    }

    return null;
  };

  /**
   * sets data in local storage by key and value
   *
   * @method set
   * @memberof api
   * @instance
   * @param {String} key to set in local storage
   * @param {String} value to set in local storage
   **/
  api.set = function(key, value){
    var storage = _getLocalStorage();

    key = _apiEncode(key);

    // if it has a valid value
    if (value) {
      // if value that should be stored is a json object
      if (typeof value === 'object') {
        // stringify it
        value = JSON.stringify(value);
      }

      // encode the value properly
      storage[key] = _apiEncode(value);
    } else {
      // otherwise just assign null (or whatever it was)
      storage[key] = value;
    }

    _setLocalStorage(storage);
  };

  /**
   * decodes a locally stored hash containing some data<br>
   * **NOTE**: actually gets only really used by authentication and security checks itself
   *
   * @method decodeHash
   * @memberof api
   * @instance
   * @param {String} hash to decode
   **/
  api.decodeHash = function(hash){
    var decoded = Base64.decode(hash);
    return uri.parseQuery(decoded);
  };

  /**
   * calls some data from the server<br>
   * uses {data.fs} request call and converts result to a json
   *
   * @example
   * api.call('GET', '/users/1', function(data){
   *   console.log(data);
   * }, function(error){
   *   console.log(error);
   * });
   *
   * @example
   * api.call({method: 'GET', url: '/users/1'}, callback, error);
   *
   * @example
   * api.call({method: 'POST', url: '/users/1', data: {...}}, callback, error);
   *
   * @example
   * api.call('PUT', {url: '/users/1', data: {...}}, callback, error);
   *
   * @example
   * api.call('users/1', callback);
   *
   * @example
   * api.call('DELETE users/1', callback);
   *
   * @method call
   * @memberof api
   * @instance
   * @public
   * @see data.fs
   **/
  api.call = function(method, options, data, callback, errorCallback){
    // see if method was set in url
    if (typeof method === 'string') {
      if (method.indexOf('GET ') === 0) return api.call('GET', method.replace('GET ', ''), options, data, callback);
      else if (method.indexOf('POST ') === 0) return api.call('POST', method.replace('POST ', ''), options, data, callback);
      else if (method.indexOf('PUT ') === 0) return api.call('PUT', method.replace('PUT ', ''), options, data, callback);
      else if (method.indexOf('DELETE ') === 0) return api.call('DELETE', method.replace('DELETE ', ''), options, data, callback);
    }

    // if no method was specified but has a path:
    // assume method was a simple get call (i.e. api.call('users/1', function(user){}))
    if (! (method === 'GET' || method === 'POST' || method === 'PUT' || method === 'DELETE')) {
      return api.call('GET', method, options, data, callback);
    }

    if (typeof data !== 'object') {
      errorCallback = callback;
      callback = data;
      data = null;
    }

    if (typeof method === 'object') {
      errorCallback = callback;
      callback = options;
      options = method;
    }

    if (typeof options === 'string') {
      options = {url: options, method: method};
    }

    if (data && ! options.data) {
      options.data = data;
    }

    if (callback && ! options.success) options.success = callback;
    if (errorCallback && ! options.error) options.error = errorCallback;

    var success = callback || options.success;
    options.success = null;

    if (options.url.substring(0, 1) === '/') options.url = options.url.substring(1);
    if (options.url.indexOf('http://') === -1 && options.url.indexOf('https://') === -1) options.url = api.endpoint + options.url;

    require('noop/data/fs').request(options, function(result){
      if (result && result.length > 0) {
        if (typeof result !== 'object') {
          result = JSON.parse(result.toString());
        }

        if (success) {
          success(result);
        }
      } else {
        if (errorCallback) {
          errorCallback();
        }
      }
    }, errorCallback);
  };

  /**
   * shorthand for api.call('POST', ...)<br>
   *
   * @example
   * api.post('/users/1', data, function(data){
   *   console.log(data);
   * }, function(error){
   *   console.log(error);
   * });
   *
   * @exampe
   * api.post({url: '/users/1', data: data}, function(result){});
   *
   * @method post
   * @memberof api
   * @instance
   * @public
   * @see data.fs
   **/
  api.post = function(options, data, callback, errorCallback){
    if (typeof data === 'function') {
      errorCallback = callback;
      callback = data;
    }

    if (typeof options === 'string') {
      options = {url: options, data: data};
    }

    if (typeof options !== 'object' || ! options.data) {
      throw new Error('api.post expects some data to be passed');
    }

    api.call('POST', options, callback, errorCallback);
  };

  /**
   * shorthand for api.call('PUT', ...)<br>
   *
   * @example
   * api.put('/users/1', data, callback);
   * api.put({url: '/users/1', data: data}, callback);
   *
   * @method put
   * @memberof api
   * @instance
   * @public
   * @see data.fs
   **/
  api.put = function(options, data, callback, errorCallback){
    if (typeof data === 'function') {
      errorCallback = callback;
      callback = data;
    }

    if (typeof options === 'string') {
      options = {url: options, data: data};
    }

    if (typeof options !== 'object' || ! options.data) {
      throw new Error('api.put expects some data to be passed');
    }

    api.call('PUT', options, callback, errorCallback);
  };

  /**
   * shorthand for api.call('DELETE', ...)<br>
   *
   * @example
   * api.delete('/users/1');
   *
   * @method delete
   * @memberof api
   * @instance
   * @public
   * @see data.fs
   **/
  api.delete = function(options, callback, errorCallback){
    api.call('DELETE', options, callback, errorCallback);
  };

  /**
   * decodes local storage encoded json string
   *
   * @method _getLocalStorage
   * @memberof api
   * @instance
   * @private
   **/
  var _getLocalStorage = function(){
    var data = localStorage[_localStorageKey];

    if (data) {
      data = Base64.decode(data);
      data = JSON.parse(data);
      return data;
    }

    return {};
  };

  /**
   * stringifies passed json value, encodes and stores in local storage
   *
   * @method _setLocalStorage
   * @memberof api
   * @instance
   * @param {object} value to store
   * @private
   **/
  var _setLocalStorage = function(value){
    var data = JSON.stringify(value);
    data = Base64.encode(data);
    localStorage[_localStorageKey] = data;
  };

  /**
   * obfuscate a value by adding a hash generated by api<br>
   * and a prefixed application secred id converted to a base64 hash
   *
   * @method encode
   * @memberof api
   * @instance
   * @param {String} value to obfuscate
   * @private
   **/
  var _apiEncode = function(value){
    var storage = _getLocalStorage();
    return Base64.encode(_encodedPrefix + Base64.encode(value.toString()) + storage.hash);
  };

  /**
   * decoded an obfuscated value generated by _apiEncode
   *
   * @method decode
   * @memberof api
   * @instance
   * @param {String} value that was obfuscated and should be decoded
   * @private
   **/
  var _apiDecode = function(value){
    var storage = _getLocalStorage();
    var decoded = Base64.decode(value);
    decoded = decoded.replace(storage.hash, '');
    decoded = decoded.replace(_encodedPrefix, '');
    decoded = Base64.decode(decoded);
    return decoded;
  };

  return api;
});
