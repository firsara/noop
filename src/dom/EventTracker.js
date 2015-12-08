/*
 * EventTracker.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define(['../sys', '../utils/fps', './Container', './utils/touchmouse'], function(sys, fps, Container) {
  /**
   * tracks appropriate events and calls child functions accordingly
   * calls child functions based on needed parent class
   *
   * @class EventTracker
   * @extends dom.Container
   * @memberof dom
   * @param {Handlebars} template should be a compiled handlebars template. alternatively can be a plain string or jquery object
   * @param {object} data the data to pass through the template, optional
   * @param {object} options optional options to overwrite container properties before inheriting
   **/
  function EventTracker(template, data, options){
    Container.call(this, template, data, options);

    this._eventTracker = {};
    this._eventTracker.mousedown = this.__bind(_mousedown);
    this._eventTracker.pressmove = this.__bind(_pressmove);
    this._eventTracker.pressup = this.__bind(_pressup);
    this._eventTracker.enterFrame = this.__bind(_enterFrame);

    this.on('addedToStage', _render, this);
    this.on('removedFromStage', _dispose, this);
  }

  var p = sys.extend(EventTracker, Container);

  /**
   * initializes events on EventTracker object
   *
   * @method _render
   * @memberof dom.EventTracker
   * @instance
   * @private
   **/
  var _render = function(){
    this.el.addEventListener('touchmousedown', this._eventTracker.mousedown);
  };

  /**
   * unbinds events on EventTracker object
   *
   * @method _dispose
   * @memberof dom.EventTracker
   * @instance
   * @private
   **/
  var _dispose = function(){
    this.el.removeEventListener('touchmousedown', this._eventTracker.mousedown);

    this.stage.el.removeEventListener('touchmousemove', this._eventTracker.pressmove);
    this.stage.el.removeEventListener('touchmouseup', this._eventTracker.pressup);
    fps.removeEventListener('tick', this._eventTracker.enterFrame);
  };

  /**
   * binds move and up event and passes event on to base Transformable
   *
   * @method _mousedown
   * @memberof dom.EventTracker
   * @instance
   * @private
   **/
  var _mousedown = function(event){
    if (event._preventMove) {
      if (event._preventMove === true) return;
      if (event._preventMove !== this) return;
    }

    this.stage.el.removeEventListener('touchmousemove', this._eventTracker.pressmove);
    this.stage.el.removeEventListener('touchmouseup', this._eventTracker.pressup);
    fps.removeEventListener('tick', this._eventTracker.enterFrame);

    // add events to keep track of finger positions
    this.stage.el.addEventListener('touchmousemove', this._eventTracker.pressmove);
    this.stage.el.addEventListener('touchmouseup', this._eventTracker.pressup);
    fps.addEventListener('tick', this._eventTracker.enterFrame);

    this._onMousedown(event);
  };

  /**
   * passes move event on to base transformable
   *
   * @method _pressmove
   * @memberof dom.EventTracker
   * @instance
   * @private
   **/
  var _pressmove = function(event){
    event.originalEvent.preventDefault();
    this._onPressmove(event);
  };

  /**
   * passes tick event on to base transformable
   *
   * @method _enterFrame
   * @memberof dom.EventTracker
   * @instance
   * @private
   **/
  var _enterFrame = function(event){
    this._onEnterFrame(event);
  };

  /**
   * passes up event on to base transformable
   * unbinds events if no more active finger is detected
   *
   * @method _pressup
   * @memberof dom.EventTracker
   * @instance
   * @private
   **/
  var _pressup = function(event){
    this._onPressup(event);

    if (this._activeFingers === 0) {
      this.stage.el.removeEventListener('touchmousemove', this._eventTracker.pressmove);
      this.stage.el.removeEventListener('touchmouseup', this._eventTracker.pressup);
      fps.removeEventListener('tick', this._eventTracker.enterFrame);
    }
  };

  return EventTracker;
});
