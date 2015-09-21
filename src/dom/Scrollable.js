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

    this.borders.x = [0, 0];
    this.borders.y = [0, 0];

    this.fraction.release.x = 0.75;
    this.fraction.release.y = 0.75;

    this.__scrollOldSize = {width: 0, height: 0};
    this.__scrollOldParentSize = {width: 0, height: 0};
    this.__setScrollbarTimeout = null;
    this.__unsetScrollbarTimeout = null;

    this.on('addedToStage', _render, this);
    this.on('removedFromStage', _dispose, this);

    _addChildEvents.call(this, this);
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

        var scrollbarMarginTop = parseFloat(this.parent.vScrollbar.$el.css('margin-top').replace('px', ''));
        if (isNaN(scrollbarMarginTop)) scrollbarMarginTop = 0;

        var scrollbarMarginBottom = parseFloat(this.parent.vScrollbar.$el.css('margin-bottom').replace('px', ''));
        if (isNaN(scrollbarMarginBottom)) scrollbarMarginBottom = 0;

        this.parent.vScrollbar.el.style.height = scrollbarHeight + 'px';
        this.parent.vScrollbar.offset = parentSize.height - scrollbarHeight - scrollbarMarginTop - scrollbarMarginBottom;
      }

      if (this.parent.hScrollbar) {
        var scrollbarWidthOffset = scrollSize.width / parentSize.width;
        scrollbarWidthOffset = Math.sqrt(scrollbarWidthOffset);

        var scrollbarWidth = Math.max(75, Math.min(parentSize.width * (1 / scrollbarWidthOffset)));

        var scrollbarMarginLeft = parseFloat(this.parent.hScrollbar.$el.css('margin-left').replace('px', ''));
        if (isNaN(scrollbarMarginLeft)) scrollbarMarginLeft = 0;

        var scrollbarMarginRight = parseFloat(this.parent.hScrollbar.$el.css('margin-right').replace('px', ''));
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
      }

      this.__scrollOldSize = scrollSize;
      this.__scrollOldParentSize = parentSize;

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
  p.resize = function(){
    if (this.__setScrollbarTimeout) clearTimeout(this.__setScrollbarTimeout);
    this.__setScrollbarTimeout = setTimeout(this.__bind(this.setScrollBounds), 100);
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
    this.addEventListener('move', this.__bind(_positionScrollbar));
    $(window).bind('resize', this.__bind(this.resize));

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
    this.el.removeEventListener('mousewheel', this.__bind(_scroll));
    this.removeEventListener('move', this.__bind(_positionScrollbar));
    $(window).unbind('resize', this.__bind(this.resize));

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

      this.parent.vScrollbar.el.style.top = (percentage * this.parent.vScrollbar.offset) + 'px';
      this.parent.vScrollbar.$el.addClass('active');
    }

    if (this.parent.hScrollbar && this.borders.x[0] !== this.borders.x[1]) {
      percentage = this.x / this.borders.x[0];

      this.parent.hScrollbar.el.style.left = (percentage * this.parent.hScrollbar.offset) + 'px';
      this.parent.hScrollbar.$el.addClass('active');
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
    if (this.parent.vScrollbar) this.parent.vScrollbar.$el.removeClass('active');
    if (this.parent.hScrollbar) this.parent.hScrollbar.$el.removeClass('active');
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
    options.onUpdate = _scrollUpdate;
    options.onUpdateScope = this;
    options.x = Math.max(this.borders.x[0], Math.min(this.borders.x[1], this.x - event.deltaX));
    options.y = Math.max(this.borders.y[0], Math.min(this.borders.y[1], this.y - event.deltaY));
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
