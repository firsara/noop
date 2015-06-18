/*
 * Module.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
/** @namespace modules **/
define([
  '../sys',
  'EaselJS',
  './Component',
  '../data/Loader'
], function(
  sys,
  createjs,
  Component,
  Loader
) {
  var Parent = createjs.EventDispatcher;

  // Event constants

  var PRELOADED = 'preloaded';
  var SHOWED = 'showed';
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
    _this.data = null;

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
        _this.container = new ContainerClass(options);
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
      _this.show();
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
      //_this.destroy();
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

      // hides component for a short duration before really showing element
      _this.container.el.style.visibility = 'hidden';

      // add a little timeout so components can resize and align properly
      setTimeout(_doShow, 50);
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
        try {
          _this.data.reset();
        } catch(e){}

        _this.data.removeAll();
        _this.data.destroy();
      }
    };

    /**
     * calls show on child class
     * or simply dispatches showed event by default
     * if show is not overriden in child class
     *
     * @method _doShow
     * @memberof dom.Module
     * @instance
     * @private
     **/
    var _doShow = function(){
      // re-shows component
      _this.container.el.style.visibility = '';
      _childFunctions.show();
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
      _this.container.addEventListener('removedToStage', _dispose);

      if (_this.preload.length > 0) {
        _this.data = new Loader();
        _this.data.addEventListener('cached', _progress);
        _this.data.addEventListener('progress', _progress);
        _this.data.addEventListener('fileload', _fileLoad);
        _this.data.addEventListener('complete', _complete);
        _this.data.load(_this.preload);
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
      _this.container.removeEventListener('removedToStage', _dispose);
      _this.dispose();
    };

    if (! _childFunctions.hide) _childFunctions.hide = _this.hidden;
    if (! _childFunctions.show) _childFunctions.show = _this.showed;

    Init();
  });
});
