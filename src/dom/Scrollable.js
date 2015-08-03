/*
 * Scrollable.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define([
  '../sys',
  './MoveClip',
  'EaselJS'
],
function(
  sys,
  MoveClip,
  createjs
) {
  /**
   * Scrollable Container that Auto-sets borders based on parent container
   *
   * @class Scrollable
   * @memberof dom
   * @extends dom.MoveClip
   *
   * @param {Handlebars} template should be a compiled handlebars template. alternatively can be a plain string or jquery object
   * @param {object} data the data to pass through the template, optional
   * @param {object} options optional options to overwrite container properties before inheriting
   **/
  function Scrollable(template, data, options){
    this.autoPaint = true;
    this.autoUpdate = true;

    // extend from base class
    MoveClip.call(this, template, data, options);

    // TODO: implement .scrolls() from moveclip (both sides)
    // TODO: check .scrolls() in both directions -> to prevent parents events
    // TODO: check scrollwheel direction? (maybe scroll horizontal even if scrolled down?)
    this.borders.x = [0, 0];
    this.borders.y = [0, 0];

    this.__scollTicks = 0;
    this.__scrollTicksInterval = Math.round(createjs.Ticker.getMeasuredFPS() / 2);
    this.autoSetScrollBounds = true;

    this.on('addedToStage', _render, this);
    this.on('removedFromStage', _dispose, this);
  }

  var p = sys.extend(Scrollable, MoveClip);

  /**
   * sets bounds for moveclip based on scrollable parent
   *
   * @method _render
   * @memberof dom.Scrollable
   * @instance
   * @public
   **/
  p.setScrollBounds = function(){
    if (this.parent) {
      var parentSize = {width: this.parent.$el.outerWidth(), height: this.parent.$el.outerHeight()};
      var scrollSize = {width: this.$el.outerWidth(), height: this.$el.outerHeight()};
      var offsetSize = {width: scrollSize.width - parentSize.width, height: scrollSize.height - parentSize.height};
      offsetSize.width = Math.max(0, offsetSize.width);
      offsetSize.height = Math.max(0, offsetSize.height);

      this.borders.x = [0 - offsetSize.width, 0];
      this.borders.y = [0 - offsetSize.height, 0];

      this.elastic.x = offsetSize.width > 0 ? 0.1 : 0;
      this.elastic.y = offsetSize.height > 0 ? 0.1 : 0;
    }
  };

  /**
   * initializes events on Scrollable object
   *
   * @method _render
   * @memberof dom.Scrollable
   * @instance
   * @private
   **/
  var _render = function(){
    this.el.addEventListener('mousewheel', this.__bind(_scroll));

    if (this.autoSetScrollBounds) {
      this.addEventListener('tick', this.__bind(_update));
    }
  };

  /**
   * unbinds events on Scrollable object
   *
   * @method _dispose
   * @memberof dom.Scrollable
   * @instance
   * @private
   **/
  var _dispose = function(){
    this.el.removeEventListener('mousewheel', this.__bind(_scroll));
    this.removeEventListener('tick', this.__bind(_update));
  };

  /**
   * update scroll bounds every 10 ticks
   *
   * @method _update
   * @memberof dom.Scrollable
   * @instance
   * @private
   **/
  var _update = function(){
    if (this.autoSetScrollBounds) {
      this.__scollTicks++;

      if (this.__scollTicks % this.__scrollTicksInterval === 0) {
        this.setScrollBounds();
        this.__scollTicks = 0;
        this.__scrollTicksInterval = Math.round(createjs.Ticker.getMeasuredFPS() / 2);
      }
    } else {
      this.removeEventListener('tick', this.__bind(_update));
    }
  };

  /**
   * fake moving moveclip on
   *
   * @method _scroll
   * @memberof dom.Scrollable
   * @instance
   * @private
   **/
  var _scroll = function(event){
    var options = {};
    options.x = Math.max(this.borders.x[0], Math.min(this.borders.x[1], this.x - event.deltaX));
    options.y = Math.max(this.borders.y[0], Math.min(this.borders.y[1], this.y - event.deltaY));
    options.ease = Quint.easeOut;

    TweenLite.to(this, 0.6, options);
  };

  /**
   * holds MoveClip bounds while animating via scrolling
   *
   * @method _hold
   * @memberof dom.Scrollable
   * @instance
   * @private
   **/
  var _hold = function(){
    this._hold('x');
    this._hold('y');
  };

  return Scrollable;
});
