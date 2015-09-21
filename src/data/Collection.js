/*
 * Collection.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define([
  '../sys',
  'EaselJS',
  './Model',
  './fs',
  './API'
], function(
  sys,
  createjs,
  Model,
  fs,
  API
) {
  /**
   * A collection holds and manages several models in an array
   *
   * @example
   * var collection = new Collection('User', [1, 2, 10]);
   * collection.pull(_pulled);
   *
   * @class Collection
   * @extends data.Model
   * @memberof data
   * @param {String} model the class name of the collection's model (i.e. user.hasMany = 'apps' //model = 'apps')
   * @param {object|Number} data is either a data object or an id of the model that should be fetched
   **/
  function Collection(model, data){
    this.model = model.toLowerCase();

    Model.call(this);

    if (data) {
      if (! Array.isArray(data)) data = [data];

      var _allLoaded = true;
      var _allCached = true;
      var _allDefinedData = true;

      for (var i = 0; i < data.length; i++) {
        var instance = Model.factory(this.modelClass, data[i]);
        this[i] = instance;

        if (! instance._loaded) _allLoaded = false;
        if (! instance._cached) _allCached = false;
        if (! instance._definedData) _allDefinedData = false;
      }

      // if at least one instance of the collection did not load yet: define collection to be not ready yet
      this._loaded = _allLoaded;
      this._cached = _allCached;
      this._definedData = _allDefinedData;
    }

    this.length = this.getCount();
  }

  var p = sys.extend(Collection, Model);

  /**
   * loops through collection items and calls callback for each of the items
   * @method each
   * @memberof data.Collection
   * @instance
   * @protected
   * @param {Function} callback (item, index)
   **/
  p.each = function(callback){
    if (callback) {
      var items = this.getItems();

      for (var i = 0, _len = items.length; i < _len; i++) {
        callback.call(this, items[i], i);
      }
    }

    return this;
  };

  /**
   * gets collection's specific url for pulling data
   * @method getPullURL
   * @memberof data.Collection
   * @instance
   * @protected
   **/
  p.getPullURL = function(){
    var ids = [];
    var items = this.getItems();

    for (var i = 0, _len = items.length; i < _len; i++) {
      ids.push('ids[]=' + items[i].id);
    }

    return API.endpoint + this.model + 's' + '?' + ids.join('&') + this.getQuery().replace('?', '&');
  };

  /**
   * gets collection's specific url for pushing data
   * @method getPushURL
   * @memberof data.Collection
   * @instance
   * @protected
   **/
  p.getPushURL = function(){
    return API.endpoint + this.model + 's';
  };

  /**
   * gets how many items the collection contains
   *
   * @method getCount
   * @memberof data.Collection
   * @public
   **/
  p.getCount = function(){
    return this.getItems().length;
  };

  /**
   * gets all collection models as an array
   *
   * @method getItems
   * @memberof data.Collection
   * @public
   **/
  p.getItems = function(deep, caller){
    var items = [];

    for (var k in this) {
      // if key is numeric (assume it's an item of the collection)
      if (this.hasOwnProperty(k) && ! isNaN(k)) {
        if (! items[parseFloat(k)]) {
          items.push(this[k]);
        }
      }
    }

    return items;
  };

  /**
   * overwrite get method. only call individual item's get function
   *
   * @method get
   * @memberof data.Model
   * @public
   * @instance
   * @param {String} key (optional)
   **/
  p.get = function(key, caller){
    var items = this.getItems();
    var data = [];

    for (var i = 0, _len = items.length; i < _len; i++) {
      // if key was set to true (i.e. if it wanted to deep trace collection)
      // call get on individual items by deep tracing, otherwise simply get plain item data
      var item = items[i].get(key, caller);
      data.push(item);
    }

    return data;
  };

  /**
   * overwrite set method by calling parent's set and storing collection count afterwards
   * @example
   * collection.set([{id: '1', version: '10', name: 'application'}]);
   *
   * @method set
   * @memberof data.Collection
   * @override
   * @instance
   * @public
   * @param {object|String} dataOrKey should be either
   * * a number (assumes it sets the model's id)
   * * an object with key-value pairs
   * * a key string (in this case needs to add value as second parameter)
   * @param {object|String} value to set on model
   **/
  p.set = function(dataOrKey, value){
    Model.prototype.set.call(this, dataOrKey, value);
    this.length = this.getCount();
  };

  /**
   * downloads model from server and stores it to a local file
   *
   * @method download
   * @memberof data.Collection
   * @instance
   * @protected
   * @param {function} callback
   * @param {function} errorCallback
   **/
  p.download = function(callback, errorCallback){
    var run = function(options){
      var error = options.error;

      options.error = function(err){
        if (options.overwrite === 'try') {
          options.error = error;
          options.overwrite = false;
          run(options);
        } else {
          if (error) {
            error(err);
          }
        }
      };

      var data = [];

      var getItem = function(index){
        if (options.local[index]) {
          var localPath = fs.correctLocalFilePath(options.local[index]);

          fs.exists(localPath, function(exists){
            if (exists && ! options.overwrite) {
              fs.readFile(localPath, function(result){
                if (typeof result !== 'object') {
                  result = JSON.parse(result.toString());
                }

                data.push(result);
                getItem(index + 1);
              }, options.error);
            } else {
              fs.request(options.remote, function(result){
                if (typeof result !== 'object') {
                  result = JSON.parse(result.toString());
                }

                var writeItem = function(itemIndex){
                  if (result[itemIndex]) {
                    fs.writeFile(options.local[itemIndex], JSON.stringify(result[itemIndex]), function(){
                      writeItem(itemIndex + 1);
                    });
                  } else {
                    if (options.success) {
                      options.success(result);
                    }
                  }
                };

                writeItem(0);
              }, options.error);
            }
          });
        } else {
          if (options.success) {
            options.success(data);
          }
        }
      };

      getItem(0);
    };

    var options = {};
    options.overwrite = this.overwrite;
    options.success = callback;
    options.error = errorCallback;
    options.remote = this.getPullURL();
    options.local = [];

    var items = this.getItems();

    for (var i = 0, _len = items.length; i < _len; i++) {
      options.local.push('json/' + this.model + 's/' + this.model + '-' + items[i].id + '.json');
    }

    run(options);
  };

  /**
   * factories a new model collection
   *
   * @method factory
   * @memberof data.Collection
   * @public
   * @static
   * @example
   * Collection.factory('User', [1, 2, 5]);
   * @param {String} model a string of the model (i.e. 'User')
   * @param {object} data (optional). if defined returns the stored model if it already exists
   **/
  Collection.factory = function(model, data) {
    return new Collection(model, data);
  };

  return Collection;
});
