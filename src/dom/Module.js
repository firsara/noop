/*
 * Module.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
/** @namespace modules **/
define([
  '../sys',
  '../config',
  'EaselJS',
  './Component',
  '../data/Loader'
], function(
  sys,
  config,
  createjs,
  Component,
  Loader
) {
  var Parent = createjs.EventDispatcher;

  // Event constants

  var PRELOADED = 'preloaded';
  var INIT = 'init';
  var SHOW = 'show';
  var SHOWED = 'showed';
  var HIDE = 'hide';
  var HIDDEN = 'hidden';

  return sys.Class({
    __extends: Parent
  },
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
   * * _this.init: binds events and initializes module construction
   * * _this.dispose: unbinds and destroys module
   * * _this.progress: called when a single file got preloaded (optional)
   * * _this.hide: hides module by animating elements out (optional)
   * * _this.show: shows module by animating elements in (optional)
   *
   * @class Module
   * @extends createjs.EventDispatcher
   * @memberof dom
   * @param {Class} ContainerClass class reference of a container or component that the module uses
   * @param {object} options to override in component
   **/
  function Module(ContainerClass, options){
    var _this = this;

    /**
     * container holder. keeps needed component class.<br>
     * gets set automatically by using passed ContainerClass from constructor
     * @memberof dom.Module
     * @instance
     * @var {object} container
     */
    _this.container = _this.container || null;

    /**
     * preload element manifest. Has to be an array of objects containing id and src [{id: 'mydata', src: 'http:/file.png'}]
     * @see data.Loader
     * @memberof dom.Module
     * @instance
     * @var {object} preload
     */
    _this.preload = [];

    /**
     * data.Loader instance
     * @see data.Loader
     * @memberof dom.Module
     * @instance
     * @var {object} data
     */
    _this.data = new Loader();

    /**
     * wheter module should autoshow after being preloaded
     * @see data.Loader
     * @memberof dom.Module
     * @instance
     * @var {Boolean} autoShow
     */
    _this.autoShow = true;

    /**
     * wheter module should autoload data
     * @see data.Loader
     * @memberof dom.Module
     * @instance
     * @var {Boolean} autoLoad
     */
    _this.autoLoad = true;

    /**
     * if Module was preloaded
     * @memberof dom.Module
     * @instance
     * @private
     * @var {Boolean} _preloaded
     */
    var _preloaded = false;

    // empty function that get used if child class has no functions
    var _noop = function(){};

    // set default show and hide behaviour to simply dispatch appropriate events
    // and call callbacks for use in template class
    // NOTE: if overriding hide or show module MUST call _this.hidden() and _this.show() at some point
    // otherwise template rendering functionality will be broken
    var _childFunctions = {};
    _childFunctions.init = _this.init || _noop;
    _childFunctions.dispose = _this.dispose || _noop;
    _childFunctions.progress = _this.progress || _noop;
    _childFunctions.hide = _this.hide;
    _childFunctions.show = _this.show;

    var Init = function(){
      Parent.call(_this);

      if (ContainerClass) {
        if (typeof ContainerClass === 'string') {
          _this.container = new Component(ContainerClass, null, options);
        } else {
          _this.container = new ContainerClass(options);
        }
      } else {
        _this.container = new Component('<div class="module"></div>', null, options);
      }

      _this.container.controller = _this;
      _this.container.addEventListener('addedToStage', _init);
    };

    /**
     * initializes module.
     * gets called from Module.js automatically.
     * override in child class to initialize module
     *
     * @method init
     * @memberof dom.Module
     * @instance
     * @public
     **/
    _this.init = function(){
      _childFunctions.init();
      _this.dispatchEvent(INIT);
      if (_this.autoShow) _this.show();
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
    _this.hidden = function(){
      _this.destroy();
      _this.dispatchEvent(HIDDEN);
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
    _this.showed = function(){
      _this.dispatchEvent(SHOWED);
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
    _this.hide = function(){
      // disallow multiple hide calls by setting hide to noop when first called
      _this.hide = _noop;
      _childFunctions.hide();
      _this.dispatchEvent(HIDE);
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
    _this.show = function(){
      // disallow multiple show calls by setting show to noop when first called
      _this.show = _noop;

      _childFunctions.show();
      _this.dispatchEvent(SHOW);
    };

    /**
     * cleans up some data
     *
     * @method destroy
     * @memberof dom.Module
     * @instance
     * @protected
     **/
    _this.destroy = function(){
      if (_this.data) {
        if (config.environment !== 'browser') {
          try {
            _this.data.reset();
          } catch(e){}

          _this.data.removeAll();
          _this.data.destroy();
        } else {
          _this.data.cancel();
        }

        _this.data = null;
      }
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
      if (_this.data) {
        _this.data.removeEventListener('cached', _progress);
        _this.data.removeEventListener('progress', _progress);
        _this.data.removeEventListener('fileload', _fileLoad);
        _this.data.removeEventListener('complete', _complete);
      }

      _preloaded = true;

      _this.dispatchEvent(PRELOADED);
      _this.init();
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
      var tmp = new createjs.Event(event.type);
      tmp.progress = event.progress;
      _this.dispatchEvent(tmp);
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
      _this.dispatchEvent(event);
      _childFunctions.progress(event.result);
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
      _this.container.removeEventListener('addedToStage', _init);
      _this.container.addEventListener('removedFromStage', _dispose);

      _this.data.addEventListener('cached', _progress);
      _this.data.addEventListener('progress', _progress);
      _this.data.addEventListener('fileload', _fileLoad);
      _this.data.addEventListener('complete', _complete);

      if (_this.preload.length > 0) {
        if (_this.autoLoad) _this.data.load(_this.preload);
      } else {
        _complete();
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
      _this.container.removeEventListener('removedFromStage', _dispose);
      if (_this.dispose && _preloaded) _this.dispose();
    };

    if (! _childFunctions.hide) _childFunctions.hide = _this.hidden;
    if (! _childFunctions.show) _childFunctions.show = _this.showed;

    Init();
  });
});
