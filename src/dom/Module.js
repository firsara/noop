/*
 * Module.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define([
  '../sys',
  '../config',
  '../utils/EventDispatcher',
  './Component',
  '../data/Loader',
  '../utils/Context'
], function(
  sys,
  config,
  EventDispatcher,
  Component,
  Loader,
  Context
) {
  var PRELOADED = 'preloaded';
  var INIT = 'init';
  var SHOW = 'show';
  var SHOWED = 'showed';
  var HIDE = 'hide';
  var HIDDEN = 'hidden';

  // empty function that get used if child class has no functions
  var _noop = function(){};

  /**
   * A module is a set of components<br>
   * with a separate controller and view instance
   *
   * automatically calls init and dispose in child class<br>
   * .hide and .show gets called automatically by TemplateEngine
   *
   * acts as a controller. automatically sets controller property in component view
   *
   * public functions that need to be overridden by child classes:
   *
   * * this.init: binds events and initializes module construction
   * * this.dispose: unbinds and destroys module
   * * this.progress: called when a single file got preloaded (optional)
   * * this.hide: hides module by animating elements out (optional)
   * * this.show: shows module by animating elements in (optional)
   *
   * @class Module
   * @extends utils.EventDispatcher
   * @memberof dom
   * @param {Class} ContainerClass class reference of a container or component that the module uses
   * @param {object} options to override in component
   **/
  function Module(ContainerClass, options){
    /**
     * container holder. keeps needed component class.<br>
     * gets set automatically by using passed ContainerClass from constructor
     * @memberof dom.Module
     * @instance
     * @var {object} container
     */
    this.container = this.container || null;

    /**
     * preload element manifest. Has to be an array of objects containing id and src [{id: 'mydata', src: 'http:/file.png'}]
     * @see data.Loader
     * @memberof dom.Module
     * @instance
     * @var {object} preload
     */
    this.preload = [];

    /**
     * data.Loader instance
     * @see data.Loader
     * @memberof dom.Module
     * @instance
     * @var {object} loader
     */
    this.loader = new Loader();

    /**
     * wheter module should autoshow after being preloaded
     * @see data.Loader
     * @memberof dom.Module
     * @instance
     * @var {Boolean} autoShow
     */
    this.autoShow = true;

    /**
     * wheter module should autoload data
     * @see data.Loader
     * @memberof dom.Module
     * @instance
     * @var {Boolean} autoLoad
     */
    this.autoLoad = true;

    /**
     * if Module was preloaded
     * @memberof dom.Module
     * @instance
     * @private
     * @var {Boolean} this._preloaded
     */
    this._preloaded = false;

    if (! this.init) this.init = _noop;
    if (! this.show) this.show = this.showed;
    if (! this.hide) this.hide = this.hidden;
    if (! this.progress) this.progress = _noop;

    this._childShow = this.show;
    this._childHide = this.hide;
    this.show = _show.bind(this);
    this.hide = _hide.bind(this);

    if (ContainerClass) {
      if (typeof ContainerClass === 'string') {
        this.container = new Component(ContainerClass, null, options);
      } else {
        this.container = new ContainerClass(options);
      }
    } else {
      this.container = new Component('<div class="module"></div>', null, options);
    }

    this.container.controller = this;
    this.container.on('addedToStage', _init, this);

    this.loader.on('cached', _progress, this);
    this.loader.on('progress', _progress, this);
    this.loader.on('fileload', _fileLoad, this);
    this.loader.on('complete', _complete, this);
  }

  var p = sys.extend(Module, EventDispatcher);

  Context.mixin(Module);

  /**
   * cleans up some data
   *
   * @method destroy
   * @memberof dom.Module
   * @instance
   * @protected
   **/
  p.destroy = function(){
    if (this.loader) {
      try {
        this.loader.reset();
      } catch(e){}

      this.loader.removeAll();
      this.loader.destroy();
      this.loader.cancel();

      this.loader = null;
    }
  };

  /**
   * dispatches hidden event that gets used in TemplateEngine
   * if ovverriding hide() in child class: needs to call hidden() at some point
   *
   * @method hidden
   * @memberof dom.Module
   * @instance
   * @public
   **/
  p.hidden = function(){
    this.destroy();
    this.dispatchEvent(HIDDEN);
  };

  /**
   * dispatches showed event that gets used in TemplateEngine
   * if ovverriding show() in child class: needs to call showed() at some point
   *
   * @method showed
   * @memberof dom.Module
   * @instance
   * @public
   **/
  p.showed = function(){
    this.dispatchEvent(SHOWED);
  };

  /**
   * dispatches hidden by default.
   * if overridden needs to do some sort of animation
   * and then call hidden manually
   *
   * @method hide
   * @memberof dom.Module
   * @instance
   * @public
   **/
  var _hide = function(){
    // disallow multiple hide calls by setting hide to noop when first called
    this.hide = _noop;
    this._childHide();
    this.dispatchEvent(HIDE);
  };

  /**
   * dispatches showed by default.
   * if overridden needs to do some sort of animation
   * and then call showed manually
   *
   * @method show
   * @memberof dom.Module
   * @instance
   * @public
   **/
  var _show = function(){
    // disallow multiple show calls by setting show to noop when first called
    this.show = _noop;
    this._childShow();
    this.dispatchEvent(SHOW);
  };

  /**
   * dispatches preloaded event and initializes module
   *
   * @method _complete
   * @memberof dom.Module
   * @instance
   * @private
   **/
  var _complete = function(){
    if (this.loader) {
      this.loader.off('cached', _progress, this);
      this.loader.off('progress', _progress, this);
      this.loader.off('fileload', _fileLoad, this);
      this.loader.off('complete', _complete, this);

      this._preloaded = true;
    }

    this.dispatchEvent(PRELOADED);

    this.init();
    this.init = null;
    this.dispatchEvent(INIT);
    if (this.autoShow) this.show();
  };

  /**
   * dispatches progress event used in preload components
   *
   * @method _progress
   * @memberof dom.Module
   * @instance
   * @private
   **/
  var _progress = function(event){
    this.dispatchEvent({type: event.type, progress: event.progress});
    this.progress(event.result);
  };

  /**
   * dispatches filelload event used in preload components
   * also calls .progress event on child module class to display element immediately if needed
   *
   * @method _fileLoad
   * @memberof dom.Module
   * @instance
   * @private
   **/
  var _fileLoad = function(event){
    this.dispatchEvent(event);
    this.progress(event.result);
  };

  /**
   * preloads data, shows and initializes module
   *
   * @method _init
   * @memberof dom.Module
   * @instance
   * @private
   **/
  var _init = function(){
    this.container.off('addedToStage', _init, this);
    this.container.on('removedFromStage', _dispose, this);

    if (this.autoLoad) {
      if (this.preload.length === 0) {
        _complete.call(this);
      } else {
        this.loader.load(this.preload);
      }
    }
  };

  /**
   * calls dispose to unbind events on child class module
   *
   * @method _dispose
   * @memberof dom.Module
   * @instance
   * @private
   **/
  var _dispose = function(){
    this.container.off('removedFromStage', _dispose, this);
    if (this.dispose && this._preloaded) this.dispose();
  };

  return Module;
});
