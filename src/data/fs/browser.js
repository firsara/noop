/*
 * browser.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define(['./base'], function(fileSystem){
  return function(){
    fileSystem.getLocalFilePath = function(path) {
      return path;
    };

    fileSystem.writeFile = function(filename, data, callback, errorCallback){
      if (callback) {
        callback();
      }
    };

    fileSystem.readFile = function(filename, callback, errorCallback){
      var urlToLoad = filename + (filename.indexOf('?') >= 0 ? '&' : '?') + fileSystem.bust;
      $.get(urlToLoad, callback).fail(errorCallback);
    };

    fileSystem.download = function(options, callback){
      if (typeof options === 'string') {
        options = {remote: options};
      }

      if (callback && ! options.success) options.success = callback;

      if (options.success) {
        options.success(options.remote);
      }
    };

    fileSystem.readdir = function(path, callback){
      if (callback) {
        callback([]);
      }
    };

    fileSystem.exists = function(path, callback){
      if (callback) {
        callback(false);
      }
    };

    fileSystem.mkdir = function(path, mode, callback){
      if (callback) {
        callback();
      }
    };

    fileSystem.rmdir = function(path, callback){
      if (callback) {
        callback();
      }
    };

    fileSystem.unlink = function(path, callback){
      if (callback) {
        callback();
      }
    };
  };
});
