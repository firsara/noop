/*
 * config.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define(['app.config'], function(configJSON){

  /**
   * sets application configuration based on environment
   * @namespace config
   */
  var config = configJSON;

  /**
   * checks if is a touch device
   * @memberof config
   * @instance
   * @var {Boolean} isTouch
   */
  config.isTouch = ('ontouchstart' in window) ||
                   (window.Modernizr && window.Modernizr.touch) ||
                   (navigator.msMaxTouchPoints || navigator.maxTouchPoints) > 2;

  /**
   * wheter the application runs in iOS
   * @memberof config
   * @instance
   * @var {Boolean} iOS
   */
  config.iOS = /(iPad|iPhone|iPod)/g.test(navigator.userAgent) || (window.device && window.device.platform.toString().toLowerCase() === 'ios');

  /**
   * wheter the application runs in android
   * @memberof config
   * @instance
   * @var {Boolean} android
   */
  config.android = (window.device && window.device.platform.toString().toLowerCase() === 'android');

  // add class to body depending on touch support
  var body = document.getElementsByTagName('body')[0];
  body.className = (body.className.length > 0 ? body.className + ' ' : '') + (config.isTouch ? 'touch' : 'no-touch');

  /**
   * checks current environment (nwjs, phonegap, browser)
   * @memberof config
   * @instance
   * @var {String} environment
   */
  if (!! window.nodeRequire) {
    config.environment = 'nwjs';
  } else if (!! window.cordova) {
    config.environment = 'phonegap';
  } else {
    config.environment = 'browser';
  }

  body.className = (body.className.length > 0 ? body.className + ' ' : '') + ('env-' + config.environment);
  body.className = (body.className.length > 0 ? body.className + ' ' : '') + (config.iOS ? 'ios' : 'no-ios');

  /**
   * check if app is running on localhost
   * @memberof config
   * @instance
   * @var {Boolean} isLocal
   */
  config.isLocal = window.location.href.indexOf('localhost') >= 0;

  // for nwjs applications:
  if (config.environment === 'nwjs') {
    var gui = nodeRequire('nw.gui');
    var win = gui.Window.get();

    // if it's not fullscreen or kiosk:
    if (! (win.isFullscreen || win.isKioskMode)) {
      // assume it runs local
      config.isLocal = true;
    }
  }

  // merge environment specific data to config
  // i.e. merge local or live configuration to main config
  for (var k in config[config.target]) {
    if (config[config.target].hasOwnProperty(k)) {
      config[k] = config[config.target][k];
    }
  }

  // delete temporary config
  delete config.local;
  delete config.live;
  delete config.testing;
  delete config.staging;

  return config;
});
