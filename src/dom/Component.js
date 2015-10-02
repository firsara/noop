/*
 * Component.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
/** @namespace components **/
define([
  '../sys',
  './Container'
], function(
  sys,
  Container
) {
  /**
   * A component is a set of layout elements with a render and interaction logic baked in<br>
   * automatically calls init, render, dispose and resize in child class
   *
   * acts as a view. when called from modules automatically gets controller property that points to module
   *
   * public functions that need to be overridden by child classes:
   *
   * * this.init: binds events
   * * this.show: shows component
   * * this.dispose: unbinds events and destroy possible elements
   * * this.render: renders data
   * * this.resize: called when window was resized
   *
   * @class Component
   * @extends dom.Container
   * @memberof dom
   * @param {Handlebars} template should be a compiled handlebars template. alternatively can be a plain string or jquery object
   * @param {object} data the data to pass through the template, optional
   * @param {object} options optional options to overwrite container properties before inheriting
   **/
  function Component(template, data, options){
    /**
     * stored component width
     * @memberof dom.Component
     * @instance
     * @var {object} _componentWidth
     */
    this._componentWidth = 0;

    /**
     * stored component height
     * @memberof dom.Component
     * @instance
     * @var {object} _componentHeight
     */
    this._componentHeight = 0;

    this.__component = {};

    // store timeouts
    this.__component._doRenderTimeout = null;
    this.__component._doResizeTimeout = null;

    // store first render and resize calls
    this.__component._didRender = false;
    this.__component._didResize = false;
    this.__component._didDispose = false;

    // stored, old component size
    this.__component._oldComponentWidth = null;
    this.__component._oldComponentHeight = null;

    // stored, old window size
    this.__component._oldWindowWidth = 0;
    this.__component._oldWindowHeight = 0;

    // call super constructor if not already done by some other mixin function
    if (! this._initializedContainer) Container.call(this, template, data, options);

    // initialize when added to stage
    this.addEventListener('addedToStage', this.__bind(_init));
  }

  var p = sys.extend(Component, Container);

  /**
   * binds events in child class
   * @method init
   * @memberof dom.Component
   * @public
   * @instance
   **/
  p.init = function(){};

  /**
   * shows component
   * @method show
   * @memberof dom.Component
   * @public
   * @instance
   **/
  p.show = function(){};

  /**
   * unbinds events in child class
   *
   * @method dispose
   * @memberof dom.Component
   * @public
   * @instance
   **/
  p.dispose = function(){};

  /**
   * renders child component
   * @method render
   * @memberof dom.Component
   * @public
   * @instance
   **/
  p.render = function(){};

  /**
   * resizes child component
   * @method resize
   * @memberof dom.Component
   * @public
   * @instance
   **/
  p.resize = function(){};

  /**
   * binds events in child class
   *
   * @method _init
   * @memberof dom.Component
   * @protected
   * @instance
   **/
  var _init = function(){
    this.__component._didDispose = false;
    this.removeEventListener('addedToStage', this.__bind(_init));

    this.addEventListener('removedFromStage', this.__bind(_dispose));

    // NOTE: $(window).trigger('resize') does not fire addEventListener
    //window.addEventListener('resize', this.__bind(_windowResized));
    $(window).bind('resize', this.__bind(_windowResized));

    this.dispatchEvent('init');

    this.init();
    _windowResized.call(this);

    this.dispatchEvent('show');

    this.show();
  };

  /**
   * unbinds events in child class
   *
   * @method _dispose
   * @memberof dom.Component
   * @protected
   * @instance
   **/
  var _dispose = function(){
    if (this.__component._didDispose) return;
    this.__component._didDispose = true;

    if (this.__component._doRenderTimeout) clearTimeout(this.__component._doRenderTimeout);
    if (this.__component._doResizeTimeout) clearTimeout(this.__component._doResizeTimeout);

    //window.removeEventListener('resize', this.__bind(_windowResized));
    $(window).unbind('resize', this.__bind(_windowResized));
    this.removeEventListener('removedFromStage', this.__bind(_dispose));

    this.dispatchEvent('dispose');

    this.dispose();
  };

  /**
   * renders child component
   *
   * @method _render
   * @memberof dom.Component
   * @protected
   * @instance
   **/
  var _render = function(){
    // catch possible multiple calls of render
    // allow first render to happen immediately
    if (this.__component._doRenderTimeout || this.__component._didRender) {
      clearTimeout(this.__component._doRenderTimeout);
      this.__component._doRenderTimeout = setTimeout(this.__bind(_doRender), 17);
    } else {
      _doRender.call(this);
      this.__component._didRender = true;
    }
  };

  /**
   * resizes child component
   *
   * @method _resize
   * @memberof dom.Component
   * @protected
   * @instance
   **/
  var _resize = function(){
    // catch possible multiple calls of _resize
    // allow first resizing to happen immediately
    if (this.__component._doResizeTimeout || this.__component._didResize) {
      clearTimeout(this.__component._doResizeTimeout);
      this.__component._doResizeTimeout = setTimeout(this.__bind(_doResize), 17);
    } else {
      _doResize.call(this);
      this.__component._didResize = true;
    }
  };

  /**
   * executes rendering
   *
   * @method _doRender
   * @memberof dom.Component
   * @private
   * @instance
   **/
  var _doRender = function(){
    // unset timeout
    this.__component._doRenderTimeout = null;
    this.__component._didRender = false;

    this.dispatchEvent('render');

    // resize component
    this.render();
  };

  /**
   * executes resizing
   *
   * @method _doResize
   * @memberof dom.Component
   * @private
   * @instance
   **/
  var _doResize = function(){
    // unset timeout
    this.__component._doResizeTimeout = null;
    this.__component._didResize = false;

    // resize component
    this.resize();

    // dispatch resize event
    this.dispatchEvent('resize');

    // render component
    _render.call(this);
  };

  /**
   * checks window size and if it changed when resizing window
   * splitting this function and the resize function up means that we can call them individually
   * and explicitly in child components to resize a component no matter what
   *
   * this allows to call .resize anytime (for example when children or anything else changed in component that needs to be resized),
   * after adding a small timeout delay so resize won't be called a million times in a row
   *
   * @method _windowResized
   * @memberof dom.Component
   * @private
   * @instance
   **/
  var _windowResized = function(){
    var windowWidth = $(window).width();
    var windowHeight = $(window).height();

    var elWidth = this.$el.width();
    var elHeight = this.$el.height();

    if (this.$el.is(':realVisible') || this.__component._oldComponentWidth === null) {
      // store component sizes
      this._componentWidth = elWidth;
      this._componentHeight = elHeight;

      // if window or component size changed -> call child resize function
      if (! (
        this._componentWidth === this.__component._oldComponentWidth &&
        this._componentHeight === this.__component._oldComponentHeight &&
        windowWidth === this.__component._oldWindowWidth &&
        windowHeight === this.__component._oldWindowHeight
      ) || _forceResize) {
        this.__component._oldComponentWidth = this._componentWidth;
        this.__component._oldComponentHeight = this._componentHeight;

        this.__component._oldWindowWidth = windowWidth;
        this.__component._oldWindowHeight = windowHeight;

        _resize.call(this);
      }
    }
  };



  var _forceResetTimeout = null;
  var _forceResize = false;

  var _forceReset = function(){
    if (_forceResetTimeout) clearTimeout(_forceResetTimeout);
    _forceResetTimeout = null;
    _forceResize = false;
  };

  Component.forceResize = function(){
    _forceResize = true;
    $(window).trigger('resize');

    if (_forceResetTimeout) clearTimeout(_forceResetTimeout);
    _forceResetTimeout = setTimeout(_forceReset, 2000);
  };

  return Component;
});
