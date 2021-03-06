/*
 * Moveable.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define(['../config'], function(config) {

  // Event constants

  // move gets dispatched every frame a movement occured
  var MOVE = 'move';

  // moveComplete gets dispatched once the element completely stopped moving (i.e. after throwing / flying)
  var MOVE_COMPLETE = 'moveComplete';

  // swipe gets dispatched once a swipe was detected. see recognizer for settings
  var SWIPE = 'swipe';

  // hold gets dispatched once a finger was detected and did not move for a longer period
  var HOLD = 'hold';

  // properties used for simplifying swipe checks
  var SWIPE_PROPERTIES = {
    horizontal: {axis: 'x', size: 'width', prev: 'left', next: 'right'},
    vertical: {axis: 'y', size: 'height', prev: 'up', next: 'down'},
    directions: {left: -1, right: 1, up: -1, down: 1}
  };

  /**
   * used for move calculations, swipe detections etc.<br>
   * **NOTE**: only calculation wrapper. gets extended in<br>
   * @see dom.Moveable
   * @see easeljs.Moveable
   *
   * @example
   * var mover = new Moveable('<img src="image.jpg">');
   * mover.borders.x = [-10, 10];
   * mover.scrolls('y');
   * mover.free.x = true; // overwrites borders
   *
   * dispatches events:<br>
   * move, moveComplete, swipe
   *
   * @mixin BaseMoveable
   * @memberof display.base
   **/
  function BaseMoveable(){
    /**
     * layer active moveclip to the top of the index list
     * @memberof display.base.BaseMoveable
     * @instance
     * @var {Boolean} level
     */
    this.level = false;

    /**
     * strength of current item's transforms
     * @memberof display.base.BaseMoveable
     * @instance
     * @var {Boolean} level
     */
    this.strength = 1;

    // borders: element can not be moved beyond set borders
    // i.e. borders.x = [-10, 10]  means that the element can only be moved between x = -10 and x = 10
    this.borders.x = [];
    this.borders.y = [];

    // elastic: lets element be moved beyond borders (value between 0 and 1 recommended)
    // i.e. elastic.x = 0.5  means that the element could be moved by 0.5 the movement after reaching borders
    // mainly used for scrollable containers (see iOS scroll behaviour)
    this.elastic.x = 0;
    this.elastic.y = 0;

    // fraction.move: lets elements move calculations be multiplied by a defined fraction
    // i.e. fraction.move.x = 2  means that the element would move twice as fast than normally when dragging
    this.fraction.move.x = 1;
    this.fraction.move.y = 1;

    // fraction.release: lets elements throw calculation be multiplied by a defined fraction
    // i.e. fraction.release.x = 10  means that the element would fly a long distance as if it was on ice when stopped dragging
    this.fraction.release.x = 1;
    this.fraction.release.y = 1;

    // fraction.speed.move: lets element throwing be faster than it would be (not recommended changing a lot)
    // i.e. fraction.speed.move = 2  means that the element would travel twice as fast when stopped dragging
    this.fraction.speed.move = 1;

    // fraction.speed.max.move: defines a maximum duration for element throwing
    // i.e. fraction.speed.max.move = 1  means that the element would travel a maximum of 1 second no matter how far
    this.fraction.speed.max.move = 2;

    // fraction.velocity.max: defines a maximum velocity that the element calculates
    // i.e. fraction.velocity.max.x = 0.1  means that even if the element was dragged extremely fast it behaves as if it was not
    this.fraction.velocity.max.x = Number.MAX_VALUE;
    this.fraction.velocity.max.y = Number.MAX_VALUE;


    // NOTE: recognizers should not be modified too much, they should work pretty well as defined
    // use helper functions instead (like this.scrolls('y'))

    // move recognizers, used for dispatching move events
    this.recognizer.move = {};

    // recognizer.move: minimum distance needed until a move event gets dispatched
    // useful in scrolling elements to lock to a specific direction only after a few pixels of movement were detected
    // i.e. recognizer.move.x = 100  means that the element would visually not move until a minimum of 100 pixels in movement were reached
    this.recognizer.move.x = 0;
    this.recognizer.move.y = 0;


    // swipe recognizers, used for dispatching swipe events
    this.recognizer.swipe = {};

    // recognizer.swipe.velocity: defines the minimum move-velocity needed until a swipe is dispatched
    // i.e. recognizer.swipe.velocity = 10  means that the element needs to be moved pretty fast to dispatch a swipe event
    this.recognizer.swipe.velocity = 1;

    // recognizer.swipe.width: defines a minimum distance that needs to be moved in order to swipe
    // useful for sliders where passing half the container width means a swipe regardless of velocity
    // i.e. recognizer.swipe.width = 200  means that if the element was dragged by 200 pixels it will dispatch a swipe no matter what
    this.recognizer.swipe.width = Number.MAX_VALUE;
    this.recognizer.swipe.height = Number.MAX_VALUE;


    // hold recognizers, used for dispatching hold events
    this.recognizer.hold = {};

    // recognizer.hold.max.move: defines the maximum movement that can occur while holding down a finger
    // i.e. recognizer.hold.max.move = 10  means that the element can be moved at a maximum of 10px until hold won't be dispatched anymore
    this.recognizer.hold.max = {move: 10};

    // recognizer.hold.time: defines how long a finger needs to be pressed down in seconds until a hold gets dispatched
    // i.e. recognizer.hold.time = 10  means that the finger needs to be pressed down for 10 seconds until a hold gets dispatched
    this.recognizer.hold.time = null;

    /**
     * tween to throw properties when finished moving
     * @memberof display.base.BaseMoveable
     * @instance
     * @private
     * @var {TweenLite} _moveTween
     */
    this._moveTween = null;

    /**
     * hold timeout id when trying to detect a hold
     * @memberof display.base.BaseMoveable
     * @instance
     * @private
     * @var {Number} _holdTimeout
     */
    this._holdTimeout = null;

    this.__dispatchHold = _dispatchHold.bind(this);

    // listen to all the events dispatched by parent class Transformable
    this.on('start', _startTransform);
    this.on('calc', _calc);
    this.on('update', _update);
    this.on('complete', _stopTransform);
  }

  var p = BaseMoveable.prototype;

  /**
   * defines the scrolling direction used for elements that are intended to scroll in a specific direction
   * automatically stops events on parent containers and sets up all the needed settings
   *
   * @method scrolls
   * @memberof display.base.BaseMoveable
   * @instance
   * @param {String} direction defines the scroll direction. allowed values:<br>
   * "x" or "horizontal"<br>
   * "y" or "vertical"<br>
   * "none" or "empty"
   **/
  p.scrolls = function(direction){
    if (direction === 'x' || direction === 'horizontal') {
      this.recognizer.move.x = 10;
      this.recognizer.move.y = 0;
      this.stops.tracking.x = null;
      this.stops.tracking.y = 10;
      this.stops.propagation.x = 10;
      this.stops.propagation.y = 10;
    } else if (direction === 'y' || direction === 'vertical') {
      this.recognizer.move.x = 0;
      this.recognizer.move.y = 10;
      this.stops.tracking.x = 10;
      this.stops.tracking.y = null;
      this.stops.propagation.x = 10;
      this.stops.propagation.y = 10;
    } else {
      this.recognizer.move.y = 0;
      this.recognizer.move.x = 0;
      this.stops.propagation.x = 0;
      this.stops.propagation.y = 0;
      this.stops.tracking.x = null;
      this.stops.tracking.y = null;
    }
  };

  /**
   * dispatches move event
   *
   * @method _dispatchTweenUpdate
   * @memberof display.base.BaseMoveable
   * @static
   * @private
   **/
  var _dispatchTweenUpdate = function(){
    if (this.lock) {
      this._moveTween = this._stopTween(this._moveTween);
    }

    this.dispatchEvent(MOVE);
  };

  /**
   * dispatches moveComplete event
   *
   * @method _dispatchComplete
   * @memberof display.base.BaseMoveable
   * @static
   * @private
   **/
  var _dispatchComplete = function(){
    this.dispatchEvent(MOVE_COMPLETE);
  };

  /**
   * dispatches hold event<br>
   * checks first if it was a valid hold movement
   *
   * @method _dispatchHold
   * @memberof display.base.BaseMoveable
   * @static
   * @private
   **/
  var _dispatchHold = function(){
    if (this._hadMultipleFingers) return;

    if (! (Math.abs(this._track.current.x) > this.recognizer.hold.max.move || Math.abs(this._track.current.y) > this.recognizer.hold.max.move)) {
      var event = {type: HOLD};

      for (var pointerID in this._fingers) {
        if (this._fingers[pointerID].start) {
          event.pageX = this._fingers[pointerID].start.x;
          event.pageY = this._fingers[pointerID].start.y;
          break;
        }
      }

      this.dispatchEvent(event);
    }
  };

  /**
   * stops previous tween
   * sets leveling if needed
   *
   * @method _startTransform
   * @memberof display.base.BaseMoveable
   * @static
   * @private
   **/
  var _startTransform = function(event){
    if (this._activeFingers === 1 && this.recognizer.hold.time) {
      if (this._holdTimeout) clearTimeout(this._holdTimeout);
      this._holdTimeout = setTimeout(this.__dispatchHold, this.recognizer.hold.time * 1000);
    }

    this._stopTween(this._moveTween);
    if (this.level && this.parent) this.parent.setChildIndex(this, this.parent.getNumChildren() - 1);
  };

  /**
   * calculates distance between two points
   *
   * @method _getDistance
   * @memberof display.base.BaseMoveable
   * @instance
   * @private
   **/
  var _getDistance = function(p1, p2) {
    var x = p2.x - p1.x;
    var y = p2.y - p1.y;

    return Math.sqrt((x * x) + (y * y));
  };

  /**
   * calculates movements based on individual changed finger positions
   * for current frame only. Only calculates. Does not set properties on element
   *
   * @method _calc
   * @memberof display.base.BaseMoveable
   * @instance
   * @private
   **/
  var _calc = function(event){
    if (this.lock) return;

    // caluclate average movement between all points
    this._calc.x = 0;
    this._calc.y = 0;

    for (var pointerID in this._fingers) {
      if (this._fingers[pointerID].start) {
        this._calc.x += (this._fingers[pointerID].current.x - this._fingers[pointerID].old.x);
        this._calc.y += (this._fingers[pointerID].current.y - this._fingers[pointerID].old.y);

        if (this._shiftKey && ! config.isTouch) {
          if (Math.abs(this._calc.x) > Math.abs(this._calc.y)) {
            this._calc.y = this._calc.x;
          } else {
            this._calc.x = this._calc.y;
          }
        }
      }
    }

    // divide movement by fingers to get an average move of all fingers
    // i.e. when "pinching" proportionally no movement should occur
    this._calc.x /= Math.max(1, this._activeFingers);
    this._calc.y /= Math.max(1, this._activeFingers);
  };

  /**
   * Sets calculated properties on element.
   * called only every frame, not on a mousemove or touchmove event.
   * only called when finger positions changed to save performance.
   *
   * @method _update
   * @memberof display.base.BaseMoveable
   * @instance
   * @private
   **/
  var _update = function(event){
    if (this.lock) return;

    var _dispatchesUpdate = false;

    // check if tracked movements already passed move recognizer
    // add calculated values to current properties
    // hold border properties while taking elasticity and fractions into account

    if (Math.abs(this._track.current.x) >= this.recognizer.move.x) {
      this._hold('x', this, true, this._calc.x * this.fraction.move.x * this.fraction.base * ((BaseMoveable.strength * this.strength) || 1));
      this.recognizer.fired.x = true;
      _dispatchesUpdate = true;
    }

    if (Math.abs(this._track.current.y) >= this.recognizer.move.y) {
      this._hold('y', this, true, this._calc.y * this.fraction.move.y * this.fraction.base * ((BaseMoveable.strength * this.strength) || 1));
      this.recognizer.fired.y = true;
      _dispatchesUpdate = true;
    }

    if (_dispatchesUpdate) {
      this.dispatchEvent(MOVE);
    }
  };

  /**
   * Calculates throwing properties based on current velocity
   * initializes TweenLite animation if needed
   * snaps properties if set
   *
   * @method _stopTransform
   * @memberof display.base.BaseMoveable
   * @instance
   * @private
   **/
  var _stopTransform = function(event){
    if (this._holdTimeout) clearTimeout(this._holdTimeout);
    if (this._activeFingers > 0) return;
    if (this.lock) return;

    // no change in position
    if ((Math.abs(this.velocity.delta.x) === 0 &&
      Math.abs(this.velocity.delta.y) === 0 &&
      ! (this.snap || this.snap.x === 0) &&
      ! (this.snap || this.snap.y === 0)) ||
      this.fraction.speed.move === 0
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
      valuePair1.x = this.x + this.velocity.delta.x * this.fraction.release.x * this.fraction.base * this.velocity.x * ((BaseMoveable.strength * this.strength) || 1);
      valuePair1.y = this.y + this.velocity.delta.y * this.fraction.release.y * this.fraction.base * this.velocity.y * ((BaseMoveable.strength * this.strength) || 1);

      // snaps properties if defined
      if (this.snap.x && this.snap.x !== 0) {
        valuePair1.x = (Math.round(valuePair1.x / this.snap.x) * this.snap.x);
      }

      if (this.snap.y && this.snap.y !== 0) {
        valuePair1.y = (Math.round(valuePair1.y / this.snap.y) * this.snap.y);
      }

      // hold borders while taking elasticity into account
      this._hold('x', valuePair1, true);
      this._hold('y', valuePair1, true);

      options.bezier.values.push(valuePair1);


      // hold borders again without taking elasticity into account
      var valuePair2 = {};
      valuePair2.x = valuePair1.x;
      valuePair2.y = valuePair1.y;
      this._hold('x', valuePair2, false);
      this._hold('y', valuePair2, false);


      var speedFraction = 1;
      var distance = 0;

      // if did not throw beyond borders
      // i.e. if the first and second value pairs for throwing out and back are identical
      if (valuePair2.x === valuePair1.x && valuePair2.y === valuePair1.y) {
        distance = _getDistance(this, valuePair2);
      } else {
        options.bezier.values.push(valuePair2);
        distance = _getDistance(this, valuePair1) + _getDistance(valuePair1, valuePair2);
        speedFraction = 0.75;

        // if already out of borders: tween more slowly
        if (this.x < this.borders.x[0]) speedFraction = 1.6;
        else if (this.x > this.borders.x[1]) speedFraction = 1.6;

        if (this.y < this.borders.y[0]) speedFraction = 1.6;
        else if (this.y > this.borders.y[1]) speedFraction = 1.6;

        // if did not move at a certain velocity: tween even more slowly
        if (this.velocity.x === 0 && this.velocity.y === 0) {
          speedFraction = speedFraction * 1.6;
        }
      }

      var speed = distance / 5 / 100 / this.fraction.speed.move * speedFraction;
      speed = Math.min(speed, this.fraction.speed.max.move);

      options.ease = Cubic.easeOut;
      options.onComplete = _dispatchComplete;
      options.onCompleteScope = this;
      options.onUpdate = _dispatchTweenUpdate;
      options.onUpdateScope = this;
      options.overwrite = 'auto';

      this._stopTween(this._moveTween);

      if (speed === 0) {
        this.x = valuePair2.x;
        this.y = valuePair2.y;
        _dispatchComplete.call(this);
      } else {
        this._moveTween = TweenLite.to(this, speed, options);
      }

      _detectSwipes.call(this);
    }
  };


  /**
   * detects swipe events.
   * calculates distances and velocities based on x- and y movements.
   * if a swipe was detected dispatches appropriate event.
   *
   * @method _detectSwipes
   * @memberof display.base.BaseMoveable
   * @instance
   * @private
   **/
  var _detectSwipes = function(){
    if (! this.hasEventListener(SWIPE)) return;

    // do not dispatch swipe if more than one finger was used when moving an element (i.e. scaling / rotating)
    if (! this._hadMultipleFingers) {
      var event = null;
      var swipe = null;
      var orientation = null;

      // do not allow two swipe calls at once.
      // even if it would be a swipe: when one direction gets pulled farther or faster than the other one: don't dispatch!

      // NOTE: favor velocity instead of whole movement
      // i.e. even if an element was moved 1000 pixels to the left, but then pulled up fastly -> vertical swipe
      if (this.velocity.x > 0 && this.velocity.x > this.velocity.y) orientation = 'horizontal';
      else if (this.velocity.y > 0 && this.velocity.y > this.velocity.x) orientation = 'vertical';
      else {
        // if no swiping direction was found through velocity: check absolute movement values
        if (Math.abs(this._track.current.x) > Math.abs(this._track.current.y)) orientation = 'horizontal';
        else if (Math.abs(this._track.current.y) > Math.abs(this._track.current.x)) orientation = 'vertical';
      }

      // check for swipes if an orientation towards a specific direction was detected
      if (orientation === 'horizontal' || orientation === 'vertical') {
        var p = SWIPE_PROPERTIES[orientation];

        // first: check if movement passed defined swipe direction
        // moving past a defined fraction (i.e. half width of a slider)
        // means a swipe in any case, regardless of swiping velocity
        if (this._track.current[p.axis] < 0 - this.recognizer.swipe[p.size]) swipe = p.prev;
        else if (this._track.current[p.axis] > this.recognizer.swipe[p.size]) swipe = p.next;

        // second: check if move velocity was higher than the minimum definition
        // if so: overwrite existing checks or reset swiping if would actually swiped in one direction but then fastly moved in the other direction
        // i.e. someone could move beyound the minimum width for a swipe but then move back fastly -> swipe back
        if (this.velocity[p.axis] > this.recognizer.swipe.velocity && this.velocity.direction[p.axis] < 0) {
          swipe = swipe === p.next ? null : p.prev;
        } else if (this.velocity[p.axis] > this.recognizer.swipe.velocity && this.velocity.direction[p.axis] > 0) {
          swipe = swipe === p.prev ? null : p.next;
        }
      }

      // if a swipe direction was found:
      // dispatch swipe event for use in child classes
      if (swipe) {
        event = {type: SWIPE};
        event.orientation = orientation;
        event.direction = SWIPE_PROPERTIES.directions[swipe];
        event.swipe = swipe;
        event.velocity = this.velocity[SWIPE_PROPERTIES[orientation].axis];
        this.dispatchEvent(event);
      }
    }
  };

  BaseMoveable.strength = 1;

  return BaseMoveable;
});
