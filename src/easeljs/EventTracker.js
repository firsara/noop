/*
 * EventTracker.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define(['../sys', 'EaselJS'], function(sys, createjs) {

  var Parent = createjs.Container;

  return sys.Class({
    __extends: Parent
  },
  /**
   * tracks appropriate events and calls child functions accordingly
   * calls child functions based on needed parent class
   *
   * @class EventTracker
   * @extends createjs.Container
   * @memberof easeljs
   **/
  function EventTracker(){
    // reference to instance
    var _this = this;

    var Init = function(){
      // call super constructor
      if (Parent) Parent.call(_this);

      _this.on('added', _render, _this);
      _this.on('removed', _dispose, _this);
    };

    /**
     * initializes events on EventTracker object
     *
     * @method _render
     * @memberof easeljs.EventTracker
     * @instance
     * @private
     **/
    var _render = function(){
      _this.addEventListener('mousedown', _mousedown);
    };

    /**
     * unbinds events on EventTracker object
     *
     * @method _dispose
     * @memberof easeljs.EventTracker
     * @instance
     * @private
     **/
    var _dispose = function(){
      _this.removeEventListener('mousedown', _mousedown);
    };

    /**
     * binds move and up event and passes event on to base Transformable
     *
     * @method _mousedown
     * @memberof easeljs.EventTracker
     * @instance
     * @private
     **/
    var _mousedown = function(event){
      event.pageX = event.stageX;
      event.pageY = event.stageY;

      _this.removeEventListener('pressmove', _pressmove);
      _this.removeEventListener('pressup', _pressup);
      _this.removeEventListener('tick', _enterFrame);

      // add events to keep track of finger positions
      _this.addEventListener('pressmove', _pressmove);
      _this.addEventListener('pressup', _pressup);
      _this.addEventListener('tick', _enterFrame);

      _this._onMousedown(event);
    };

    /**
     * passes move event on to base transformable
     *
     * @method _pressmove
     * @memberof easeljs.EventTracker
     * @instance
     * @private
     **/
    var _pressmove = function(event){
      event.pageX = event.stageX;
      event.pageY = event.stageY;

      _this._onPressmove(event);
    };

    /**
     * passes tick event on to base transformable
     *
     * @method _enterFrame
     * @memberof easeljs.EventTracker
     * @instance
     * @private
     **/
    var _enterFrame = function(event){
      _this._onEnterFrame(event);
    };

    /**
     * passes up event on to base transformable
     * unbinds events if no more active finger is detected
     *
     * @method _pressup
     * @memberof easeljs.EventTracker
     * @instance
     * @private
     **/
    var _pressup = function(event){
      event.pageX = event.stageX;
      event.pageY = event.stageY;

      _this._onPressup(event);

      if (_this._activeFingers === 0) {
        _this.removeEventListener('pressmove', _pressmove);
        _this.removeEventListener('pressup', _pressup);
        _this.removeEventListener('tick', _enterFrame);
      }
    };

    // initialize instance
    Init();
  });
});
