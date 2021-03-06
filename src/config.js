/*
 * config.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define(['text!app.config.json'], function(configJSON){

  /**
   * sets application configuration based on environment
   * @namespace config
   */
  var config = JSON.parse(configJSON);

  /**
   * checks if is a touch device
   * @memberof config
   * @instance
   * @var {Boolean} isTouch
   */
  config.isTouch = ('ontouchstart' in window) ||
                   (window.DocumentTouch && document instanceof DocumentTouch) ||
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

  /**
   * wheter the Container instances should be garbage collected
   * @memberof config
   * @instance
   * @var {Boolean} gcContainers
   */
  config.gcContainers = (config.gcContainers === null || typeof config.gcContainers === 'undefined') ? true : config.gcContainers;

  // add class to body depending on touch support
  document.body.classList.add(config.isTouch ? 'touch' : 'no-touch');

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

  document.body.classList.add('env-' + config.environment);
  document.body.classList.add(config.iOS ? 'ios' : 'no-ios');
  document.body.classList.add(config.android ? 'android' : 'no-android');

  /**
   * check if app is running on localhost
   * @memberof config
   * @instance
   * @var {Boolean} isLocal
   */
  config.isLocal = window.location.href.indexOf('localhost') >= 0;

  // for nwjs applications:
  if (config.environment === 'nwjs' || config.environment === 'phonegap') {
    config.isLocal = true;
  }

  return config;
});
