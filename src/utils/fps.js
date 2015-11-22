/*
 * fps.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define(['../sys', './EventDispatcher', 'EaselJS'], function(sys, EventDispatcher, createjs) {

  /**
   * helper class to handle fps ticking based on EaselJS Ticker.<br>
   * dispatches tick on every new frame request.
   *
   * @example
   *
   * fps.addEventListener('tick', paint);
   * fps.measured // = 60
   *
   * @class fps
   * @extends utils.EventDispatcher
   * @memberof utils
   **/
  function fps(){
    EventDispatcher.call(this);

    /**
     * measured fps
     * @memberof utils.fps
     * @instance
     * @var {Number} measured
     */
    this.measured = 60;

    // properties to calculate average fps
    this._startTime = Date.now();
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

  var p = sys.extend(fps, EventDispatcher);

  /**
   * delegate application rendering
   * calculates fps through stats.js
   *
   * @method _updateStats
   * @memberof utils.fps
   * @instance
   * @private
   **/
  var _updateStats = function(){
    requestAnimationFrame(this._updateStats);

    window.stats.begin();
    this.dispatchEvent('tick');
    window.stats.end();
    if (this._ticked++ > 240) this._calc();
  };


  /**
   * delegate application rendering
   * tracks fps for further potential adjustments if lags were detected
   *
   * @method _update
   * @memberof utils.fps
   * @instance
   * @private
   **/
  var _update = function(){
    requestAnimationFrame(this._update);

    this.dispatchEvent('tick');
    if (this._ticked++ > 240) this._calc();
  };

  /**
   * calculate current fps
   *
   * @method _calc
   * @memberof utils.fps
   * @instance
   * @private
   **/
  var _calc = function(){
    var now = Date.now();

    var offset = now - this._startTime;

    this.measured = Math.round(this._ticked * 1000 / offset);
    this._startTime = now;
    this._ticked = 0;
  };

  return new fps();
});
