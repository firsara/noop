/*
 * Collection.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define([
  '../sys',
  './Model',
  './fs',
  './API'
], function(
  sys,
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
    this.model = model.substring(0, 1).toLowerCase() + model.substring(1);

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

  p.toString = function(){
    return '[object Collection]';
  };

  /**
   * wheter all items already have an ID defined
   * @method allLoaded
   * @memberof data.Collection
   * @instance
   * @public
   **/
  p.allLoaded = function(){
    var items = this.getItems();
    var allHaveId = true;

    for (var i = 0, _len = items.length; i < _len; i++) {
      if (! items[i].id) {
        allHaveId = false;
        break;
      }
    }

    return allHaveId;
  };

  /**
   * loops through collection items and calls callback for each of the items
   * @method each
   * @memberof data.Collection
   * @instance
   * @public
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
   * adds an item to the collection list
   * @method add
   * @memberof data.Collection
   * @instance
   * @public
   * @param {Model|Object} item that should be added to the collection
   **/
  p.add = function(item){
    this.addAt(item, this.length);
  };

  /**
   * adds an item to the collection list at a specific index
   * @method add
   * @memberof data.Collection
   * @instance
   * @public
   * @param {Model|Object} item that should be added to the collection
   * @param {Number} index of index where it should be added to
   **/
  p.addAt = function(item, index){
    if (index === null || typeof index === 'undefined') index = this.length;

    var instance = item;

    if (item instanceof Model === false) {
      instance = Model.factory(this.modelClass, item);
    }

    var current = this.getItems();
    current.splice(index, 0, instance);

    for (var i = 0, _len = current.length; i < _len; i++) {
      this[i] = current[i];
    }

    this.length++;
  };

  /**
   * removes an item from the collection list
   * @method remove
   * @memberof data.Collection
   * @instance
   * @public
   **/
  p.remove = function(item){
    var items = this.getItems();
    var index = -1, i, _len;

    for (i = 0, _len = items.length; i < _len; i++) {
      if (items[i] === item) {
        index = i;
      }

      delete this[i];
    }

    if (index !== -1) {
      items.splice(index, 1);
    }

    for (i = 0, _len = items.length; i < _len; i++) {
      this[i] = items[i];
    }

    this.length = items.length;

    return i;
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
    var _len = items.length;

    if (_len === 0) {
      return API.endpoint + this.model + 's';
    }

    for (var i = 0; i < _len; i++) {
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
    if (this.allLoaded()) return this.getPullURL();
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
   * gets all collection models as an array by filtering through specific options
   *
   * @method filter
   * @memberof data.Collection
   * @public
   **/
  p.filter = function(filter){
    var items = this.getItems();
    var tmp = [];

    if (! filter) return items;

    for (var i = 0, _len = items.length; i < _len; i++) {
      var itemAllowed = true;

      for (var k in filter) {
        if (filter.hasOwnProperty(k)) {
          var options = filter[k];
          if (! Array.isArray(options)) options = [options];
          if (options.indexOf(items[i][k]) === -1) {
            itemAllowed = false;
          }
        }
      }

      if (itemAllowed) {
        tmp.push(items[i]);
      }
    }

    return tmp;
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
    var _this = this;

    var run = function(options){
      var error = options.error;

      options.error = function(err){
        if (Model.errorHandler) {
          Model.errorHandler(err, _this);
        }

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
        if (options.local[index] || options.local.length === 0) {
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
                  if (result[itemIndex] && Model.writeFileSystem) {
                    fs.writeFile(options.local[itemIndex], JSON.stringify(result[itemIndex], null, '\t'), function(){
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
    if (data instanceof Collection) return data;
    return new Collection(model, data);
  };

  return Collection;
});
