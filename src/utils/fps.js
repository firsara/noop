/*
 * fps.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define(['../sys', 'EaselJS'], function(sys, createjs) {

  /**
   * helper class to handle fps ticking based on EaselJS Ticker
   *
   * @class FPSHandler
   * @extends createjs.EventDispatcher
   * @memberof utils
   **/
  function FPSHandler(){
    createjs.EventDispatcher.call(this);

    // properties to calculate average fps
    this._startTime = Date.now();
    this._prevTime = this._startTime;
    this._ms = 0;
    this._msMin = Infinity;
    this._msMax = 0;
    this._fps = 0;
    this._fpsMin = Infinity;
    this._fpsMax = 0;
    this._frames = 0;
    this._average = 0;
    this._combinedFPS = 0;
    this._ticked = 0;

    this._averageFPSTicks = [];

    this._wasOutOfFocus = false;

    // TODO: override and inherit in application's FPS child class?

    /**
     * basic configuration
     * **NOTE**: RAF will not go beyond 60 fps (which does not make a lot of sense anyway)
     *
     * @memberof utils.FPSHandler
     * @instance
     * @var {jQuery} config
     * @property {Number} fps (default=60) at which fps count FPSHandler should dispatch updates
     * @property {Number} targetFPS (default=60) which fps count FPSHandler should try to get
     * @property {Number} minFPS (default=30) minimum fps that FPSHandler should go to when detecting downtimes
     * @property {String} timingMode (default=requestAnimationFrame) what kind of timing mode should be used
     */
    this.config = {
      fps: 90,
      targetFPS: 90,
      minFPS: 30,
      timingMode: createjs.Ticker.RAF
    };

    // set easeljs timing mode to configured one (shouldn't be a different than RAF = requestAnimationFrame)
    createjs.Ticker.timingMode = this.config.timingMode;

    // set preferred fps that application should render
    createjs.Ticker.setFPS(this.config.fps);

    // if stats.js is included run a different function updater
    if (window.stats) {
      createjs.Ticker.on('tick', this._updateStats, this);
    //} else {
    //  createjs.Ticker.on('tick', this._update, this);
    }

    // check current fps all 10 seconds
    //setInterval(this._checkFPS.bind(this), 10000);

    // adjust fps every minute if big lags have been detected
    //setInterval(this._updateFPS.bind(this), 60000);

    // check if window was out of focus during fps checks (i.e. no frames got paint at all, so calculation is wrong)
    //window.addEventListener('blur', this._windowBlur.bind(this));
  }

  var p = sys.extend(FPSHandler, createjs.EventDispatcher);

  /**
   * delegate application rendering
   * calculates fps through stats.js
   *
   * @method _updateStats
   * @memberof utils.FPSHandler
   * @instance
   * @private
   **/
  p._updateStats = function(event){
    //this._begin();

    window.stats.begin();

    // TODO: deprecated. use reality in box2d child abstractor class
    if (this.reality) {
      this.reality.update(event);
    }

    this.dispatchEvent(event);

    window.stats.end();

    //this._end();
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
  p._update = function(event){
    //this._begin();

    // TODO: deprecated. use reality in box2d child abstractor class
    if (this.reality) {
      this.reality.update(event);
    }

    this.dispatchEvent(event);

    //this._end();
  };

  /**
   * track average fps every x seconds defined through setInterval
   * assume a downtime of 10 frames is ok and could happen
   *
   * @method _checkFPS
   * @memberof utils.FPSHandler
   * @instance
   * @private
   **/
  p._checkFPS = function(){
    this._averageFPSTicks.push(Math.round(this._average + 10));
    this._resetAverage();
  };

  /**
   * adjust current fps based on downtimes
   * i.e. if a big lag is detected throughout about one minute -> throttle fps down a bit
   *
   * @method _updateFPS
   * @memberof utils.FPSHandler
   * @instance
   * @private
   **/
  p._updateFPS = function(){
    // if window was not blurred during checks (i.e. did not paint at all / wrong calculations)
    if (! this._wasOutOfFocus) {
      var correctedFPSTicks = [];
      var averageFPS = 0;

      // get highest and lowest fps in average ticks
      var lowestFPSTick = Math.min.apply(Math, this._averageFPSTicks);
      var highestFPSTick = Math.max.apply(Math, this._averageFPSTicks);

      // calculate average fps throughout all the tick averages
      for (var i = 0, _len = this._averageFPSTicks.length; i < _len; i++) {
        // ignore lowest FPS tick (extreme downtimes can happen)
        if (this._averageFPSTicks[i] === lowestFPSTick) {
          correctedFPSTicks.push(this._averageFPSTicks[i]);
          averageFPS += this._averageFPSTicks[i];
        }
      }

      averageFPS = averageFPS / (correctedFPSTicks.length - 1);

      // assume 10 frames of a downtime can happen and are normal
      var newFPS = Math.round(averageFPS + 10);

      // for any calculation errors use target fps instead
      if (isNaN(newFPS)) {
        newFPS = this.config.targetFPS;
      }

      // don't go lower than configured min fps and not higher than target fps
      this.config.fps = Math.max(this.config.minFPS, Math.min(this.config.targetFPS, newFPS));
      createjs.Ticker.setFPS(this.config.fps);
    }

    this._wasOutOfFocus = false;
    this._averageFPSTicks = [];
  };

  /**
   * begin tracking fps
   *
   * @method _begin
   * @memberof utils.FPSHandler
   * @instance
   * @private
   **/
  p._begin = function(){
    this._startTime = Date.now();
  };

  /**
   * stop tracking fps
   *
   * @method _end
   * @memberof utils.FPSHandler
   * @instance
   * @private
   **/
  p._end = function(){
    var time = Date.now();

    this._ms = time - this._startTime;
    this._msMin = Math.min(this._msMin, this._ms);
    this._msMax = Math.max(this._msMax, this._ms);

    this._frames++;

    if (time > this._prevTime + 1000) {
      this._fps = Math.round((this._frames * 1000) / (time - this._prevTime));
      this._fpsMin = Math.min(this._fpsMin, this._fps);
      this._fpsMax = Math.max(this._fpsMax, this._fps);

      this._prevTime = time;
      this._frames = 0;

      if (this._fps > 15) {
        this._ticked++;
        this._combinedFPS += this._fps;
        this._average = this._combinedFPS / this._ticked;
      }
    }

    return time;
  };

  /**
   * resets calculated average fps calculations
   *
   * @method _resetAverage
   * @memberof utils.FPSHandler
   * @instance
   * @private
   **/
  p._resetAverage = function(){
    this._combinedFPS = 0;
    this._average = 0;
    this._ticked = 0;
  };

  /**
   * tells FPSHandler that window was out of focus
   *
   * @method _windowBlur
   * @memberof utils.FPSHandler
   * @instance
   * @private
   **/
  p._windowBlur = function(){
    this._wasOutOfFocus = true;
  };

  return new FPSHandler();
});
