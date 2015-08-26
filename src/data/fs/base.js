/*
 * base.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define(['../../config', '../API'], function(config, API){
  /**
   * wrapper function for local file reading and writing purposes<br>
   * Assumes application is running in the browser<br>
   * overwrites functions where needed according to phonegap or nwjs environment
   *
   * @namespace fs
   * @memberof data
   **/
  var fs = {};

  /**
   * Subfolder for data storage<br>
   * can be overridden in config via config.dataPath<br>
   * (use of a unique identifier recommended, for example com.company.appname)
   *
   * @memberof data.fs
   * @instance
   * @var {String} dataSubFolder
   **/
  fs.dataSubFolder = config.dataPath ? config.dataPath : 'data';

  /**
   * Cache buster to load new date from server without storing it in a local browser cache
   *
   * @memberof data.fs
   * @instance
   * @var {String} bust
   **/
  fs.bust = 'bust=' + Date.now();

  /**
   * initializes FileSystem (i.e. gets root directory on every individual environment)
   *
   * @method rename
   * @memberof data.fs
   * @instance
   * @param {Function} callback when finished
   **/
  fs.init = function(callback){
    if (callback) callback();
  };

  /**
   * gets a local filepath from either an absolute path or a relative path that sould be inside dataPath
   *
   * @method getLocalFilePath
   * @param {String} path that should be corrected
   * @memberof data.fs
   * @instance
   * @public
   **/
  fs.getLocalFilePath = function(path) {
    // correct file path first
    path = fs.correctLocalFilePath(path);

    if (config.environment === 'phonegap') {
      // as phonegap only returns a relative path:
      // strip out data/ first
      path = path.replace(fs.dataSubFolder + '/', '');
    }

    // remove eventual file:// prefix
    path = path.replace('file://', '');

    // append dataPath and ensure it is not included two times
    path = 'file://' + fs.dataPath + path.replace(fs.dataPath, '');

    return path;
  };

  /**
   * gets a folder out of a file path
   *
   * @method getFolder
   * @param {String} path that should return the folder for
   * @memberof data.fs
   * @instance
   * @public
   **/
  fs.getFolder = function(path) {
    if (path.substring(path.length - 1) === '/') path = path.substring(0, path.length - 1);
    path = path.substring(0, path.lastIndexOf('/'));
    return path;
  };

  /**
   * gets a filename out of a file path
   *
   * @method getFolder
   * @param {String} path that should return the filename for
   * @memberof data.fs
   * @instance
   * @public
   **/
  fs.getFilename = function(path) {
    path = path.replace(/\\/g, '/');
    var indexOfSlash = path.lastIndexOf('/');
    if (indexOfSlash === -1) return path;
    return path.substring(indexOfSlash + 1);
  };

  /**
   * gets the file extension of a specified path
   *
   * @method getFileExtension
   * @param {String} path that should return the file extension for
   * @memberof data.fs
   * @instance
   * @public
   **/
  fs.getFileExtension = function(path){
    if (path.substring(0, 1) === '.') return '';
    var ext = path.split('.').pop();
    if (ext === path) return '';
    return '.' + ext;
  };

  /**
   * corrects a local file path by adding dataPath if not set on passed path
   *
   * @method correctLocalFilePath
   * @param {String} path that should be corrected
   * @memberof data.fs
   * @instance
   * @public
   **/
  fs.correctLocalFilePath = function(path) {
    if (path === '/') path = '';
    return fs.dataPath + path.replace(fs.dataPath, '');
  };

  /**
   * downloads a file to the local machine filesystem<br>
   * returns the new generated filepath for further usage<br>
   * i.e. if it needs to load file use downloadAndRead
   *
   * @method download
   * @memberof data.fs
   * @instance
   * @param {object} options
   *
   * * remote {String} that should be downloaded
   * * local {String} that should be stored to
   * * checksum {String} optional: if passed and file already exists compares checksum and overwrites file if different
   * * overwrite {Boolean} the local file <br> (optionally set overwrite to "try", this way it tries to overwrite and falls back to locally cached file)
   * * progress {Function} while downloading the file (alternative to progress)
   * * success {Function} callback when finished
   * * error {Function} callbackError when an error occured
   **/
  fs.download = function(options){
    // correct local file path first
    options.local = fs.correctLocalFilePath(options.local);

    var error = options.error;

    options.error = function(err){
      if (options.overwrite === 'try') {
        options.error = error;
        options.overwrite = false;
        fs.download(options);
      } else {
        if (error) {
          error(err);
        }
      }
    };

    // check first if file that should be written to already exists
    fs.exists(options.local, function(exists){
      // if it does and should not overwrite
      if (exists && ! options.overwrite) {
        // if a checksum was passed
        if (options.checksum) {
          // compare it with local file's checksum
          fs.checksum(options.local, function(sum){
            // if checksums are identical
            if (sum === options.checksum || ! (sum && sum.length > 0)) {
              // call callback
              if (options.success) {
                options.success(options.local);
              }
            } else {
              // otherwise: try to download file again
              options.overwrite = 'try';
              fs.pipe(options);
            }
          });
        } else {
          // if there was no checksum passed: call callback
          if (options.success) {
            options.success(options.local);
          }
        }
      } else {
        // pipe remote file to local file
        // i.e. finally download file
        fs.pipe(options);
      }
    });
  };

  /**
   * pipes a remote file to a local file<br>
   * downloads and dispatches progress
   *
   * @method pipe
   * @memberof data.fs
   * @instance
   * @protected
   * @param {object} options
   *
   * * remote {String} that should be downloaded
   * * local {String} that should be stored to
   * * ext {String} (optional) file extension that should be used
   * * overwrite {Boolean} the local file
   * * progress {Function} while downloading the file (alternative to progress)
   * * success {Function} alternative to callback
   * * error {Function} callback
   *
   * @param {Function} callback when finished
   * @param {Function} errorCallback when encountered an error
   **/
  fs.pipe = function(options, callback, errorCallback){};

  /**
   * requests a remote file with defined options<br>
   * optionally passes in authentication and defines request method
   *
   * @method request
   * @memberof data.fs
   * @instance
   * @protected
   * @param {object} options
   *
   * * url {String} that should be downloaded
   * * method {String} request method
   * * data {String} request data
   * * progress {Function} while downloading the file (alternative to progress)
   * * success {Function} alternative to callback
   * * error {Function} callback
   *
   * @param {Function} callback when finished
   * @param {Function} errorCallback when encountered an error
   **/
  fs.request = function(options, callback, errorCallback){
    if (typeof options === 'string') {
      options = {url: options};
    }

    if (callback && ! options.success) options.success = callback;
    if (errorCallback && ! options.error) options.error = errorCallback;

    var ajaxOpts = {};
    ajaxOpts.url = options.url;
    ajaxOpts.data = options.data || {};
    ajaxOpts.type = options.method || 'GET';

    if (options.url.indexOf(API.endpoint) >= 0) {
      var token = API.get('token');
      if (token && token.length > 0) {
        ajaxOpts.headers = {authorization: 'Bearer ' + token};
      }
    }

    return $.ajax(ajaxOpts).done(options.success).fail(options.error);
  };

  /**
   * writes data to a specific file. overwrites file if it already exists<br>
   * calls appropriate callbacks when finished or encountered an error
   *
   * @method writeFile
   * @memberof data.fs
   * @instance
   * @param {String} filename that should be written to
   * @param {String} data that should be written
   * @param {Function} callback when finished
   * @param {Function} errorCallback when encountered an error
   **/
  fs.writeFile = function(filename, data, callback, errorCallback){};

  /**
   * reads a file from the local file system<br>
   * converts to a JSON object if detected
   *
   * @method readFile
   * @memberof data.fs
   * @instance
   * @param {String} filename that should be written to
   * @param {Function} callback when finished
   * @param {Function} errorCallback when encountered an error
   **/
  fs.readFile = function(filename, callback, errorCallback){};

  /**
   * reads a file from the local file system as binary data
   *
   * @method readFileBinary
   * @memberof data.fs
   * @instance
   * @param {String} filename that should be written to
   * @param {Function} callback when finished
   * @param {Function} errorCallback when encountered an error
   **/
  fs.readFileBinary = function(filename, callback, errorCallback){};

  /**
   * reads all files in a directory<br>
   * returns an array containing all filenames
   *
   * @method readdir
   * @memberof data.fs
   * @instance
   * @param {String} path of directory
   * @param {Function} callback when finished
   **/
  fs.readdir = function(path, callback){};

  /**
   * checks if a local file or directory exists
   *
   * @method exists
   * @memberof data.fs
   * @instance
   * @param {String} path of file or directory
   * @param {Function} callback when finished
   **/
  fs.exists = function(path, callback){};

  /**
   * **CAUTION**: removes a directory and all of its contents recursively<br>
   * only use if really sure or on temporary storage
   *
   * @method rmdir
   * @memberof data.fs
   * @instance
   * @param {String} path of directory
   * @param {Function} callback when finished
   **/
  fs.rmdir = function(path, callback){};

  /**
   * creates a directory on the local FileSystem
   *
   * @method mkdir
   * @memberof data.fs
   * @instance
   * @param {String} path of directory
   * @param {String} mode of directory
   * @param {Function} callback when finished
   **/
  fs.mkdir = function(path, mode, callback){};

  /**
   * unlinks a file from the local filesystem
   *
   * @method unlink
   * @memberof data.fs
   * @instance
   * @param {String} path of file
   * @param {Function} callback when finished
   **/
  fs.unlink = function(path, callback){};

  /**
   * renames a file in the local filesystem
   *
   * @method rename
   * @memberof data.fs
   * @instance
   * @param {String} path of file
   * @param {String} newPath of file
   * @param {Function} callback when finished
   **/
  fs.rename = function(path, newPath, callback){};

  /**
   * gets the files checksum
   *
   * @method checksum
   * @memberof data.fs
   * @instance
   * @param {String} path of file
   * @param {Function} callback when finished
   **/
  fs.checksum = function(path, callback){};

  return fs;
});
