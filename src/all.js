define([
  './config',
  './sys',
  './data',
  './dom',
  './utils'
], function(
  config,
  sys,
  data,
  dom,
  utils
){
  return {
    config: config,
    sys: sys,
    data: data,
    dom: dom,
    utils: utils
  };
});
