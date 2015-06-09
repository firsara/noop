define([
  './sys',
  './uri',
  './data',
  './dom',
  './easeljs',
  './utils'
], function(
  sys,
  uri,
  data,
  dom,
  easeljs,
  utils
){
  return {
    sys: sys,
    uri: uri,
    data: data,
    dom: dom,
    easeljs: easeljs,
    utils: utils
  }
});