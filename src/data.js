// require base classes that can be used in templates via data-class
define([
  './data/API',
  './data/fs',
  './data/Loader',
  './data/Model',
  './data/Collection',
  './data/Synchronizer'
], function(
  API,
  fs,
  Loader,
  Model,
  Collection,
  Synchronizer
){
  return {
    API: API,
    fs: fs,
    Loader: Loader,
    Model: Model,
    Collection: Collection,
    Synchronizer: Synchronizer
  }
});
