/*
 * Component.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
/** @namespace components **/
define([
  '../sys',
  './Container',
  '../utils/dispatch'
], function(
  sys,
  Container,
  dispatch
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

    this._unlockResize = this.__bind(_unlockResize);

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
    this.removeEventListener('addedToStage', this.__bind(_init));
    this.addEventListener('removedFromStage', this.__bind(_dispose));
    this.addEventListener('resize', this.__bind(_windowResized));

    this.dispatchEvent('init');

    this.init();
    this.init = null;
    _resize.call(this);

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
    if (this.__componentDidDispose) return;
    this.__componentDidDispose = true;

    this.removeEventListener('resize', this.__bind(_windowResized));
    this.removeEventListener('removedFromStage', this.__bind(_dispose));

    this.dispatchEvent('dispose');

    this.dispose();
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
    this._componentWidth = this.el.offsetWidth;
    this._componentHeight = this.el.offsetHeight;

    // resize component
    this.resize();

    // dispatch resize event
    //this.bubbleDispatch('resize', true, false);

    // render component
    this.render();
  };

  var _windowResized = function(event){
    event.stopped = true;

    if (! this.__lockedResize) {
      this.__lockedResize = true;
      this.__unlockResize = setTimeout(this._unlockResize, 85);
    }
  };

  var _unlockResize = function(){
    this.__lockedResize = false;
    _resize.call(this);
  };



  var _forceResetTimeout = null;
  var _forceResizeTimeout = null;
  var _forceResize = false;

  var _forceReset = function(){
    if (_forceResetTimeout) clearTimeout(_forceResetTimeout);
    _forceResetTimeout = null;
    _forceResize = false;
  };

  var _doForceResize = function(){
    if (_forceResizeTimeout) clearTimeout(_forceResizeTimeout);
    _forceResizeTimeout = null;

    _forceResize = true;
    //dispatch(window, 'resize');
  };

  Component.forceResize = function(){
    return;
    if (_forceResetTimeout) clearTimeout(_forceResetTimeout);
    _forceResetTimeout = setTimeout(_forceReset, 150);

    if (_forceResizeTimeout) clearTimeout(_forceResizeTimeout);
    _forceResizeTimeout = setTimeout(_doForceResize, 17);
  };

  return Component;
});
