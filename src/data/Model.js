/*
 * Model.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define([
  '../sys',
  '../utils/EventDispatcher',
  './fs',
  './API'
], function(
  sys,
  EventDispatcher,
  fs,
  API
) {
  var Collection = null;

  /**
   * A model holds data that gets pulled from a server
   * and pushes data
   *
   * @example
   * var model = new Model();
   * model.hasMany = [{model: 'user', through: 'users', autoPull: true}]
   * model.pull(successCallback);
   *
   * @example
   * model.push(callback);
   *
   * @example
   * model.push({data}, callback);
   *
   * @class Model
   * @extends utils.EventDispatcher
   * @memberof data
   * @param {object|Number} data is either a data object or an id of the model that should be fetched
   **/
  function Model(data){
    if (! Collection) Collection = require('noop/data/Collection');

    EventDispatcher.call(this);

    /**
     * filter of properties that should not be returned when fetching data
     * @memberof data.Model
     * @instance
     * @var {Array} filter
     */
    this.filter = sys.setDefaultValue(this.filter, []);

    /**
     * wheter model should be overwritten when pulling data
     * @memberof data.Model
     * @instance
     * @var {Boolean} overwrite
     */
    this.overwrite = sys.setDefaultValue(this.overwrite, false);

    /**
     * model's name
     * @memberof data.Model
     * @instance
     * @var {String} model
     */
    this.model = sys.setDefaultValue(this.model, '');

    /**
     * model's Class name (first character uppercased)
     * @memberof data.Model
     * @instance
     * @var {String} modelClass
     */
    this.modelClass = this.model.substring(0, 1).toUpperCase() + this.model.substring(1);

    /**
     * defines 1:n relationships<br>
     * @example
     * user.hasMany = 'apps';
     * @example
     * user.hasMany = [{model: 'app', through: 'users_applications', autoPull: true}, ...]
     * @memberof data.Model
     * @instance
     * @var {String} hasMany
     */
    this.hasMany = this.hasMany || null;

    /**
     * defines 1:1 relationships<br>
     * @example
     * user.hasOne = 'project';
     * @example
     * user.hasOne = [{model: 'project', through: 'his_project', autoPull: true}, ...]
     * @memberof data.Model
     * @instance
     * @var {String} hasOne
     */
    this.hasOne = this.hasOne || null;

    /**
     * defines 1:1 foreign relationships<br>
     * @example
     * app.belongsTo = 'user';
     * @example
     * app.belongsTo = [{model: 'user', through: 'user_id', autoPull: true}, ...]
     * @memberof data.Model
     * @instance
     * @var {String} belongsTo
     */
    this.belongsTo = this.belongsTo || null;

    /**
     * if set to true: automatically pulls all relationships when pulling instance itself
     * @memberof data.Model
     * @instance
     * @var {String} autoPull
     */
    this.autoPull = sys.setDefaultValue(this.autoPull, false);

    /**
     * defines if a model was already downloaded and is a cached instance
     * @memberof data.Model
     * @instance
     * @private
     * @var {String} _cached
     */
    this._cached = sys.setDefaultValue(this._cached, false);

    /**
     * defines if a model was read from local collection cache
     * @memberof data.Model
     * @instance
     * @private
     * @var {String} _loaded
     */
    this._loaded = sys.setDefaultValue(this._loaded, false);

    /**
     * defines if model defined data initially
     * @memberof data.Model
     * @instance
     * @private
     * @var {String} _definedData
     */
    this._definedData = sys.setDefaultValue(this._definedData, false);

    /**
     * converts defined model's relationships for internal usage
     * @memberof data.Model
     * @instance
     * @private
     * @var {String} _relationshipKeys
     */
    this._relationshipKeys = {hasOne: [], belongsTo: [], hasMany: []};

    // correct relationship properties:
    // convert them to an array and each of them into an object if not defined like that
    // correct model's name to singularity if it defined a string (i.e. hasMany = 'apps' becomes hasMany = {model: 'app'})
    // i.e.: app.belongsTo = 'user' // becomes: app.belongsTo = [{model: 'user', through: 'user'}]
    // i.e.: user.hasMany = 'apps' // becomes: app.hasMany = [{model: 'app', through: 'apps'}]
    var i, _len, j, _relLen, rel;

    for (j = 0, _relLen = _relationships.length; j < _relLen; j++) {
      rel = _relationships[j];

      if (this[rel]) {
        // convert relation type to an array if it was not one
        if (! Array.isArray(this[rel])) {
          this[rel] = [this[rel]];
        }

        // loop through individual relations of current type (i.e. hasMany, etc.)
        for (i = 0, _len = this[rel].length; i < _len; i++) {
          // if defined relation was not an object
          if (typeof this[rel][i] !== 'object') {
            // convert it to one and correct model name properly
            this[rel][i] = {
              model: rel === 'hasMany' ? this[rel][i].substring(0, this[rel][i].length - 1) : this[rel][i],
              through: this[rel][i]
            };
          } else if (! this[rel][i].through) {
            // if the relation object did not define a through property: add it properly
            if (rel === 'hasMany') {
              this[rel][i].through = this[rel][i].model + 's';
            } else {
              this[rel][i].through = this[rel][i].model;
            }
          }

          this._relationshipKeys[rel][i] = this[rel][i].through;
        }
      }
    }

    // add initial data from constructor
    this._definedData = this.set(data);
  }

  var p = sys.extend(Model, EventDispatcher);

  p.toString = function(){
    return '[object Model]';
  };

  /**
   * gets the model's query arguments
   * @method getQuery
   * @memberof data.Model
   * @instance
   * @protected
   **/
  p.getQuery = function(){
    var query = '';

    for (var k in Model.queryArgs) {
      if (Model.queryArgs.hasOwnProperty(k)) {
        if (query.length === 0) query += '?';
        else query += '&';

        query += (k + '=' + Model.queryArgs[k]);
      }
    }

    return query;
  };

  /**
   * gets model's specific url for pulling data
   * @method getPullURL
   * @memberof data.Model
   * @instance
   * @protected
   **/
  p.getPullURL = function(){
    if (this.id) return API.endpoint + this.model + 's' + '/' + this.id + this.getQuery();
    return API.endpoint + this.model + 's';
  };

  /**
   * gets model's specific url for pushing data
   * @method getPushURL
   * @memberof data.Model
   * @instance
   * @protected
   **/
  p.getPushURL = function(){
    if (this.id) return API.endpoint + this.model + 's' + '/' + this.id;
    return API.endpoint + this.model + 's';
  };

  /**
   * serializes data of model
   *
   * @example
   * model.serialize('name'); // 'User'
   * model.serialize(); // {name: 'User', version: '1.2'}
   *
   * @method serialize
   * @memberof data.Model
   * @public
   * @instance
   * @param {Boolean} deep trace all model relations
   **/
  p.serialize = function(deep){
    var data = this.get(deep);
    return JSON.stringify(data);
  };

  /**
   * gets data from model. if no key is passed as parameter gets all the stored data
   *
   * @example
   * var model = new Model({name: 'User', version: '1.2'});
   * model.get('name'); // 'User'
   * model.get(); // {name: 'User', version: '1.2'}
   *
   * @method get
   * @memberof data.Model
   * @public
   * @instance
   * @param {String} key (optional)
   **/
  p.get = function(key, caller){
    if (sys.indexOf(_getCallers, this) >= 0) {
      return null;
    }

    if (caller && sys.indexOf(_getCallers, this) === -1) {
      _getCallers.push(this);
    }

    // define deep tracing
    var deep = false;

    // if key === true
    // tell Model that it should deep trace relations
    if (key === true) {
      deep = true;
      key = null;
    } else if (key === false) {
      // when calling get(false) assume it simply wants to get plain object without deep tracing
      key = null;
    }

    // if a key was passed
    if (key) {
      // simply return the plain value
      return _getModelValue(this, key, deep);
    }

    // otherwise loop through properties
    var data = {};

    for (var k in this) {
      // security check and exclude reserved names
      if (this.hasOwnProperty(k) && ! (typeof this[k] === 'function' || _reservedWords.indexOf(k) >= 0 || this.filter.indexOf(k) >= 0)) {
        // exclude belongsTo relations as they should be used by getting back like
        // user.apps.user.get(true)
        if (this._relationshipKeys.belongsTo.indexOf(k) === -1) {
          // get value by key
          var value = _getModelValue(this, k, deep);

          // if the returned value was not empty
          if (value) {
            // set it on data object
            data[k] = value;
          }
        }
      }
    }

    // reset callers if it was the initial one
    if (! caller) _getCallers = [];

    // return all the data
    return data;
  };

  /**
   * sets data on model object
   * @example
   * model.set({version: '10', name: 'application'});
   * model.set('version', '10');
   * model.set(10); // assumes it's the model's id
   *
   * @method set
   * @memberof data.Model
   * @instance
   * @public
   * @param {object|String} dataOrKey should be either
   * * a number (assumes it sets the model's id)
   * * an object with key-value pairs
   * * a key string (in this case needs to add value as second parameter)
   * @param {object|String} value to set on model
   **/
  p.set = function(dataOrKey, value){
    if (! dataOrKey) return;

    // if has a value
    if (value) {
      // assume dataOrKey was a key
      var options = {};
      options[dataOrKey] = value;
      this.set(options);
      return;
    }

    // otherwise dataOrKey should be some data itself
    var data = dataOrKey;

    if (data.get) {
      data = data.get();
    }

    // if data was a number: assume it was the model's id
    if (! isNaN(data) || typeof data === 'string') {
      // if it's a collection, but only has one item: don't set the collection's id
      if (this instanceof Collection === false) {
        this.id = data;
      }

      _cacheModel(this);
      return;
    }

    var _didSetData = false;
    var _didSetId = false;

    // otherwise assign all properties to model if they're not reserved words
    for (var k in data) {
      if (data.hasOwnProperty(k)) {
        if (typeof this[k] === 'function' || _reservedWords.indexOf(k) >= 0) {
          throw new Error('data key  > ' + k + ' <  is a reserved name in  > Model <');
        } else {
          if (k === 'id') {
            if (! isNaN(data[k])) {
              this[k] = parseFloat(data[k]);
            } else {
              this[k] = data[k];
            }

            _didSetId = true;
          } else {
            // if it's an already assigned collection
            if (this[k] && this instanceof Collection === true && this[k].set) {
              // set partial data through collection item
              this[k].set(data[k]);
            } else {
              // otherwise just assign the data to the model
              this[k] = data[k];
            }

            _didSetData = true;
          }
        }
      }
    }

    // update stored collection data
    if (this instanceof Collection) {
      for (var i = 0, _len = this.length; i < _len; i++) {
        _cacheModel(this[i]);
      }
    } else {
      _cacheModel(this);
    }

    if (_didSetId && _didSetData) {
      return true;
    }
  };

  /**
   * clears model data and only keeps needed properties
   *
   * @method clear
   * @memberof data.Model
   * @public
   * @instance
   **/
  p.clear = function(){
    for (var k in this) {
      if (this.hasOwnProperty(k)) {
        if (! (typeof this[k] === 'function' || _reservedWords.indexOf(k) >= 0)) {
          delete this[k];
        }
      }
    }
  };

  /**
   * pulls data from server. automatically fetches model name from class name.<br>
   * calls target api function and stores data locally
   *
   * @example
   * var model = new Model();
   * model.addEventListener('pulled', _pulled);
   * model.pull();
   *
   * @example
   * // optional callback if you dont need events
   * model.pull(successCallback);
   *
   * @method pull
   * @memberof data.Model
   * @public
   * @instance
   * @param {function} callback
   * @param {function} errorCallback
   **/
  p.pull = function(callback, errorCallback){
    var _this = this;

    // if it's a cached instance
    if (_this._cached && ! _this.overwrite) {
      // call pulled callback directly
      if (callback) callback(this);
      return;
    }

    var pulled = function(data){
      _this.set(data);

      var items = [_this];

      if (_this instanceof Collection === true) {
        items = _this.getItems();
      }

      checkRelationshipsFrom(items, 0);
    };

    // get collection relationships recursive!
    var checkRelationshipsFrom = function(items, index){
      var next = function(){
        checkRelationshipsFrom(items, index + 1);
      };

      if (items[index]) {
        _getRelations(items[index], next, errorCallback);
      } else {
        _this._cached = true;

        for (var i = 0, _len = items.length; i < _len; i++) {
          if (items[i].pulled) items[i].pulled.call(items[i], items[i]);
          items[i].dispatchEvent('pulled');
        }

        if (callback) callback(_this);
      }
    };

    var _getRelations = function(model, callback, errorCallback){
      // if it's a cached instance
      if (model._cached) {
        // call pulled callback directly
        callback();
        return;
      }

      var checkRelationships = function(relationshipId, index){
        // if it did not finish all relationships already (i.e. hasOne, hasMany, belongsTo, etc.)
        if (_relationships[relationshipId]) {
          // get the needed relation
          var rel = _relationships[relationshipId];

          // if model has properties defined as a relation
          // i.e. if it defined something like user.hasMany = 'todos';
          if (model[rel] && model[rel][index]) {
            // pull that data from the server (or get the cached instance)
            pullAdditional(model[rel][index], rel, function(){
              // when done check the next item from that relationship group
              // i.e. if it defined something like user.hasMany = ['todos', 'apps']
              checkRelationships(relationshipId, index + 1);
            });
          } else {
            // if done with that relationship group: check next group
            // i.e. if checked all hasMany relations: check for hasOne etc.
            checkRelationships(relationshipId + 1, 0);
          }
        } else {
          // if done with all relationships: dispatch that item was pulled properly
          callback();
        }
      };

      var pullAdditional = function(definition, type, callback){
        var targetData = null;

        if (type === 'hasMany') {
          // store that collection list
          targetData = model[definition.through];

          // for hasMany relations: check if model has a defined array of id's for that definition
          // if it is not an array: convert it to one
          if (targetData && Array.isArray(targetData) === false) {
            model[definition.through] = [model[definition.through]];
            targetData = model[definition.through];
          }
        } else if (type === 'hasOne') {
          // for hasOne relations: check the key directly
          // i.e. user.address = 1
          targetData = model[definition.through];
        } else if (type === 'belongsTo') {
          // check if it has a 'model_id' foreign key value
          targetData = model[definition.through + '_id'];

          // if it does not have something like app.user_id = 1;
          if (! targetData && model[definition.through]) {
            // check directly for the model's name (i.e. app.user = 1)
            targetData = model[definition.through];
          }
        }

        var modelClassName = definition.model.substring(0, 1).toUpperCase() + definition.model.substring(1);

        if (targetData) {
          var instance = null;

          var pulled = function(data){
            instance.overwrite = instance.__oldOverwrite;
            model[definition.through] = instance;
            callback();
          };

          require(['models/' + modelClassName], function(ModelClass){
            if (type === 'hasMany') {
              instance = Collection.factory(modelClassName, targetData);
              instance.__oldOverwrite = instance.overwrite;
              instance.overwrite = _this.overwrite;
            } else {
              instance = Model.factory(modelClassName, targetData);
              instance.__oldOverwrite = instance.overwrite;
              instance.overwrite = _this.overwrite;
            }

            if ((instance._cached || instance._loaded) && ! instance.overwrite) {
              pulled();
            } else {
              if (model.autoPull || definition.autoPull) {
                instance.pull(pulled, errorCallback);
              } else {
                pulled();
              }
            }
          });
        } else {
          // if model did not define and id's for that relation: simply call the callback
          callback();
        }
      };

      checkRelationships(0, 0);
    };

    // if instance already defined data
    if (_this._definedData || (_this instanceof Collection === false && ! _this.id)) {
      // call pulled callback directly and check relations accordingly
      pulled();
    } else {
      _this.download(pulled, errorCallback);
    }
  };

  /**
   * pushes data to server. automatically fetches model name from class name. <br>
   * calls target api function and pushes data
   *
   * @example
   * model.push(callback); // pushes current model data to server
   * model.push({data}, callback);
   *
   * @method push
   * @memberof data.Model
   * @public
   * @instance
   * @param {function|object} dataOrCallback
   * @param {function} callback (optional)
   * @param {function} errorCallback (optional)
   **/
  p.push = function(dataOrCallback, callback, errorCallback){
    var _this = this;

    if (typeof dataOrCallback === 'function') {
      errorCallback = callback;
      callback = dataOrCallback;
    }

    // define request options for model
    var options = {};

    // define server url (usually a plural of the model's name)
    // i.e. user -> users
    options.url = this.getPushURL();

    // if dataOrCallback defined some data
    if (typeof dataOrCallback === 'object') {
      // assign data to options
      options.data = dataOrCallback;
      this._cached = false;
    } else {
      // otherwise: simply push all the model data to server
      options.data = this.get();
    }

    // if the model was already in the model's store
    if (this._cached || this.id) {
      // update model via PUT
      options.method = 'PUT';
    } else {
      // otherwise post a new model to the server
      options.method = 'POST';
    }

    var done = function(){
      _this._cached = true;

      if (_this.pushed) _this.pushed.call(_this, _this);
      _this.dispatchEvent('pushed');
    };

    if (this._cached) {
      done();
    } else {
      fs.request(options, callback, errorCallback);
    }
  };

  /**
   * downloads model from server and stores it to a local file
   *
   * @method download
   * @memberof data.Model
   * @instance
   * @protected
   * @param {function} callback
   * @param {function} errorCallback
   **/
  p.download = function(callback, errorCallback){
    var run = function(options){
      // correct local file path first
      options.local = fs.correctLocalFilePath(options.local);

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

      fs.exists(options.local, function(exists){
        if (exists && ! options.overwrite) {
          fs.readFile(options.local, function(result){
            if (typeof result !== 'object') {
              result = JSON.parse(result.toString());
            }

            if (options.success) {
              options.success(result);
            }
          }, options.error);
        } else {
          fs.request(options.remote, function(result){
            if (typeof result !== 'object') {
              result = JSON.parse(result.toString());
            }

            fs.writeFile(options.local, JSON.stringify(result));

            if (options.success) {
              options.success(result);
            }
          }, options.error);
        }
      });
    };

    var options = {};
    options.overwrite = this.overwrite;
    options.success = callback;
    options.error = errorCallback;
    options.remote = this.getPullURL();
    options.local = 'json/' + this.model + 's/' + this.model + '-' + this.id + '.json';

    run(options);
  };

  /**
   * Model's internal collection storage
   *
   * @memberof data.Model
   * @public
   * @static
   * @var {Object} collection
   **/
  Model.collection = {};

  /**
   * query args in the form of key = value that get appended when pulling a model
   *
   * @memberof data.Model
   * @public
   * @static
   * @var {Object} queryArgs
   **/
  Model.queryArgs = {};

  /**
   * factories a new model
   *
   * @method factory
   * @memberof data.Model
   * @public
   * @static
   * @example
   * Model.factory('User', 1).pull();
   * Model.factory('User').set({name: 'Username'}).push();
   * @param {String} className a string of the model (i.e. 'User')
   * @param {object} data (optional). if defined returns the stored model if it already exists
   **/
  Model.factory = function(model, data) {
    if (data instanceof Model) return data;

    model = model.substring(0, 1).toLowerCase() + model.substring(1);

    var className = model.substring(0, 1).toUpperCase() + model.substring(1);
    var ModelClass = require('models/' + className);

    var id = data;
    if (typeof data === 'object' && data.id) id = data.id;

    if (! isNaN(id) || typeof id === 'string') {
      // check if model already exists in collection storage
      if (Model.collection[model] && Model.collection[model][id]) {
        var instance = Model.collection[model][id];
        var cached = instance._cached;
        instance._loaded = true;

        // NOTE: when actually cached but needs to override data on model
        instance.set(data);

        instance._cached = cached;

        return instance;
      }
    }

    return new ModelClass(data);
  };

  /**
   * creates a new model class
   *
   * @method create
   * @memberof data.Model
   * @public
   * @static
   * @example
   * var User = Model.create({
   *   model: 'user',
   *   hasMany: 'apps',
   *   ...
   * });
   * @param {object} options model definitions
   **/
  Model.create = function(options) {
    function Instance(data){
      for (var k in options) {
        if (options.hasOwnProperty(k)) {
          this[k] = options[k];
        }
      }

      Model.call(this, data);
    }

    var p = sys.extend(Instance, Model);

    return Instance;
  };

  /**
   * cached callers when fetching relationship via .get<br>
   * to prevent circular relations -> stack overflow
   * @memberof data.Model
   * @static
   * @private
   * @var {String} _getCallers
   */
  var _getCallers = [];

  /**
   * relationships cached
   * @memberof data.Model
   * @static
   * @private
   * @var {String} _relationships
   */
  var _relationships = [
    'hasOne',
    'belongsTo',
    'hasMany'
  ];

  /**
   * all reserved words that model needs<br>
   * i.e. data that can't be set on a model's instance
   * @memberof data.Model
   * @static
   * @private
   * @var {String} _reservedWords
   */
  var _reservedWords = [
    'filter',
    'hasMany',
    'hasOne',
    'belongsTo',
    'autoPull',
    'overwrite',
    'model',
    'modelClass',
    '_cached',
    '_loaded',
    '_definedData',
    '_relationshipKeys',
    '__oldOverwrite',
    '_listeners',
    '_captureListeners'
  ];

  /**
   * get a value from a specific model
   * @memberof data.Model
   * @static
   * @private
   * @var {String} _getModelValue
   */
  var _getModelValue = function(model, key, deep){
    // if model has the searched key
    if (! model[key]) return null;

    // temporarily store value
    var value = model[key];

    if (Array.isArray(value)) {
      var data = [];

      // loop through array
      for (var i = 0, _len = value.length; i < _len; i++) {
        // if the value is a reference back to the parent model caller itself
        if (sys.indexOf(_getCallers, value[i]) >= 0) {
          // return null
          return null;
        }

        // if it's a model
        if (value[i].get) {
          // and it should deep trace relations
          // (otherwise just leave data at model index empty)
          if (deep) {
            // store deep traced model data
            data[i] = value[i].get(true, model);
          }
        } else {
          // if it's not a model: store the value
          data[i] = value[i];
        }
      }

      // if corrected array length is 0 return null
      // NOTE: this might impose bugs when empty arrays are needed
      //if (data.length === 0) return null;

      // otherwise just return the corrected array data
      return data;
    } else {
      // if it's not an array:
      // if the value is a reference back to the parent model caller itself
      if (sys.indexOf(_getCallers, value) >= 0) {
        // return null
        return null;
      }

      // if it's a model
      if (value.get) {
        // and it should deep trace relations
        if (deep) {
          // return deep traced model data
          return value.get(true, model);
        }
      } else {
        // otherwise just return the plain value
        return value;
      }
    }

    return null;
  };

  /**
   * caches model in internal collection storage
   * @memberof data.Model
   * @static
   * @private
   * @var {String} _cacheModel
   */
  var _cacheModel = function(model){
    // when data was update delete cache
    delete model._cached;

    // store model instance
    if (! Model.collection[model.model]) {
      Model.collection[model.model] = {};
    }

    if (model.id) {
      Model.collection[model.model][model.id] = model;
    }
  };

  return Model;
});
