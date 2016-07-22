/*
 * fps.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define(['../sys', './EventDispatcher'], function(sys, EventDispatcher) {

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
  function FPSHandler(){
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
    this._raf = null;

    _init.call(this);
  }

  var p = sys.extend(FPSHandler, EventDispatcher);

  p.addEventListener = function(type, listener){
    EventDispatcher.prototype.addEventListener.call(this, type, listener);
    _init.call(this);
  };

  p.removeEventListener = function(type, listener){
    EventDispatcher.prototype.removeEventListener.call(this, type, listener);
    _init.call(this);

    if (this.hasEventListener('tick')) {
      _bind.call(this);
    } else {
      _unbind.call(this);
    }
  };

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
    this._raf = requestAnimationFrame(this._updateStats);

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
    this._raf = requestAnimationFrame(this._update);

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

  var _bind = function(){
    if (! this._raf) {
      if (window.stats) {
        // if stats.js is included run a different function updater
        this._updateStats();
      } else {
        this._update();
      }
    }
  };

  var _unbind = function(){
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
  };

  var _init = function(){
    if (this.hasEventListener('tick') || window.stats) {
      _bind.call(this);
    } else {
      _unbind.call(this);
    }
  };

  return new FPSHandler();
});
