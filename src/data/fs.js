/*
 * fs.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define([
  '../config',
  './fs/base',
  './fs/nwjs',
  './fs/phonegap',
  './fs/browser'
], function(
  config,
  fs,
  nwjs,
  phonegap,
  browser
) {
  switch (config.environment) {
    case 'nwjs':
      nwjs();
    break;
    case 'phonegap':
      phonegap();
    break;
    case 'browser':
      browser();
    break;
    default:
      browser();
    break;
  }

  return fs;
});
