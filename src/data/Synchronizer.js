/*
 * Synchronizer.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define([
  '../sys',
  '../utils/EventDispatcher',
  './fs'
], function(
  sys,
  EventDispatcher,
  fs
) {
  var LIST_PROGRESS = 'listProgress';
  var PROGRESS = 'progress';
  var SUCCESS = 'success';
  var ERROR = 'error';

  /**
   * Synchronizer synchronizes data from a server to the local filesystem. dispatches progress event
   *
   * @example
   * // keep data structure
   * var _syncer = new Synchronizer();
   * _syncer.remote = 'http://myremote.com/data/';
   * _syncer.local = '/Users/me/data/folder/';
   * _syncer.items = ['index.html', 'data/image.jpg'];
   * _syncer.start();
   *
   * @example
   * // custom structure
   * var _syncer = new Synchronizer();
   * _syncer.items = [{remote: 'http://myremote.com/data/index.html', local: '/Users/me/data/folder/index.html'}]
   * _syncer.start();
   *
   * @class Synchronizer
   * @extends utils.EventDispatcher
   * @memberof data
   **/
  function Synchronizer(){
    EventDispatcher.call(this);

    /**
     * Wheter items that should be synced should be overwritten if already existing on local fs
     * @memberof data.Synchronizer
     * @instance
     * @var {Boolean} overwrite
     */
    this.overwrite = false;

    /**
     * remote base path of items that should be synced<br>
     * i.e. when setting a list of items with a relative path, remote path will be prepended
     * @memberof data.Synchronizer
     * @instance
     * @var {String} remote
     */
    this.remote = '';

    /**
     * local base path where items should be stored<br>
     * i.e. 'storage/my/data/'
     * @memberof data.Synchronizer
     * @instance
     * @var {String} local
     */
    this.local = '';

    /**
     * if set to true cleans up defined local base folder (deletes items on local filesystem that were not defined on remote file list)<br>
     * if it's a string cleans up defined folder instead.
     * i.e. 'storage/my/data/'
     * @memberof data.Synchronizer
     * @instance
     * @var {String|Boolean} cleanup
     */
    this.cleanup = false;

    /**
     * that should be synched<br>
     * if a local base path was defined via this.local = 'my/path': keeps folder structure on local filesystem<br>
     * i.e. ['item1.jpg', 'item2.jpg', ...]
     * @memberof data.Synchronizer
     * @instance
     * @var {Array} items
     */
    this.items = [];

    /**
     * success callback function. alternative to event listeners
     * @memberof data.Synchronizer
     * @instance
     * @var {Function} success
     */
    this.success = null;

    /**
     * progress callback function. alternative to event listeners
     * @memberof data.Synchronizer
     * @instance
     * @var {Function} progress
     */
    this.progress = null;

    /**
     * listProgress callback function. alternative to event listeners
     * @memberof data.Synchronizer
     * @instance
     * @var {Function} listProgress
     */
    this.listProgress = null;

    /**
     * error callback function. alternative to event listeners
     * @memberof data.Synchronizer
     * @instance
     * @var {Function} error
     */
    this.error = null;

    this._stopped = false;
    this._index = 0;
    this._storedFiles = [];

    this._alreadyDownloaded = [];
    this._needsToDownload = [];
    this._comparedFiles = false;
    this._overallProgress = 0;
    this._overallSize = 0;
  }

  var p = sys.extend(Synchronizer, EventDispatcher);

  /**
   * initializes syncing
   * @method start
   * @memberof data.Synchronizer
   * @instance
   */
  p.start = function(){
    this._index = 0;
    this.resume();
  };

  /**
   * resumes syncing
   * @method resume
   * @memberof data.Synchronizer
   * @instance
   */
  p.resume = function(){
    this._stopped = false;
    if (this._comparedFiles) {
      _next.call(this);
    } else {
      _compare.call(this);
    }
  };

  /**
   * pauses syncing, can be resumed later on
   * @method pause
   * @memberof data.Synchronizer
   * @instance
   */
  p.pause = function(){
    this._stopped = true;
  };

  /**
   * stops syncing, resets sync index
   * @method stop
   * @memberof data.Synchronizer
   * @instance
   */
  p.stop = function(){
    this.pause();
  };

  var _compare = function(){
    if (this._stopped) return;

    // get current item
    var item = this.items[this._index];

    // if still has items
    if (item) {
      var _this = this;

      var options = _getItemOptions.call(this, item);

      var done = function(alreadyDownloaded){
        if (alreadyDownloaded) {
          _addStoredFiles.call(_this, options.local);
          _this._alreadyDownloaded.push(item);
        } else {
          if (item.size) _this._overallSize += item.size;
          _this._needsToDownload.push(item);
        }

        _this._index++;

        _listProgress.call(_this, _this._index / _this.items.length);

        _compare.call(_this);
      };

      // download current item
      fs.exists(options.local, function(exists){
        if (exists && ! options.overwrite) {
          if (options.checksum) {
            fs.checksum(options.local, function(sum){
              if (sum === options.checksum || ! (sum && sum.length > 0)) {
                done(true);
              } else {
                done(false);
              }
            });
          } else {
            done(true);
          }
        } else {
          done(false);
        }
      });
    } else {
      this._index = 0;
      _next.call(this);
    }
  };

  var _next = function(){
    if (this._stopped) return;

    // get current item
    var item = this._needsToDownload[this._index];

    // if still has items
    if (item) {
      // get that item
      _get.call(this, item);
    } else {
      // otherwise: dispatch done
      _done.call(this);
    }
  };

  var _getItemOptions = function(item){
    // if current item was a string: assume remote and local path should be the same
    if (typeof item === 'string') item = {remote: item, local: item};

    // if current item was an object but has no local filepath set: set it to ''
    if (! item.local) item.local = '';

    // define download options
    var options = {};

    // if current item has an overwrite option
    if (! (item.overwrite === null || typeof item.overwrite === 'undefined')) {
      // use that definition
      options.overwrite = item.overwrite;
    } else {
      // otherwise use defined overwrite option in Synchronizer
      options.overwrite = this.overwrite;
    }

    options.remote = this.remote + item.remote;
    options.local = this.local + item.local;

    if (item.checksum) {
      options.checksum = item.checksum;
    }

    return options;
  };

  var _addStoredFiles = function(filePath){
    // store all downloaded files in an array for later use
    var filename = fs.correctLocalFilePath(filePath);
    if (this._storedFiles.indexOf(filename) === -1) this._storedFiles.push(filename);

    var dirname = filename;

    // store up to 10 folders backwards
    // i.e. if there are nested empty folders they will not be recognized
    for (var i = 0; i < 10; i++) {
      dirname = fs.getFolder(dirname);
      if (dirname + '/' === fs.dataPath || dirname + '/' === '/') break;
      if (this._storedFiles.indexOf(dirname) === -1) this._storedFiles.push(dirname);
    }
  };

  var _get = function(item){
    var _this = this;

    var options = _getItemOptions.call(this, item);

    // calculate current item progress
    options.progress = function(p){
      // call progress event
      if (_this._overallSize !== 0) {
        var correctedProgress = (_this._overallProgress + (p * item.size));
        _progress.call(_this, correctedProgress / _this._overallSize, correctedProgress, _this._overallSize);
      } else {
        _progress.call(_this, (_this._index + p) / _this._needsToDownload.length);
      }
    };

    options.error = function(err){
      _error.call(_this, err);
    };

    options.success = function(filePath){
      // increment index when finished downloading
      _this._index++;

      _addStoredFiles.call(_this, filePath);

      // call progress event
      if (_this._overallSize !== 0) {
        _this._overallProgress += item.size;
        _progress.call(_this, _this._overallProgress / _this._overallSize, _this._overallProgress, _this._overallSize);
      } else {
        _progress.call(_this, _this._index / _this._needsToDownload.length);
      }

      // and sync next item
      _next.call(_this);
    };

    // download current item
    fs.download(options);
  };

  var _done = function(){
    // if sync should cleanup a directory
    if (this.cleanup) {
      // get cleanup folder, assume it's the local base path folder
      var cleanup = this.local;

      // if cleanup was a string
      if (typeof this.cleanup === 'string') {
        // use that folder instead
        cleanup = this.cleanup;
      }

      _cleanup.call(this, cleanup, true);
    } else {
      // finished downloading
      _success.call(this);
    }
  };

  var _cleanup = function(folder, callCallback){
    var _this = this;

    // get all local files in that directory
    fs.readdir(folder, function(localFiles){
      // loop through local found files
      for (var i = 0, _len = localFiles.length; i < _len; i++) {
        // if it is a folder
        if (localFiles[i].indexOf('.') === -1) {
          // clean the subfolder
          _cleanup.call(_this, folder + localFiles[i] + '/');
        }

        // if local file was not in download list
        if (_this._storedFiles.indexOf(fs.correctLocalFilePath(folder + localFiles[i])) === -1) {
          // remove it as it should not be used anymore
          fs.unlink(folder + localFiles[i]);
        }
      }

      if (callCallback) {
        // finished syncing
        _success.call(_this);
      }
    });
  };

  var _listProgress = function(p) {
    if (this.listProgress) {
      this.listProgress(p);
    }

    this.dispatchEvent({type: LIST_PROGRESS, progress: p});
  };

  var _progress = function(p, l, t) {
    if (this.progress) {
      this.progress(p, l, t);
    }

    this.dispatchEvent({type: PROGRESS, progress: p, loadedBytes: l, totalBytes: t});
  };

  var _error = function(err) {
    if (this.error) {
      this.error(err);
    }

    this.dispatchEvent({type: ERROR, error: err});
  };

  var _success = function(){
    if (this.success) {
      this.success();
    }

    this.dispatchEvent(SUCCESS);
  };

  return Synchronizer;
});
