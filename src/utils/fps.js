/*
 * fps.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define(['../sys', './EventDispatcher', 'EaselJS'], function(sys, EventDispatcher, createjs) {

  /**
   * helper class to handle fps ticking based on EaselJS Ticker
   *
   * @class FPSHandler
   * @extends EventDispatcher
   * @memberof utils
   **/
  function FPSHandler(){
    EventDispatcher.call(this);

    this.measured = 60;

    // properties to calculate average fps
    this._startTime = Date.now();
    this._currentTime = this._startTime;
    this._ticked = 0;

    this._update = _update.bind(this);
    this._updateStats = _updateStats.bind(this);
    this._calc = _calc.bind(this);

    // if stats.js is included run a different function updater
    if (window.stats) {
      this._updateStats();
    } else {
      this._update();
    }
  }

  var p = sys.extend(FPSHandler, EventDispatcher);

  /**
   * delegate application rendering
   * calculates fps through stats.js
   *
   * @method _updateStats
   * @memberof utils.FPSHandler
   * @instance
   * @private
   **/
  var _updateStats = function(){
    requestAnimationFrame(this._updateStats);

    window.stats.begin();
    this.dispatchEvent('tick');
    window.stats.end();
    this._calc();
  };


  /**
   * delegate application rendering
   * tracks fps for further potential adjustments if lags were detected
   *
   * @method _update
   * @memberof utils.FPSHandler
   * @instance
   * @private
   **/
  var _update = function(){
    requestAnimationFrame(this._update);

    this.dispatchEvent('tick');
    this._calc();
  };

  /**
   * stop tracking fps
   *
   * @method _calc
   * @memberof utils.FPSHandler
   * @instance
   * @private
   **/
  var _calc = function(){
    this._currentTime = Date.now();
    this._ticked++;

    var offset = this._currentTime - this._startTime;

    if (offset > 1000) {
      this.measured = this._ticked;
      this._startTime = this._currentTime;
      this._ticked = 0;
    }
  };

  return new FPSHandler();
});
