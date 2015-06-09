// TODO: IMPLEMENT ERRORS!

/*
 * Loader.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
/** @namespace data **/
define([
  '../sys',
  '../config',
  'EaselJS',
  'PreloadJS',
  './fs'
], function(
  sys,
  config,
  createjs,
  preloadjs,
  fs
) {
  /**
   *
   * An abstract data preloader used to cache files, preload and store them<br>
   * dispatch progress events and complete events
   *
   * extends createjs.LoadQueue to simplify handling from outside<br>
   *
   * @example
   *
   * var loader = new Loader();
   *
   * loader.addEventListener('complete', render);
   *
   * // can be an single file
   * loader.load('data.json');
   *
   * // can be an array of files
   * loader.load(['file1.jpg', 'file2.jpg']);
   *
   * // can be an array of files defined through id and src
   * loader.load([{id: 'firstFile', src: 'file1.jpg'}, {'id': 'secondFile': 'src': 'file2.jpg'}]);
   *
   * // can be a key / value pair object (NOTE: will lose the appropriate sequence order (i.e. files could be loaded randomly))
   * loader.load({firstFile: 'file1.jpg', secondFile: 'file2.jpg'});
   *
   * // to retrieve data just call:
   * loader.get('firstFile');
   *
   * // NOTE: when not passing id's array indices will be used
   * loader.get(0);
   *
   * // or to get all files as an array:
   * loader.get(); // NOTE: when only one file was loaded it will return the file directly instead of an array
   *
   * // can also be used statically to avoid event listeners overhead
   * Loader.load([files], complete, progress);
   *
   * @class Loader
   * @memberof data
   **/
  function Loader(){
    /**
     * stored items. better use the predefined class for getting elements
     * @see data.Loader.get
     * @memberof data.Loader
     * @instance
     * @var {object} items
     */
    this.items = [];

    /**
     * wheter Loader should overwrite files when fetching them (see data.fs.download)
     * @see data.fs
     * @memberof data.Loader
     * @instance
     * @var {Boolean} overwrite
     */
    this.overwrite = false;

    /**
     * instance load manifest which defines all the items that should be loaded<br>
     * gets set via .load()
     * @memberof data.Loader
     * @instance
     * @private
     * @var {Array} _manifest
     */
    this._manifest = null;

    /**
     * cached items stored by manifest id as a key
     * @memberof data.Loader
     * @instance
     * @private
     * @var {Array} _results
     */
    this._results = [];

    /**
     * currently loaded index
     * @memberof data.Loader
     * @instance
     * @private
     * @var {Number} _loadIndex
     */
    this._loadIndex = 0;

    // initialize LoadQueue instance
    // load as tags for all applications except browser
    // (xhr does not work for file://paths)
    createjs.LoadQueue.call(this, config.environment === 'browser' ? true : false);

    // bind events right at the beginning so they get fired at first
    this.addEventListener('fileload', _fileload.bind(this));
  }

  var p = sys.extend(Loader, createjs.LoadQueue);

  /**
   * loads passed elements
   *
   * @method load
   * @memberof data.Loader
   * @instance
   * @public
   * @param {Object} manifest the files to load<br>
   * can be an array of strings, a simple string, an array of objects (see createjs.LoadQueue)
   **/
  p.load = function(manifest){
    // make it an array if it is not
    if (typeof manifest === 'string') {
      manifest = [manifest];
    }

    // if manifest was an object in the form {id: path} transform it to an array instead
    if (typeof manifest === 'object' && ! Array.isArray(manifest)) {
      var tmp = manifest;
      manifest = [];

      for (var k in tmp) {
        if (tmp.hasOwnProperty(k)) {
          manifest.push({id: k, src: tmp[k]});
        }
      }
    }

    // add id's to manifest items if not set
    for (var i = 0, _len = manifest.length; i < _len; i++) {
      if (typeof manifest[i] !== 'object') {
        manifest[i] = {id: i, src: manifest[i]};
      }
    }

    // store manifest for loading and caching purposes
    this._manifest = manifest;

    // start caching files in the filesystem (depending on the environment)
    _cacheNextFile.call(this);
  };

  /**
   * gets an element by its defined id
   * if no id was passed returns an array of all loaded elements
   * if there's only one element loaded returns it directly
   *
   * @method get
   * @memberof data.Loader
   * @instance
   * @public
   * @param {String|Number} id of the element to get
   **/
  p.get = function(id){
    // if there was only one item loaded return it directly
    // regardless passed id
    if (this.items.length === 1) {
      return this.items[0];
    }

    if (id === null || typeof id === 'undefined') {
      // if no id was passed return all loaded items instead
      return this.items;
    } else {
      // otherwise find loaded item by id
      for (var i = 0, _len = this._results.length; i < _len; i++) {
        if (this._results[i].item.id === id) {
          return this._results[i].result;
        }
      }
    }

    return null;
  };

  /**
   * called when a file has been loaded
   * stores file for later use in .get
   *
   * @method _fileload
   * @memberof data.Loader
   * @instance
   * @private
   **/
  var _fileload = function(event){
    this._results.push(event);
    this.items.push(event.result);
  };

  /**
   * caches file through fs (depending on environment)
   * when all files have been cached loads manifest file
   *
   * @method _cacheNextFile
   * @memberof data.Loader
   * @instance
   * @private
   **/
  var _cacheNextFile = function(){
    // if there's an open file that has not been cached yet
    if (this._manifest[this._loadIndex]) {
      // if it has a local file path
      if (this._manifest[this._loadIndex].local) {
        // download file
        var options = {};

        options.success = _receivedFilePath.bind(this);

        // if current item has an overwrite option
        if (! (this._manifest[this._loadIndex].overwrite === null || typeof this._manifest[this._loadIndex].overwrite === 'undefined')) {
          // use that definition
          options.overwrite = this._manifest[this._loadIndex].overwrite;
        } else {
          // otherwise use defined overwrite option in Loader
          options.overwrite = this.overwrite;
        }

        options.remote = this._manifest[this._loadIndex].src;
        options.local = this._manifest[this._loadIndex].local;
        fs.download(options);
      } else {
        // otherwise: assume it wants to load remote file
        _receivedFilePath.call(this, this._manifest[this._loadIndex].src);
      }
    } else {
      // if all files have been cached: preload cached files
      this.loadManifest(this._manifest);
    }
  };

  /**
   * when a file has been cached and fs returned its new local file path
   *
   * @method _receivedFilePath
   * @memberof data.Loader
   * @instance
   * @private
   **/
  var _receivedFilePath = function(path){
    if (path) {
      // if it specified a local file path
      if (this._manifest[this._loadIndex].local) {
        // store correct file path (a relative file://path, same url in browser applications)
        // in manifest for later loading operations (i.e. only downloads file in nwjs applications)
        this._manifest[this._loadIndex].src = fs.getLocalFilePath(path);
      }

      // cache next file
      this._loadIndex++;

      // dispatch cached event
      var event = new createjs.Event('cached');
      event.progress = this._loadIndex / this._manifest.length;
      this.dispatchEvent(event);

      _cacheNextFile.call(this);
    } else {
      throw new Error('did not receive file path for ' + this._manifest[this._loadIndex]);
    }
  };

  /**
   * loads passed elements
   *
   * @method load
   * @memberof data.Loader
   * @param {Object} manifest the files to load<br>
   * can be an array of strings, a simple string, an array of objects (see createjs.LoadQueue)
   * @param {function} complete callback when finished
   * @param {function} progress (optional) callback while loading data
   * @static
   **/
  Loader.load = function(manifest, complete, progress){
    var instance = new Loader();
    instance._callbackComplete = complete;
    instance._callbackProgress = progress;
    instance.addEventListener('complete', _instanceCompleted);
    instance.addEventListener('progress', _instanceProgress);
    instance.load(manifest);
  };

  /**
   * calls passed progress event when calling
   * Loader.load statically
   *
   * @method _instanceProgress
   * @memberof data.Loader
   * @private
   * @static
   **/
  var _instanceProgress = function(event){
    if (event.target._callbackProgress) event.target._callbackProgress.call(event.target, event);
  };

  /**
   * calls passed completed event when calling
   * Loader.load statically
   * passes event target data directly to callback (assumes it does not need event but only its loaded data)
   *
   * @method _instanceCompleted
   * @memberof data.Loader
   * @private
   * @static
   **/
  var _instanceCompleted = function(event){
    event.target.removeEventListener('complete', _instanceCompleted);
    event.target.removeEventListener('progress', _instanceProgress);
    if (event.target._callbackComplete) event.target._callbackComplete.call(event.target, event.target.get(), event);
  };

  return Loader;
});
