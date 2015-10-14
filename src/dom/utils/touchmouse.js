/*
 * touchmouse.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define(['../../config'], function(config){

  /**
   * handles mouse and touch events
   * dispatches tap and doubletap events
   * dispatches idle and active events
   * unifies mouse and touch events to touchmouse events
   * checks if click and tap events really are click events by tracking moved positions and time between last click
   *
   * @example
   * document.getElementById('slider').addEventListener('touchmousedown', down);
   * document.getElementById('slider').addEventListener('tap', tap);
   * document.getElementById('slider').addEventListener('doubletap', doubletap);
   * window.addEventListener('idle', idle);
   * window.addEventListener('active', active);
   *
   * @namespace touchmouse
   * @memberof dom.utils
   **/
  var touchmouse = {
    activeTouches: 0
  };

  // event constants that should be dispatched
  var EVENTS = {
    DOWN: 'touchmousedown',
    UP: 'touchmouseup',
    MOVE: 'touchmousemove',
    TAP: 'tap',
    DOUBLE_TAP: 'doubletap',
    IDLE: 'idle',
    ACTIVE: 'active'
  };

  // tracked touches via pointer id
  var trackedTouches = [];

  // tracked positions (for pointer events only first finger gets tracked)
  var trackedPositions = {start: {}, end: {}, hadMultiple: false};

  // stored idle timeout id for dispatching idle event, gets resetted on every action
  var idleTimeout = null;

  // stores if was idle before when reactivating
  var wasIdle = false;

  // if tracking both events prevent them by default
  var tracksBoth = config.trackTouch && config.trackMouse;

  // keep track of mouse down and up events
  var isMouseDown = false;

  // if touch just fired a touchend event
  var preventMouseEvents = false;

  // reset touch end timeout
  var resetTouchEndTimeout = null;

  /**
   * creates a custom event and returns it
   *
   * @method touchmouse.createEvent
   * @memberof dom.utils.touchmouse
   * @instance
   * @public
   * @param {String} type of event that should be created
   * @param {Event} originalEvent (if available) to store for later usage
   * @param {Number} x position of event
   * @param {Number} y position of event
   * @param {Number} pointerID that was used (multiple fingers)
   * @returns {Event} the created event
   **/
  touchmouse.createEvent = function(type, originalEvent, x, y, pointerID) {
    var event = new Event(type, {
      bubbles: true,
      cancelable: true
    });

    event.originalEvent = originalEvent;
    event.pageX = x;
    event.pageY = y;
    event.pointerID = pointerID;

    return event;
  };

  /**
   * checks event type, tracks positions, converts to touchmouse event, etc.
   *
   * @method onMouseEvent
   * @memberof dom.utils.touchmouse
   * @instance
   * @private
   * @param {Event} event dispatched from mouse listener
   **/
  var onMouseEvent = function(event) {
    if (preventMouseEvents) return;

    var type, evt;

    switch (event.type) {
      case 'mousedown': type = EVENTS.DOWN; touchmouse.activeTouches = 1; break;
      case 'mouseup':   type = EVENTS.UP;   touchmouse.activeTouches = 0; break;
      case 'mousemove': type = EVENTS.MOVE; break;
      default:
        return;
    }

    // create appropriate touchmouse event based on original event
    evt = touchmouse.createEvent(type, event, event.pageX, event.pageY, -1);

    var target = event.target;

    if (isMouseDown) {
      target = isMouseDown;
    }

    if (type === EVENTS.DOWN && ! isMouseDown) {
      isMouseDown = event.target;
    } else if (type === EVENTS.UP) {
      isMouseDown = false;
    }

    // dispatch touchmouse event on target
    target.dispatchEvent(evt);

    if (type === EVENTS.DOWN) {
      // store start mouse position
      trackedPositions.start = {x: evt.pageX, y: evt.pageY};
    } else if (type === EVENTS.UP) {
      // store end mouse position
      trackedPositions.end = {x: evt.pageX, y: evt.pageY};

      // check if it was a tap
      checkTap(event.target, event, evt.pageX, evt.pageY, -1);
    }

    // reset idle status
    _resetIdle();
  };

  /**
   * checks event type, tracks positions, converts to touchmouse event, etc.
   *
   * @method onTouchEvent
   * @memberof dom.utils.touchmouse
   * @instance
   * @private
   * @param {Event} event dispatched from mouse listener
   **/
  var onTouchEvent = function(event) {
    var type, i, _len, target, touch, touches, k, evt;

    switch (event.type) {
      case 'touchstart':  type = EVENTS.DOWN; break;
      case 'touchend':    type = EVENTS.UP;   break;
      case 'touchcancel': type = EVENTS.UP;   break;
      case 'touchmove':   type = EVENTS.MOVE; break;
      default:
        return;
    }

    // store changed touches
    touches = event.changedTouches;

    // loop through all events and create and dispatch event for each changed pointer id
    // NOTE: this is not so performant but easier to use in subclasses
    for (i = 0, _len = touches.length; i < _len; i++) {
      // store current touch
      touch = touches[i];

      // create appropriate event
      evt = touchmouse.createEvent(type, event, touch.pageX, touch.pageY, touch.identifier);

      // if already has a tracked target for current pointerID
      // NOTE: maybe always used document.elementFromPoint as touch could move over multiple objects?
      if (trackedTouches[touch.identifier]) {
        // get cached, tracked target
        target = trackedTouches[touch.identifier].target;
      } else {
        // find target through document.elementFromPoint and cache target
        target = document.elementFromPoint(touch.pageX, touch.pageY);
        trackedTouches[touch.identifier] = {target: target};
      }

      // dispatch event on target
      target.dispatchEvent(evt);
    }

    // delete unused tracked touches
    if (type === EVENTS.UP) {
      var activeTouchIdentifiers = [];
      var eventFiringIdentifiers = [];

      // store currently active touch ids
      for (i = 0, _len = event.touches.length; i < _len; i++) {
        activeTouchIdentifiers.push(event.touches[i].identifier);
      }

      // store touch id's that fired ended event (i.e. fingers that left the screen)
      for (i = 0, _len = event.changedTouches.length; i < _len; i++) {
        eventFiringIdentifiers.push(event.changedTouches[i].identifier);
      }

      // check all tracked touches
      for (k in trackedTouches) {
        k = parseFloat(k);

        // if the checked finger is not active anymore
        if (activeTouchIdentifiers.indexOf(k) === -1) {
          // if that finger will not fire a touchend
          // (i.e. if it actually isn't actively on the screen anymore, but is still be tracked)
          if (eventFiringIdentifiers.indexOf(k) === -1) {
            // fake touchend event on that element
            evt = touchmouse.createEvent(type, event, touch.pageX, touch.pageY, k);
            if (trackedTouches[k].target) {
              trackedTouches[k].target.dispatchEvent(evt);
            }
          }

          // remove it from tracking list
          delete trackedTouches[k];
        }
      }
    }

    // if finger count changed (via touchstart or touchend)
    if (type === EVENTS.DOWN || type === EVENTS.UP) {
      // calculate active touches
      touchmouse.activeTouches = 0;

      for (k in trackedTouches) {
        if (trackedTouches[k].target) {
          touchmouse.activeTouches++;
        }
      }
    }

    if (tracksBoth) {
      // prevent calling mouse events that fire right after touch events (i.e. fallback click)
      preventMouseEvents = true;
    }

    if (type === EVENTS.DOWN) {
      // store if had multiple fingers throughout transformations before ending a touch (i.e. before tapping)
      trackedPositions.hadMultiple = touchmouse.activeTouches > 1;

      // if it was the first finger
      if (touchmouse.activeTouches === 1) {
        // store start mouse position
        trackedPositions.start = {x: touches[0].pageX, y: touches[0].pageY};
      }
    } else if (type === EVENTS.UP) {
      // store end mouse position
      trackedPositions.end = {x: touches[0].pageX, y: touches[0].pageY};

      // check if it was a tap on last found target
      checkTap(target, event, touches[0].pageX, touches[0].pageY, touches[0].identifier);

      // re-track mouse events when no active touch is detected anymore
      if (tracksBoth) {
        if (resetTouchEndTimeout) clearTimeout(resetTouchEndTimeout);
        resetTouchEndTimeout = setTimeout(_resetTouchEnd, 17);
      }
    }

    // reset idle status
    _resetIdle();
  };

  // resets touch end to its default state
  var _resetTouchEnd = function(){
    preventMouseEvents = false;
    resetTouchEndTimeout = null;
  };

  /**
   * dispatches active event on window
   *
   * @method dispatchActive
   * @memberof dom.utils.touchmouse
   * @instance
   * @private
   **/
  var dispatchActive = function(){
    wasIdle = false;

    var event = new Event(EVENTS.ACTIVE, {
      bubbles: true,
      cancelable: true
    });

    window.dispatchEvent(event);
  };

  /**
   * dispatches idle event on window
   *
   * @method dispatchIdle
   * @memberof dom.utils.touchmouse
   * @instance
   * @private
   **/
  var dispatchIdle = function(){
    // check if was not idle before (prevent internal logic bug)
    if (wasIdle) return;
    wasIdle = true;

    var event = new Event(EVENTS.IDLE, {
      bubbles: true,
      cancelable: true
    });

    window.dispatchEvent(event);
  };

  /**
   * checks if event was a valid tap
   * i.e. if not moved too far and did not have multiple fingers
   * also checks for double taps
   *
   * @method checkTap
   * @memberof dom.utils.touchmouse
   * @instance
   * @private
   * @param {DomElement} target that was tapped and stores multiple tap counts
   **/
  var checkTap = function(target, originalEvent, x, y, pointerID){
    // allow a maximum of 20 pixels to let a click event be dispatched
    // and only one finger while pressing an object
    if (! (trackedPositions.hadMultiple ||
      Math.abs(trackedPositions.end.x - trackedPositions.start.x) > 20 ||
      Math.abs(trackedPositions.end.y - trackedPositions.start.y) > 20)
    ) {
      var evt = null;
      var wasDoubleTap = false;

      var now = Date.now();

      // if tapped again within 350 ms
      if (now - target._lastTapTime < 350) {
        // and is an even tap count
        if ((target._taps + 1) % 2 === 0) {
          // create double tap event
          wasDoubleTap = true;
        }
      } else {
        // otherwise reset taps
        target._taps = 0;
      }

      // store last tap time on dom element
      target._lastTapTime = now;

      // increment tap count on dom element
      target._taps++;

      // if it was a valid tap: dispatch event, pass tap count to event
      evt = touchmouse.createEvent(EVENTS.TAP, originalEvent, x, y, pointerID);
      evt.taps = target._taps;
      target.dispatchEvent(evt);

      // if also was a double tap
      if (wasDoubleTap) {
        // dispatch a double tap event on target, pass tap count to event
        evt = touchmouse.createEvent(EVENTS.DOUBLE_TAP, originalEvent, x, y, pointerID);
        evt.taps = target._taps;
        target.dispatchEvent(evt);
      }
    }
  };

  /**
   * checks moved distance and if had multiple fingers
   * prevents event if distance was too long
   *
   * @method onClickEvent
   * @memberof dom.utils.touchmouse
   * @instance
   * @private
   * @param {Event} event dispatched from click listener
   **/
  var onClickEvent = function(event){
    // allow a maximum of 20 pixels to let a click event be dispatched
    // and only one finger while pressing an object
    if (trackedPositions.hadMultiple ||
      Math.abs(trackedPositions.end.x - trackedPositions.start.x) > 20 ||
      Math.abs(trackedPositions.end.y - trackedPositions.start.y) > 20
    ) {
      event.stopPropagation();
    }
  };

  /**
   * resets idle state and dispatches active on window if was idle before
   *
   * @method _resetIdle
   * @memberof dom.utils.touchmouse
   * @instance
   * @private
   **/
  var _resetIdle = function(){
    // if was idle before: dispatch active event
    if (wasIdle) dispatchActive();

    // reset idle timeout (idle every 15 seconds)
    if (idleTimeout) clearTimeout(idleTimeout);
    idleTimeout = setTimeout(dispatchIdle, 15000);
  };

  // check if supports touch events
  if (config.isTouch || config.trackTouch) {
    // if it does: listen to appropriate touch events in whole window
    window.addEventListener('touchstart', onTouchEvent);
    window.addEventListener('touchmove', onTouchEvent);
    window.addEventListener('touchend', onTouchEvent);
    window.addEventListener('touchcancel', onTouchEvent);
  }

  if (! config.isTouch || config.trackMouse) {
    // otherwise check mouse events and convert them
    window.addEventListener('mousedown', onMouseEvent);
    window.addEventListener('mouseup', onMouseEvent);
    window.addEventListener('mousemove', onMouseEvent);
  }

  // TODO: is buggy, maybe leave mouse events as they are and only check for tap events as they are used internally and not by libraries?
  // check for click events (if moved while trying to click: do not dispatch click)
  //document.addEventListener('click', onClickEvent, true);

  _resetIdle();

  return touchmouse;

});
