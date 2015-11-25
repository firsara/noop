/*
 * nwjs.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define(['./base', '../API'], function(fileSystem, API){
  return function(){
    if (!! window.nodeRequire) {
      var nw = nodeRequire('nw.gui');
      var fs = nodeRequire('fs');
      var request = nodeRequire('request');
      var mkdirp = nodeRequire('mkdirp');
      var checksum = nodeRequire('checksum');

      fileSystem.dataPath = nw.App.dataPath + '/' + fileSystem.dataSubFolder + '/';
    }

    fileSystem.writeFile = function(filename, data, callback, errorCallback){
      // correct file path
      filename = fileSystem.correctLocalFilePath(filename);

      // get directory from path
      var directory = fileSystem.getFolder(filename);

      // first ensure the directory that should be written to exists
      fileSystem.mkdir(directory, 0744, function(){
        // write data to the file
        fs.writeFile(filename, data, function(err){
          // process result
          if (err) {
            if (errorCallback) {
              errorCallback(err);
            }
          } else {
            if (callback) {
              callback();
            }
          }
        });
      });
    };

    fileSystem.readFile = function(filename, callback, errorCallback){
      // correct file path
      filename = fileSystem.correctLocalFilePath(filename);

      // check if file exists first
      fs.exists(filename, function(exists){
        if (exists) {
          // if it exists: read file
          fs.readFile(filename, function(err, data){
            if (err) {
              errorCallback(err);
            } else {
              if (callback) {
                callback(data.toString());
              }
            }
          });
        } else {
          if (errorCallback) {
            errorCallback();
          }
        }
      });
    };

    fileSystem.readFileBinary = function(filename, callback, errorCallback){
      // correct file path
      filename = fileSystem.correctLocalFilePath(filename);

      // check if file exists first
      fs.exists(filename, function(exists){
        if (exists) {
          // if it exists: read file
          fs.readFile(filename, function(err, data){
            if (err) {
              errorCallback(err);
            } else {
              if (callback) {
                callback(data);
              }
            }
          });
        } else {
          if (errorCallback) {
            errorCallback();
          }
        }
      });
    };

    fileSystem.pipe = function(options){
      // correct file path
      options.local = fileSystem.correctLocalFilePath(options.local);

      // get directory out of local path
      var directory = fileSystem.getFolder(options.local);

      // otherwise ensure local directory exists
      fileSystem.mkdir(directory, 0744, function(){
        // create a temporary file stream (move file to real path when finished correctly)
        var file = fs.createWriteStream(options.local + '_tmp');

        // get request object
        var r = fileSystem.request({url: options.remote, method: options.method, data: options.data});

        // store total and loaded bytes and call progress callback on new data
        var totalBytes = 0;
        var loadedBytes = 0;
        var progress = 0;

        // track if request status is 200
        var fileWasFound = false;
        var didThrowError = false;

        // store basic request response
        r.on('response', function(response){
          totalBytes = response.headers['content-length'];
          if (response.statusCode === 200) {
            fileWasFound = true;
          }
        });

        // if it has a progress handler
        if (options.progress) {
          // call progress on new data
          r.on('data', function(chunk){
            loadedBytes += chunk.length;
            progress = loadedBytes / totalBytes;
            options.progress(progress);
          });
        }

        r.on('error', function(err){
          if (options.error && ! didThrowError) {
            didThrowError = true;
            options.error(err);
          }

          // TODO: this somehow creates errors when trying to rename file!!!
          // fileSystem.unlink(options.local + '_tmp');
        });

        // when downloading has finished
        r.on('end', function(){
          // if file was found on remote
          if (fileWasFound) {
            // rename temporary file accordingly
            fs.rename(options.local + '_tmp', options.local, function(err){
              // if there was an error while renaming
              if (err) {
                // call error callback
                if (options.error && ! didThrowError) {
                  didThrowError = true;
                  options.error(err);
                }
              } else {
                // otherwise: finally call success
                if (options.success) {
                  options.success(options.local);
                }
              }
            });
          } else {
            // if file was not found on remote: call error callback
            if (options.error && ! didThrowError) {
              didThrowError = true;
              options.error();
            }
          }
        });

        // if there was an error while writing the file
        file.on('error', function(err){
          // call error callback
          if (options.error && ! didThrowError) {
            didThrowError = true;
            options.error(err);
          }
        });

        // pipe file to request
        r.pipe(file);
      });
    };

    fileSystem.request = function(options, callback, errorCallback){
      if (typeof options === 'string') {
        options = {url: options};
      }

      if (callback && ! options.success) options.success = callback;
      if (errorCallback && ! options.error) options.error = errorCallback;

      var requestOptions = {url: options.url};

      if (options.url.indexOf(API.endpoint) >= 0) {
        var token = API.get('token');
        if (token && token.length > 0) {
          requestOptions.auth = {bearer: token};
        }
      }

      // pass in request method (GET, POST, PUT, DELETE)
      if (options.method) {
        requestOptions.method = options.method;
      }

      // pass in request data if set
      if (options.data) {
        requestOptions.form = options.data;
      }

      var success = null, r;

      if (options.success) {
        success = function(err, httpResponse, body){
          if (fileWasFound) {
            if (options.success) {
              options.success(body);
            }
          }
        };

        // request remote url
        r = request(requestOptions, success);
      } else {
        r = request(requestOptions);
      }

      // track if request status is 200
      var fileWasFound = false;

      // store basic request response
      r.on('response', function(response){
        if (response.statusCode === 200) {
          fileWasFound = true;
        }
      });

      if (options.error) {
        r.on('error', options.error);
      }

      return r;
    };

    fileSystem.readdir = function(path, callback){
      // correct file path
      path = fileSystem.correctLocalFilePath(path);

      // check if directory exists first
      fs.exists(path, function(exists){
        // return results. if any error is encountered simply return an empty array
        if (exists) {
          fs.readdir(path, function(err, files){
            if (err) {
              if (callback) {
                callback([]);
              }
            } else {
              if (callback) {
                callback(files);
              }
            }
          });
        } else {
          if (callback) {
            callback([]);
          }
        }
      });
    };

    fileSystem.exists = function(path, callback){
      // correct file path
      path = fileSystem.correctLocalFilePath(path);

      // check if exists
      fs.exists(path, function(exists){
        // return result
        if (callback) {
          callback(exists);
        }
      });
    };

    fileSystem.rmdir = function(path, callback){
      // correct file path
      path = fileSystem.correctLocalFilePath(path);

      // if directory exists
      fs.exists(path, function(exists){
        if (exists) {
          // read it
          fs.readdir(path, function(err, files){
            if (err) {
              // for errors just stop
              if (callback) {
                // Pass the error on to callback
                callback(err, []);
              }

              return;
            }

            // track how many files and directories got removed
            var wait = files.length;
            var count = 0;
            var folderDone = function(err){
              count++;

              // If we cleaned out all the files, continue
              if (count >= wait || err) {
                fs.rmdir(path, callback);
              }
            };

            // Empty directory to bail early
            if (! wait) {
              folderDone();
              return;
            }

            // Remove one or more trailing slash to keep from doubling up
            path = path.replace(/\/+$/, '');

            // loop through files
            files.forEach(function(file){
              // correct current path
              var currentPath = path + '/' + file;

              // get file status
              fs.lstat(currentPath, function(err, stats){
                if (err) {
                  if (callback) {
                    callback(err, []);
                  }

                  return;
                }

                // if it is a directory
                if (stats.isDirectory()) {
                  // remove it recursively
                  fileSystem.rmdir(currentPath, folderDone);
                } else {
                  // otherwise just unlink the file
                  fs.unlink(currentPath, folderDone);
                }
              });
            });
          });
        } else {
          // if folder does not exists
          if (callback) {
            // just call the callback
            callback();
          }
        }
      });
    };

    fileSystem.mkdir = function(path, mode, callback){
      if (path + '/' === fileSystem.dataPath) {
        if (callback) {
          callback();
        }

        return;
      }

      // correct file path
      path = fileSystem.correctLocalFilePath(path);

      mkdirp(path, mode, callback);
    };

    fileSystem.unlink = function(path, callback){
      // correct file path
      path = fileSystem.correctLocalFilePath(path);

      fs.exists(path, function(exists){
        if (exists) {
          fs.lstat(path, function(err, stats){
            if (err) {
              if (callback) callback();
              return;
            }

            // if it is a directory
            if (stats.isDirectory()) {
              // remove it recursively
              fileSystem.rmdir(path, callback);
            } else {
              // otherwise just unlink the file
              fs.unlink(path, callback);
            }
          });
        } else {
          if (callback) callback();
        }
      });
    };

    fileSystem.rename = function(path, newPath, callback){
      // correct file path
      path = fileSystem.correctLocalFilePath(path);
      newPath = fileSystem.correctLocalFilePath(newPath);

      fs.exists(path, function(exists){
        if (exists) {
          fs.rename(path, newPath, callback);
        } else {
          if (callback) callback();
        }
      });
    };

    fileSystem.checksum = function(path, callback){
      // correct file path
      path = fileSystem.correctLocalFilePath(path);

      checksum.file(path, {algorithm: 'md5'}, function(err, sum) {
        if (err) {
          if (callback) {
            callback('');
          }
        } else {
          if (callback) {
            callback(sum);
          }
        }
      });
    };
  };
});
