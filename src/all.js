define([
  './config',
  './sys',
  './uri',
  './data',
  './dom',
  './easeljs',
  './utils'
], function(
  config,
  sys,
  uri,
  data,
  dom,
  easeljs,
  utils
){
  return {
    config: config,
    sys: sys,
    uri: uri,
    data: data,
    dom: dom,
    easeljs: easeljs,
    utils: utils
  }
});