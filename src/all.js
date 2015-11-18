define([
  './config',
  './sys',
  './uri',
  './data',
  './dom',
  './utils'
], function(
  config,
  sys,
  uri,
  data,
  dom,
  utils
){
  return {
    config: config,
    sys: sys,
    uri: uri,
    data: data,
    dom: dom,
    utils: utils
  };
});
