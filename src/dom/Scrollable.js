// TODO: IMPORTANT: memory leak test!

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
  var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') !== -1;

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
    // extend from base class
    MoveClip.call(this, template, data, options);

    Scrollable.create(this, this);
  }

  var p = sys.extend(Scrollable, MoveClip);

  Scrollable.create = function(container, checkContainer){
    container.check = checkContainer;

    container.borders.x = [0, 0];
    container.borders.y = [0, 0];
    container.snap.x = 1;
    container.snap.y = 1;

    container.fraction.release.x = 0.75;
    container.fraction.release.y = 0.75;

    container.__scrollOldSize = {width: 0, height: 0};
    container.__scrollsHorizontal = false;
    container.__scrollOldParentSize = {width: 0, height: 0};
    container.__setScrollbarTimeout = null;
    container.__unsetScrollbarTimeout = null;

    container.setScrollBounds = _setScrollBounds.bind(container);

    container.on('addedToStage', _render, container);
    container.on('removedFromStage', _dispose, container);

    _addChildEvents.call(container, container);
  };

  /**
   * sets bounds for moveclip based on scrollable parent
   *
   * @method setScrollBounds
   * @memberof dom.Scrollable
   * @instance
   * @public
   **/
  var _setScrollBounds = function(){
    if (this.check.parent) {
      if (this.check.parent.name === 'scrollMask') {
        var storedHeight = this.check.parent.parent.el.style.height;
        var storedDisplay = this.check.parent.el.style.display;
        this.check.parent.parent.el.style.height = 'auto';
        this.check.parent.el.style.display = 'none';

        var contentHeight = this.check.parent.parent.outerHeight;

        this.check.parent.parent.el.style.height = storedHeight;
        this.check.parent.el.style.display = storedDisplay;

        this.check.parent.el.style.height = (this.check.parent.parent.outerHeight - contentHeight) + 'px';
      }

      var parentSize = {width: this.check.parent.outerWidth, height: this.check.parent.outerHeight};
      var scrollSize = {width: this.check.outerWidth, height: this.check.outerHeight};

      if ((this.__scrollOldSize.width === scrollSize.width && this.__scrollOldSize.height === scrollSize.height) &&
        (this.__scrollOldParentSize.width === parentSize.width && this.__scrollOldParentSize.height === parentSize.height)) {
        return;
      }

      var offsetSize = {width: scrollSize.width - parentSize.width, height: scrollSize.height - parentSize.height};
      offsetSize.width = Math.max(0, offsetSize.width);
      offsetSize.height = Math.max(0, offsetSize.height);

      this.borders.x = [0 - offsetSize.width, 0];
      this.borders.y = [0 - offsetSize.height, 0];

      if (this.parent.vScrollbar) {
        var scrollbarHeightOffset = scrollSize.height / parentSize.height;
        scrollbarHeightOffset = Math.sqrt(scrollbarHeightOffset);

        var scrollbarHeight = Math.max(75, Math.min(parentSize.height * (1 / scrollbarHeightOffset)));

        var scrollbarMarginTop = this.parent.vScrollbar.elMargin.top;
        if (isNaN(scrollbarMarginTop)) scrollbarMarginTop = 0;

        var scrollbarMarginBottom = this.parent.vScrollbar.elMargin.bottom;
        if (isNaN(scrollbarMarginBottom)) scrollbarMarginBottom = 0;

        this.parent.vScrollbar.el.style.height = scrollbarHeight + 'px';
        this.parent.vScrollbar.offset = parentSize.height - scrollbarHeight - scrollbarMarginTop - scrollbarMarginBottom;
      }

      if (this.parent.hScrollbar) {
        var scrollbarWidthOffset = scrollSize.width / parentSize.width;
        scrollbarWidthOffset = Math.sqrt(scrollbarWidthOffset);

        var scrollbarWidth = Math.max(75, Math.min(parentSize.width * (1 / scrollbarWidthOffset)));

        var scrollbarMarginLeft = this.parent.hScrollbar.elMargin.left;
        if (isNaN(scrollbarMarginLeft)) scrollbarMarginLeft = 0;

        var scrollbarMarginRight = this.parent.hScrollbar.elMargin.right;
        if (isNaN(scrollbarMarginRight)) scrollbarMarginRight = 0;

        this.parent.hScrollbar.el.style.width = scrollbarWidth + 'px';
        this.parent.hScrollbar.offset = parentSize.width - scrollbarWidth - scrollbarMarginLeft - scrollbarMarginRight;
      }

      this.elastic.x = offsetSize.width > 0 ? 0.1 : 0;
      this.elastic.y = offsetSize.height > 0 ? 0.1 : 0;

      if (offsetSize.width <= 0 && offsetSize.height <= 0) {
        this.lock = true;
      } else {
        this.lock = false;
        if (this.parent.hScrollbar) this.parent.hScrollbar.el.classList.remove('locked');
        if (this.parent.vScrollbar) this.parent.vScrollbar.el.classList.remove('locked');
      }

      if (this.parent.hScrollbar) {
        if (offsetSize.width <= 0) this.parent.hScrollbar.el.classList.add('locked');
        else this.parent.hScrollbar.el.classList.remove('locked');
      }

      if (this.parent.vScrollbar) {
        if (offsetSize.height <= 0) this.parent.vScrollbar.el.classList.add('locked');
        else this.parent.vScrollbar.el.classList.remove('locked');
      }

      this.__scrollOldSize = scrollSize;
      this.__scrollOldParentSize = parentSize;
      this.__scrollsHorizontal = offsetSize.height === 0 && offsetSize.width !== 0;

      _hold.call(this);
    }
  };

  /**
   * reset bounds after resizing window or adding / removing children
   *
   * @method resize
   * @memberof dom.Scrollable
   * @instance
   * @public
   **/
  var _resize = function(){
    if (this.__setScrollbarTimeout) clearTimeout(this.__setScrollbarTimeout);
    this.__setScrollbarTimeout = setTimeout(this.__bind(this.setScrollBounds), 100);
  };

  // create public functions resize + setScrollBounds
  p.resize = _resize;
  p.setScrollBounds = _setScrollBounds;

  /**
   * initializes events on Scrollable object
   *
   * @method _render
   * @memberof dom.Scrollable
   * @instance
   * @private
   **/
  var _render = function(){
    if (isFirefox) {
      this.el.addEventListener('wheel', this.__bind(_wheel));
    } else {
      this.el.addEventListener('mousewheel', this.__bind(_scroll));
    }

    this.addEventListener('move', this.__bind(_positionScrollbar));
    window.addEventListener('resize', this.__bind(_resize));

    this.setScrollBounds();
    this.resize();
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
    if (isFirefox) {
      this.el.removeEventListener('wheel', this.__bind(_wheel));
    } else {
      this.el.removeEventListener('mousewheel', this.__bind(_scroll));
    }

    this.removeEventListener('move', this.__bind(_positionScrollbar));
    window.removeEventListener('resize', this.__bind(_resize));

    if (this.__unsetScrollbarTimeout) clearTimeout(this.__unsetScrollbarTimeout);
    if (this.__setScrollbarTimeout) clearTimeout(this.__setScrollbarTimeout);
  };

  /**
   * move position scrollbar
   *
   * @method _positionScrollbar
   * @memberof dom.Scrollable
   * @instance
   * @private
   **/
  var _positionScrollbar = function(){
    var percentage = null;

    if (this.parent.vScrollbar && this.borders.y[0] !== this.borders.y[1]) {
      percentage = this.y / this.borders.y[0];

      var top = (percentage * this.parent.vScrollbar.offset);
      if (this.parent.vScrollbar.parent === this) top -= this.y;
      this.parent.vScrollbar.el.style.top = top + 'px';
      this.parent.vScrollbar.el.classList.add('active');
    }

    if (this.parent.hScrollbar && this.borders.x[0] !== this.borders.x[1]) {
      percentage = this.x / this.borders.x[0];

      var left = (percentage * this.parent.hScrollbar.offset);
      if (this.parent.hScrollbar.parent === this) left -= this.x;
      this.parent.hScrollbar.el.style.left = left + 'px';
      this.parent.hScrollbar.el.classList.add('active');
    }

    if (this.parent.vScrollbar || this.parent.hScrollbar) {
      if (this.__unsetScrollbarTimeout) clearTimeout(this.__unsetScrollbarTimeout);
      this.__unsetScrollbarTimeout = setTimeout(this.__bind(_unsetScrollbar), 300);
    }
  };

  /**
   * unsets scrollbar visibility status
   *
   * @method _unsetScrollbar
   * @memberof dom.Scrollable
   * @instance
   * @private
   **/
  var _unsetScrollbar = function(){
    if (this.parent.vScrollbar) this.parent.vScrollbar.el.classList.remove('active');
    if (this.parent.hScrollbar) this.parent.hScrollbar.el.classList.remove('active');
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
    if (this.lock) return;
    event.stopPropagation();
    _doScroll.call(this, {x: event.deltaX, y: event.deltaY});
  };

  /**
   * scrolling handling in firefox
   *
   * @method _wheel
   * @memberof dom.Scrollable
   * @instance
   * @private
   **/
  var _wheel = function(event){
    if (this.lock) return;
    event.stopPropagation();
    _doScroll.call(this, {x: event.deltaX * 40, y: event.deltaY * 40});
  };

  /**
   * calculates scroll position
   *
   * @method _doScroll
   * @memberof dom.Scrollable
   * @instance
   * @private
   **/
  var _doScroll = function(wheel){
    if (this.__scrollsHorizontal) {
      if (! wheel.x || Math.abs(wheel.x) === 0) {
        wheel.x = wheel.y;
        wheel.y = 0;
      }
    }

    var options = {};
    options.onUpdate = _scrollUpdate;
    options.onUpdateScope = this;
    options.x = Math.max(this.borders.x[0], Math.min(this.borders.x[1], this.x - wheel.x));
    options.y = Math.max(this.borders.y[0], Math.min(this.borders.y[1], this.y - wheel.y));

    if (this.snap.x && this.snap.x !== 0) {
      options.x = (Math.round(options.x / this.snap.x) * this.snap.x);
    }

    if (this.snap.y && this.snap.y !== 0) {
      options.y = (Math.round(options.y / this.snap.y) * this.snap.y);
    }

    options.ease = Quint.easeOut;

    TweenLite.to(this, 0.6, options);
  };

  /**
   * update scrollbar and dispatch move event
   *
   * @method _scrollUpdate
   * @memberof dom.Scrollable
   * @instance
   * @private
   **/
  var _scrollUpdate = function(event){
    this.dispatchEvent('move');
    _positionScrollbar.call(this);
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

  var _removeChildEvents = function(child){
    child.removeEventListener('addedChild', this.__bind(_addedChild));
    child.removeEventListener('removedChild', this.__bind(_removedChild));
    child.removeEventListener('removedFromStage', this.__bind(_disposeChild));
  };

  var _addChildEvents = function(child){
    _removeChildEvents.call(this, child);

    child.addEventListener('addedChild', this.__bind(_addedChild));
    child.addEventListener('removedChild', this.__bind(_removedChild));
    child.addEventListener('removedFromStage', this.__bind(_disposeChild));

    for (var i = 0, _len = child.children.length; i < _len; i++) {
      _addChildEvents.call(this, child.children[i]);
    }
  };

  var _addedChild = function(event){
    _addChildEvents.call(this, event.child);
    this.resize();
  };

  var _removedChild = function(){
    this.resize();
  };

  var _disposeChild = function(event){
    _removeChildEvents.call(this, event.target);
  };

  return Scrollable;
});
