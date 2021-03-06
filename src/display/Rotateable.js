/*
 * Rotateable.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define(function(sys) {

  // Event constants

  // rotate gets dispatched every frame a rotation occured
  var ROTATE = 'rotate';

  // rotateComplete gets dispatched once the element completely stopped rotating (i.e. after throwing / flying)
  var ROTATE_COMPLETE = 'rotateComplete';

  /**
   * used for rotation calculations<br>
   * **NOTE**: only calculation wrapper. gets extended in:
   * @see dom.Rotateable
   * @see easeljs.Rotateable
   *
   * @example
   * var rotater = new Rotateable('<img src="image.jpg">');
   * rotater.borders.rotation = [-10, 10];
   * rotater.free.rotation = true; // overwrites borders
   *
   * @mixin BaseRotateable
   * @memberof display.base
   **/
  function BaseRotateable(){

    // borders: element can not be rotated beyond set borders
    // i.e. borders.rotation = [-10, 10]  means that the element can only be rotated between -10 and 10
    this.borders.rotation = [];

    // elastic: lets element be rotated beyond borders (value between 0 and 1 recommended)
    // i.e. elastic.rotation = 0.5  means that the element could be rotated by 0.5 the rotation after reaching borders
    this.elastic.rotation = 0;

    // fraction.move.rotation: lets elements rotation calculations be multiplied by a defined fraction
    // i.e. fraction.move.rotation = 2  means that the element would rotate twice as fast than normally when rotating
    this.fraction.move.rotation = 1;

    // fraction.release: lets elements throw calculation be multiplied by a defined fraction
    // i.e. fraction.release.rotation = 10  means that the element would fly a long rotation distance as if it was on ice when stopped rotating
    this.fraction.release.rotation = 1.75;

    // fraction.speed.rotation: lets element throwing be faster than it would be (not recommended changing a lot)
    // i.e. fraction.speed.rotation = 2  means that the element would travel twice as fast when stopped rotating
    this.fraction.speed.rotation = 1;

    // fraction.speed.max.rotation: defines a maximum duration for element throwing
    // i.e. fraction.speed.max.rotation = 1  means that the element would travel a maximum of 1 second no matter how far
    this.fraction.speed.max.rotation = 1.3;

    // fraction.velocity.max: defines a maximum velocity that the element calculates
    // i.e. fraction.velocity.max.rotation = 0.1  means that even if the element was rotated extremely fast it behaves as if it was not
    this.fraction.velocity.max.rotation = Number.MAX_VALUE;


    // NOTE: recognizers should not be modified too much, they should work pretty well as defined

    // rotation recognizers, used for dispatching rotation events
    this.recognizer.rotation = 0;

    /**
     * tween to throw properties when finished moving
     * @memberof display.base.BaseRotateable
     * @instance
     * @private
     * @var {TweenLite} _rotateTween
     */
    this._rotateTween = null;

    // TODO: implement turn reconigzer (turn by 180deg)

    // listen to all the events dispatched by parent class Transformable
    this.on('start', _startTransform);
    this.on('calc', _calc);
    this.on('update', _update);
    this.on('complete', _stopTransform);
  }

  var p = BaseRotateable.prototype;

  /**
   * dispatches rotate event
   *
   * @method _dispatchTweenUpdate
   * @memberof display.base.BaseRotateable
   * @instance
   * @private
   **/
  var _dispatchTweenUpdate = function(){
    if (this.lock) {
      this._rotateTween = this._stopTween(this._rotateTween);
    }

    this.dispatchEvent(ROTATE);
  };

  /**
   * dispatches rotateComplete event
   *
   * @method _dispatchComplete
   * @private
   **/
  var _dispatchComplete = function(){
    this.dispatchEvent(ROTATE_COMPLETE);
  };

  /**
   * stops previous tween if detected more than one finger
   *
   * @method _startTransform
   * @memberof display.base.BaseRotateable
   * @instance
   * @private
   **/
  var _startTransform = function(event){
    if (this._activeFingers > 1) {
      this._rotateTween = this._stopTween(this._rotateTween);
    }
  };

  /**
   * calculates rotation based on individual changed finger positions
   * for current frame only. Only calculates. Does not set properties on element
   *
   * @method _calc
   * @memberof display.base.BaseRotateable
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

      var point1, point2, startAngle, currentAngle;

      // calculate initial angle
      point1 = points[0].old;
      point2 = points[1].old;
      startAngle = Math.atan2((point1.y - point2.y), (point1.x - point2.x)) * (180 / Math.PI);

      // calculate new angle
      point1 = points[0].current;
      point2 = points[1].current;
      currentAngle = Math.atan2((point1.y - point2.y), (point1.x - point2.x)) * (180 / Math.PI);

      // set rotation based on difference between the two angles
      this._calc.rotation = currentAngle - startAngle;
    }
  };

  /**
   * Sets calculated properties on element.
   * called only every frame, not on a mousemove or touchmove event.
   * only called when finger positions changed to save performance.
   *
   * @method _update
   * @memberof display.base.BaseRotateable
   * @instance
   * @private
   **/
  var _update = function(event){
    if (this.lock) return;

    if (this._activeFingers > 1) {

      // check if tracked rotations already passed rotation recognizer
      // add calculated values to current properties
      // hold border properties while taking elasticity and fractions into account

      if (Math.abs(this._track.current.rotation) >= this.recognizer.rotation) {
        this._hold('rotation', this, true, this._calc.rotation * this.fraction.move.rotation * this.fraction.base);
        this.recognizer.fired.rotation = true;
        this.dispatchEvent(ROTATE);
      }
    }
  };

  /**
   * Calculates throwing properties based on current velocity
   * initializes TweenLite animation if needed
   * snaps properties if set
   *
   * @method _stopTransform
   * @memberof display.base.BaseRotateable
   * @instance
   * @private
   **/
  var _stopTransform = function(){
    if (this.lock) return;

    // no change in rotation
    if ((Math.abs(this.velocity.delta.rotation) === 0 && ! (this.snap || this.snap.rotation === 0)) || this.fraction.speed.rotation === 0
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
      valuePair1.rotation = this.rotation + this.velocity.delta.rotation * this.fraction.release.rotation * this.fraction.base * this.velocity.rotation;

      // snaps properties if defined
      if (this.snap.rotation && this.snap.rotation !== 0) {
        valuePair1.rotation = (Math.round(valuePair1.rotation / this.snap.rotation) * this.snap.rotation);
      }

      // hold borders while taking elasticity into account
      this._hold('rotation', valuePair1, true);

      options.bezier.values.push(valuePair1);


      // hold borders again without taking elasticity into account
      var valuePair2 = {};
      valuePair2.rotation = valuePair1.rotation;
      this._hold('rotation', valuePair2, false);


      var speedFraction = 1;
      var distance = 0;

      // if did not throw beyond borders
      // i.e. if the first and second value pairs for throwing out and back are identical
      if (valuePair2.rotation === valuePair1.rotation) {
        distance = Math.abs(this.rotation - valuePair2.rotation);
      } else {
        options.bezier.values.push(valuePair2);
        distance = Math.abs(this.rotation - valuePair1.rotation) + Math.abs(valuePair1.rotation - valuePair2.rotation);
        speedFraction = 0.75;

        // if already out of borders: tween more slowly
        if (this.rotation < this.borders.rotation[0]) speedFraction = 1.6;
        else if (this.rotation > this.borders.rotation[1]) speedFraction = 1.6;

        // if did not move at a certain velocity: tween even more slowly
        if (this.velocity.rotation === 0) {
          speedFraction = speedFraction * 1.6;
        }
      }

      var speed = distance / 6 / 10 / this.fraction.speed.move * speedFraction;
      speed = Math.min(speed, this.fraction.speed.max.move);

      options.ease = Cubic.easeOut;
      options.onComplete = _dispatchComplete;
      options.onCompleteScope = this;
      options.onUpdate = _dispatchTweenUpdate;
      options.onUpdateScope = this;
      options.overwrite = 'auto';

      this._rotateTween = this._stopTween(this._rotateTween);

      if (speed === 0) {
        this.rotation = valuePair2.rotation;
        _dispatchComplete.call(this);
      } else {
        this._rotateTween = TweenLite.to(this, speed, options);
      }
    }
  };

  return BaseRotateable;
});
