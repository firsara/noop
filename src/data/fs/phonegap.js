/*
 * phonegap.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define(['./base', '../../config', '../API'], function(fileSystem, config, API){
  return function(){
    fileSystem.dataPath = null;

    fileSystem.correctLocalFilePath = function(path) {
      if (path === '/') path = '';
      return (fileSystem.dataSubFolder + '/' + path.replace(fileSystem.dataPath, '').replace(fileSystem.dataSubFolder + '/', '')).replace(fileSystem.dataSubFolder + '/' + fileSystem.dataSubFolder, fileSystem.dataSubFolder + '/');
    };

    fileSystem.getFileEntry = function(filename, callback, errorCallback){
      // correct file path
      filename = fileSystem.correctLocalFilePath(filename.replace('file://', ''));

      fileSystem.getFileSystem(function(fs){
        fileSystem.mkdir(fileSystem.extractDirectory(filename), 0744, function(dirEntry){
          dirEntry.getFile(fileSystem.extractFilename(filename), {create: true}, function(fileEntry){

            if (callback) {
              callback(fileEntry);
            }

          }, errorCallback);
        }, errorCallback);
      }, errorCallback);
    };

    fileSystem.writeFile = function(filename, data, callback, errorCallback){
      // correct file path
      filename = fileSystem.correctLocalFilePath(filename);

      fileSystem.getFileSystem(function(fs){
        fileSystem.mkdir(fileSystem.extractDirectory(filename), 0744, function(dirEntry){
          dirEntry.getFile(fileSystem.extractFilename(filename), {create: true}, function(fileEntry){

            var fileURL = fileEntry.toURL();

            fileEntry.createWriter(function(writer){

              writer.onwrite = function(evt){
                if (callback) {
                  callback(fileURL);
                }
              };

              writer.onerror = function(evt){
                if (errorCallback) {
                  errorCallback(evt.target.error);
                }
              };

              writer.write(data);

            }, errorCallback);

          }, errorCallback);
        }, errorCallback);
      }, errorCallback);
    };

    fileSystem.readFile = function(filename, callback, errorCallback){
      // correct file path
      filename = fileSystem.correctLocalFilePath(filename);

      fileSystem.getFileSystem(function(fs){
        fs.root.getDirectory(fileSystem.extractDirectory(filename), {create: false, exclusive: false}, function(dirEntry){
          dirEntry.getFile(fileSystem.extractFilename(filename), {create: false}, function(fileEntry){

            fileEntry.file(function(file){

              var reader = new FileReader();

              reader.onloadend = function(evt) {
                if (callback) {
                  callback(evt.target.result);
                }
              };

              reader.onerror =  function(evt){
                if (errorCallback) {
                  errorCallback();
                }
              };

              reader.readAsText(file);

            }, errorCallback);

          }, errorCallback);
        }, errorCallback);
      }, errorCallback);
    };

    fileSystem.readFileBinary = function(filename, callback, errorCallback){
      // correct file path
      filename = fileSystem.correctLocalFilePath(filename);

      fileSystem.getFileSystem(function(fs){
        fs.root.getDirectory(fileSystem.extractDirectory(filename), {create: false, exclusive: false}, function(dirEntry){
          dirEntry.getFile(fileSystem.extractFilename(filename), {create: false}, function(fileEntry){

            fileEntry.file(function(file){

              var reader = new FileReader();

              reader.onloadend = function(evt) {
                if (callback) {
                  callback(evt.target.result);
                }
              };

              reader.onerror =  function(evt){
                if (errorCallback) {
                  errorCallback();
                }
              };

              reader.readAsBinaryString(file);

            }, errorCallback);

          }, errorCallback);
        }, errorCallback);
      }, errorCallback);
    };

    fileSystem.pipe = function(options){
      options.local = fileSystem.correctLocalFilePath(options.local);

      // get directory out of local path
      var directory = fileSystem.getFolder(options.local);

      // otherwise ensure local directory exists
      fileSystem.mkdir(directory, 0744, function(){
        // create a temporary file stream (move file to real path when finished correctly)
        var fileTransfer = new FileTransfer();
        var uri = encodeURI(options.remote);

        var downloadOptions = {};

        if (options.remote.indexOf(API.endpoint) >= 0) {
          var token = API.get('token');
          if (token && token.length > 0) {
            downloadOptions.headers = {authorization: 'Bearer ' + token};
          }
        }

        if (options.progress) {
          fileTransfer.onprogress = function(progressEvent) {
            if (progressEvent.lengthComputable) {
              options.progress(progressEvent.loaded / progressEvent.total);
            }
          };
        }

        var success = function(entry) {
          fileSystem.rename(options.local + '_tmp.file', options.local, function(){
            if (options.success) {
              options.success(options.local);
            }
          });
        };

        var error = function(error){
          if (options.error) {
            options.error(error);
          }
        };

        var localFileName = fileSystem.dataBasePath + options.local + '_tmp.file';
        var trustAllHosts = false;

        fileTransfer.download(uri, localFileName, success, error, trustAllHosts, downloadOptions);
      });
    };

    fileSystem.readdir = function(path, callback){
      // correct file path
      path = fileSystem.correctLocalFilePath(path);

      var fail = function(){
        if (callback) {
          callback([]);
        }
      };

      fileSystem.getFileSystem(function(fs){
        fs.root.getDirectory(path, {create: false, exclusive: false}, function(dirEntry){
          var directoryReader = dirEntry.createReader();
          directoryReader.readEntries(function(entries){
            var flist = [];

            for (var i = 0; i < entries.length; i++){
              flist.push(entries[i].name);
            }

            if (callback) {
              callback(flist);
            }
          }, fail);
        }, fail);
      }, fail);
    };

    fileSystem.exists = function(path, callback){
      // correct file path
      path = fileSystem.correctLocalFilePath(path);

      var dirName = fileSystem.extractDirectory(path);
      var fileName = fileSystem.extractFilename(path);

      var success = function(flist){
        for (var i = 0; i < flist.length; i++){
          if (flist[i].match(fileName)){
            if (callback) {
              callback(true);
            }

            return;
          }
        }

        if (callback) {
          callback(false);
        }
      };

      var error = function(){
        if (callback) {
          callback(false);
        }
      };

      fileSystem.readdir(dirName, success, error);
    };

    fileSystem.rmdir = function(path, callback){
      // correct file path
      path = fileSystem.correctLocalFilePath(path);

      var cleanup = function(directory, callback){
        if (directory.substring(directory.length - 1) === '/') directory = directory.substring(0, directory.length - 1);

        fileSystem.readdir(directory, function(entries){

          var checkEntry = function(index){
            if (entries[index]) {
              if (entries[index].indexOf('.') >= 0) {
                fileSystem.unlink(directory + '/' + entries[index], function(){
                  checkEntry(index + 1);
                });
              } else {
                cleanup(directory + '/' + entries[index], function(){
                  fileSystem.removeDirectory(directory + '/' + entries[index]);
                  checkEntry(index + 1);
                });
              }
            } else {
              if (callback) {
                callback();
              }
            }
          };

          checkEntry(0);

        });
      };

      fileSystem.getFileSystem(function(fs){
        cleanup(path, function(){
          fileSystem.removeDirectory(path, callback);
        });
      }, callback);
    };

    fileSystem.removeDirectory = function(path, callback){
      // correct file path
      path = fileSystem.correctLocalFilePath(path);

      fileSystem.getFileSystem(function(fs){
        fs.root.getDirectory(path, {create: false, exclusive: false}, function(dirEntry){
          dirEntry.remove(callback, callback);
        }, callback);
      }, callback);
    };

    fileSystem.mkdir = function(path, mode, callback, error){
      // correct file path
      path = fileSystem.correctLocalFilePath(path);

      if (! error) {
        error = callback;
      }

      var folders = path.split('/');
      var folderIndex = 0;

      var createFolder = function(dirEntry){
        var path = folders[folderIndex];

        if (path && path.length > 0) {
          dirEntry.getDirectory(path, {create: true, exclusive: false}, createdFolder, error);
        } else {
          if (callback) {
            callback(dirEntry);
          }
        }
      };

      var createdFolder = function(dirEntry){
        folderIndex++;
        createFolder(dirEntry);
      };

      fileSystem.getFileSystem(function(fs){
        createFolder(fs.root);
      }, callback);
    };

    fileSystem.unlink = function(path, callback){
      // correct file path
      path = fileSystem.correctLocalFilePath(path);

      if (path.indexOf('.') >= 0) {
        fileSystem.getFileSystem(function(fs){
          fs.root.getDirectory(fileSystem.extractDirectory(path), {create: false, exclusive: false}, function(dirEntry){
            dirEntry.getFile(fileSystem.extractFilename(path), {create: false}, function(fileEntry){
              fileEntry.remove(callback, callback);
            }, callback);
          }, callback);
        }, callback);
      } else {
        fileSystem.rmdir(path, callback);
      }
    };

    fileSystem.rename = function(path, newPath, callback){
      // correct file path
      path = fileSystem.correctLocalFilePath(path);
      newPath = fileSystem.correctLocalFilePath(newPath);

      var move = function(entry, toDirectory, withFilename){
        entry.moveTo(toDirectory, withFilename, callback, callback);
      };

      fileSystem.getFileSystem(function(fs){
        fileSystem.mkdir(fileSystem.extractDirectory(path), 0744, function(dirEntry){
          fileSystem.mkdir(fileSystem.extractDirectory(newPath), 0744, function(dirEntryNew){
            // if it is a file
            if (path.indexOf('.') >= 0) {
              dirEntry.getFile(fileSystem.extractFilename(path), {create: false}, function(entry){
                move(entry, dirEntryNew, fileSystem.extractFilename(newPath));
              });
            } else {
              dirEntry.getDirectory(fileSystem.extractFilename(path), {create: false}, function(entry){
                move(entry, dirEntryNew, fileSystem.extractFilename(newPath));
              });
            }
          });
        });
      }, callback);
    };

    fileSystem.checksum = function(path, callback){
      // correct file path
      path = fileSystem.getLocalFilePath(path);

      var _calledCallback = null;
      var _autoFailTimeout = null;

      var done = function(data){
        if (_calledCallback) return;
        _calledCallback = true;

        if (_autoFailTimeout) clearTimeout(_autoFailTimeout);

        if (callback) {
          callback(data);
        }
      };

      var fail = function(){
        if (_calledCallback) return;
        done('');
      };

      md5chksum.file(path, function(sum) {
        if (sum && sum.length > 0) {
          done(sum);
        } else {
          fail();
        }
      }, fail);

      _autoFailTimeout = setTimeout(fail, 100);
    };

    fileSystem.init = function(callback){
      fileSystem.getFileSystem(function(fs){
        fileSystem.dataBasePath = fs.root.nativeURL.replace('file://', '');
        fileSystem.dataPath = fileSystem.dataBasePath + fileSystem.dataSubFolder + '/';

        if (config.debug) {
          console.log(fileSystem.dataBasePath);
        }

        if (callback) {
          callback();
        }
      });
    };


    var _cachedFileSystem = null;

    fileSystem.getFileSystem = function(callback){
      if (_cachedFileSystem) {
        if (callback) {
          callback(_cachedFileSystem);
        }
      } else {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs){
          _cachedFileSystem = fs;

          if (callback) {
            callback(fs);
          }
        });
      }
    };

    fileSystem.extractDirectory = function(path){
      var dirPath;
      var lastSlash = path.lastIndexOf('/');

      if (lastSlash === -1) {
        dirPath = '/';
      } else {
        dirPath = path.substring(0, lastSlash);

        if (dirPath === '') {
          dirPath = '/';
        }
      }

      return dirPath;
    };

    fileSystem.extractFilename = function(path){
      var lastSlash = path.lastIndexOf('/');

      if (lastSlash === -1){
        return path;
      }

      var filename =  path.substring(lastSlash + 1);

      return filename;
    };
  };
});
