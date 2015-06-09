/*
 * ScaleClip.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define(['EaselJS'], function(sys, createjs) {

  // Event constants

  // scale gets dispatched every frame a scale occured
  var SCALE = 'scale';

  // scaleComplete gets dispatched once the element completely stopped scaling (i.e. after throwing / flying)
  var SCALE_COMPLETE = 'scaleComplete';

  /**
   * used for scaling calculations<br>
   * **NOTE**: only calculation wrapper. gets extended in:
   * @see dom.ScaleClip
   * @see easeljs.ScaleClip
   *
   * @example
   * var scaler = new ScaleClip('&lt;img src="image.jpg"&gt;');
   * scaler.borders.scale = [0.1, 2];
   * scaler.free.scale = true; // overwrites borders
   *
   * @mixin BaseScaleClip
   * @memberof display.base
   **/
  function BaseScaleClip(){
    // borders: element can not be scaled beyond set borders
    // i.e. borders.scale = [-10, 10]  means that the element can only be scaled between -10 and 10
    this.borders.scale = [];

    // elastic: lets element be scaled beyond borders (value between 0 and 1 recommended)
    // i.e. elastic.scale = 0.5  means that the element could be scaled by 0.5 the scale after reaching borders
    this.elastic.scale = 0;

    // fraction.move.scale: lets elements scale calculations be multiplied by a defined fraction
    // i.e. fraction.move.scale = 2  means that the element would scale twice as fast than normally when scaling
    this.fraction.move.scale = 1;

    // fraction.release: lets elements throw calculation be multiplied by a defined fraction
    // i.e. fraction.release.scale = 10  means that the element would fly a long scale distance as if it was on ice when stopped scaling
    this.fraction.release.scale = 2;

    // fraction.speed.scale: lets element throwing be faster than it would be (not recommended changing a lot)
    // i.e. fraction.speed.scale = 2  means that the element would travel twice as fast when stopped scaling
    this.fraction.speed.scale = 1;

    // fraction.speed.max.scale: defines a maximum duration for element throwing
    // i.e. fraction.speed.max.scale = 1  means that the element would travel a maximum of 1 second no matter how far
    this.fraction.speed.max.scale = 1.3;

    // fraction.velocity.max: defines a maximum velocity that the element calculates
    // i.e. fraction.velocity.max.scale = 0.1  means that even if the element was scaled extremely fast it behaves as if it was not
    this.fraction.velocity.max.scale = Number.MAX_VALUE;


    // NOTE: recognizers should not be modified too much, they should work pretty well as defined

    // scale recognizers, used for dispatching scale events
    this.recognizer.scale = 0;

    /**
     * tween to throw properties when finished moving
     * @memberof display.base.BaseRotateClip
     * @instance
     * @private
     * @var {TweenLite} _scaleTween
     */
    this._scaleTween = null;

    // listen to all the events dispatched by parent class Transformable
    this.on('start', _startTransform);
    this.on('calc', _calc);
    this.on('update', _update);
    this.on('complete', _stopTransform);
  }

  /**
   * dispatches scale event
   *
   * @method _dispatchTweenUpdate
   * @memberof display.base.BaseScaleClip
   * @instance
   * @private
   **/
  var _dispatchTweenUpdate = function(){
    if (this.lock) {
      this._scaleTween = this._stopTween(this._scaleTween);
    }

    this.dispatchEvent(SCALE);
  };

  /**
   * dispatches scaleComplete event
   *
   * @method _dispatchComplete
   * @memberof display.base.BaseScaleClip
   * @instance
   * @private
   **/
  var _dispatchComplete = function(){
    this.dispatchEvent(SCALE_COMPLETE);
  };

  /**
   * stops previous tween if detected more than one finger
   *
   * @method _startTransform
   * @memberof display.base.BaseScaleClip
   * @instance
   * @private
   **/
  var _startTransform = function(event){
    if (this._activeFingers > 1) {
      this._scaleTween = this._stopTween(this._scaleTween);
    }
  };

  /**
   * calculates distance between two points
   *
   * @method _getDistance
   * @memberof display.base.BaseScaleClip
   * @instance
   * @private
   **/
  var _getDistance = function(p1, p2) {
    var x = p2.x - p1.x;
    var y = p2.y - p1.y;

    return Math.sqrt((x * x) + (y * y));
  };

  /**
   * calculates scale based on individual changed finger positions
   * for current frame only. Only calculates. Does not set properties on element
   *
   * @method _calc
   * @memberof display.base.BaseScaleClip
   * @instance
   * @private
   **/
  var _calc = function(event){
    if (this.lock) return;

    if (this._activeFingers > 1) {
      var points = [];

      // extract touchpoints
      for (var k in this._fingers) {
        if (this._fingers[k].current) {
          points.push(this._fingers[k]);

          // only use first two fingers
          if (points.length >= 2) break;
        }
      }

      var scale = _getDistance(points[0].current, points[1].current) / _getDistance(points[0].old, points[1].old);

      this._calc.scale = (scale - 1);
    }
  };

  /**
   * Sets calculated properties on element.
   * called only every frame, not on a mousemove or touchmove event.
   * only called when finger positions changed to save performance.
   *
   * @method _update
   * @memberof display.base.BaseScaleClip
   * @instance
   * @private
   **/
  var _update = function(event){
    if (this.lock) return;

    if (this._activeFingers > 1) {

      // check if tracked scales already passed scale recognizer
      // add calculated values to current properties
      // hold border properties while taking elasticity and fractions into account

      if (Math.abs(this._track.current.scale) >= this.recognizer.scale) {
        this._hold('scale', this, true, this._calc.scale * this.fraction.move.scale * this.fraction.base);
        this.recognizer.fired.scale = true;
        this.dispatchEvent(SCALE);
      }
    }
  };

  /**
   * Calculates throwing properties based on current velocity
   * initializes TweenLite animation if needed
   * snaps properties if set
   *
   * @method _stopTransform
   * @memberof display.base.BaseScaleClip
   * @instance
   * @private
   **/
  var _stopTransform = function(){
    if (this.lock) return;

    // no change in scaling
    if (Math.abs(this.velocity.delta.scale) === 0 && ! (this.snap || this.snap.scale === 0)
    ) {
      // NOTE: can cause problems if something was dragged outside elastic bounds and touched directly afterwards
      // CHECK if Problems appear!
      _dispatchComplete.call(this);
    } else {
      var options = {};
      options.bezier = {};
      options.bezier.curviness = 0;
      options.bezier.values = [];

      // calculate throwing properties based on velocity and fractions
      var valuePair1 = {};
      valuePair1.scaleX = this.scaleX + this.velocity.delta.scale * this.fraction.release.scale * this.fraction.base * this.velocity.scale;

      // snaps properties if defined
      if (this.snap.scale && this.snap.scale !== 0) {
        valuePair1.scaleX = (Math.round(valuePair1.scaleX / this.snap.scale) * this.snap.scale);
      }

      valuePair1.scaleY = valuePair1.scaleX;

      // hold borders while taking elasticity into account
      this._hold('scale', valuePair1, true);

      options.bezier.values.push(valuePair1);


      // hold borders again without taking elasticity into account
      // TODO: check if saves performance to first check if elastic is set. otherwise valuePairs will be identical anyways
      var valuePair2 = {};
      valuePair2.scaleX = valuePair1.scaleX;
      valuePair2.scaleY = valuePair1.scaleY;
      this._hold('scale', valuePair2, false);


      var speedFraction = 1;
      var distance = 0;

      // if did not throw beyond borders
      // i.e. if the first and second value pairs for throwing out and back are identical
      if (valuePair2.scaleX === valuePair1.scaleX) {
        distance = Math.abs(this.scaleX - valuePair2.scaleX);
      } else {
        options.bezier.values.push(valuePair2);
        distance = Math.abs(this.scaleX - valuePair1.scaleX) + Math.abs(valuePair1.scaleX - valuePair2.scaleX);
        speedFraction = 0.75;

        // if already out of borders: tween more slowly
        if (this.scaleX < this.borders.scale[0]) speedFraction = 1.6;
        else if (this.scaleX > this.borders.scale[1]) speedFraction = 1.6;

        // if did not move at a certain velocity: tween even more slowly
        if (this.velocity.scale === 0) {
          speedFraction = speedFraction * 1.6;
        }
      }

      var speed = distance / 6 / 0.1 / this.fraction.speed.scale * speedFraction;
      speed = Math.min(speed, this.fraction.speed.max.scale);

      options.ease = Cubic.easeOut;
      options.onComplete = _dispatchComplete;
      options.onCompleteScope = this;
      options.onUpdate = _dispatchTweenUpdate;
      options.onUpdateScope = this;
      options.overwrite = 'auto';

      this._scaleTween = this._stopTween(this._scaleTween);

      if (speed === 0) {
        this.scaleX = valuePair2.scaleX;
        this.scaleY = valuePair2.scaleY;
        _dispatchComplete.call(this);
      } else {
        this._scaleTween = TweenLite.to(this, speed, options);
      }
    }
  };

  return BaseScaleClip;
});
