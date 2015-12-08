/*
 * Component.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
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
     * @var {object} domWidth
     */
    this.domWidth = 0;

    /**
     * stored component height
     * @memberof dom.Component
     * @instance
     * @var {object} domHeight
     */
    this.domHeight = 0;

    this._oldDomWidth = -1;
    this._oldDomHeight = -1;
    this._oldDomEvent = null;

    // call super constructor if not already done by some other mixin function
    if (! this._initializedContainer) Container.call(this, template, data, options);

    // initialize when added to stage
    this.on('addedToStage', _init, this);
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
    this.off('addedToStage', _init, this);
    this.on('removedFromStage', _dispose, this);
    this.on('resize', _windowResized, this);

    this.dispatchEvent('init');

    this.init();
    this.init = null;
    _resize.call(this, false);

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

    this.off('resize', _windowResized, this);
    this.off('removedFromStage', _dispose, this);

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
  var _resize = function(bubble){
    if (! this.isVisible()) return;

    this.domWidth = this.el.offsetWidth;
    this.domHeight = this.el.offsetHeight;

    if (! (this._oldDomEvent && this._oldDomEvent.force)) {
      if (this.domWidth === this._oldDomWidth && this.domHeight === this._oldDomHeight) {
        return;
      }
    }

    this._oldDomWidth = this.domWidth;
    this._oldDomHeight = this.domHeight;
    this._oldDomEvent = null;

    // resize component
    this.resize();

    // dispatch resize event
    if (bubble) {
      this.bubbleDispatch(this._oldDomEvent || 'resize', true, false);
    }

    // render component
    this.render();
  };

  var _windowResized = function(event){
    this._oldDomEvent = event;

    if (event.force) {
      _resize.call(this, false);
      return;
    }

    event.stopped = true;

    this.choke(_bubbleResize, 85);
  };

  var _bubbleResize = function(){
    _resize.call(this, true);
  };

  return Component;
});
