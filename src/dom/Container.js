/*
 * Container.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
/** @namespace dom **/
define([
  '../sys',
  '../utils/css3',
  'EaselJS',
  '../utils/fps',
  '../utils/Context'
], function(
  sys,
  css3,
  createjs,
  fps,
  Context
) {
  // incremental container prefix id. generates a character like "A", "B", etc.
  var storedContainerPrefixID = 0;

  // incremental container id
  var storedContainerID = 0;

  // max container id before prefix id gets incremented
  var maxStoredContainerID = Number.MAX_VALUE - 1;

  // stored container item list
  var _autoUpdateContainers = {};

  // stored container item list
  var _autoPaintContainers = {};

  // store container transform status
  var _containerTransform = null;

  // stored item id for looping
  var itemId = null;

  // paint all container items that need to be auto paintd
  var _paint = function(){
    for (itemId in _autoUpdateContainers) {
      _autoUpdateContainers[itemId]._painted = false;
    }

    for (itemId in _autoPaintContainers) {
      _autoPaintContainers[itemId].paint();
    }
  };

  // listen for tick event globally and paint all needed containers
  fps.addEventListener('tick', _paint);

  /**
   * Base class of all other dom classes<br>
   * gets extended by MoveClip, Component, etc.
   *
   * handles child dom containers<br>
   * keeps transformation properties stored (i.e. x, y, rotation, etc.)<br>
   * optionally autoPaints transformations to css<br>
   *
   * automatically defines name of child component in parent as a property<br>
   * names are defined through data-name in templates
   *
   * @example
   * <div class="wrapper" data-name="wrapper">
   *   <div data-name="mover" data-class="dom/MoveClip"> <!-- mover will be a MoveClip instance -->
   *     DATA
   *   </div>
   * </div>
   *
   * @example
   * var container = new Container($('.wrapper'));
   * container.mover.el.innerHTML; // outputs -> "DATA"
   *
   * @class Container
   * @extends createjs.EventDispatcher
   * @memberof dom
   * @param {Handlebars} template should be a compiled handlebars template. alternatively can be a plain string or jquery object
   * @param {object} data the data to pass through the template, optional
   * @param {object} options optional options to overwrite container properties before inheriting
   **/
  function Container(template, data, options){
    createjs.EventDispatcher.call(this);

    // generates ids from 0 to MAX_VALUE
    // then setps up one character and generates again (A0, A1, A2, etc.)
    storedContainerID++;

    // if stored containerID surpassed max defined id
    if (storedContainerID > maxStoredContainerID - 2) {
      // reset container id and increment prefix id
      storedContainerID = 0;
      storedContainerPrefixID++;
    }

    // generate container id based on prefix id
    var containerID = storedContainerID;

    // if prefix id needs to be used
    if (storedContainerPrefixID > 0) {
      // generate character, starting at "A". This method should lead to pretty much infinite possible ids
      containerID = String.fromCharCode(storedContainerPrefixID + 64) + containerID;
    }


    // CUSTOM PUBLIC PROPERTIES
    // ------------------------

    /**
     * passed stored data
     * @memberof dom.Container
     * @instance
     * @var {object} data
     */
    this.data = null;

    /**
     * cached jquery stage instance (for dom containers should always be <body>)
     * @memberof dom.Container
     * @instance
     * @var {jQuery} $el
     */
    this.$el = null;

    /**
     * cached dom element
     * @memberof dom.Container
     * @instance
     * @var {DomElement} el
     */
    this.el = null;

    /**
     * shortcut function for finding items inside this elements container
     * @example
     * container.$('.child').html('found that child');
     * @memberof dom.Container
     * @instance
     * @var {jQuery} $
     */
    this.$ = null;

    // TRANSFORMATIONS
    // ---------------

    /**
     * x position of container instance
     * @memberof dom.Container
     * @instance
     * @var {Number} x
     */
    this.x = 0;

    /**
     * y position of container instance
     * @memberof dom.Container
     * @instance
     * @var {Number} y
     */
    this.y = 0;

    /**
     * z position of container instance
     * @memberof dom.Container
     * @instance
     * @var {Number} x
     */
    this.z = 0;

    /**
     * rotation of container instance
     * @memberof dom.Container
     * @instance
     * @var {Number} rotation
     */
    this.rotation = 0;

    /**
     * rotationX of container instance
     * @memberof dom.Container
     * @instance
     * @var {Number} rotationX
     */
    this.rotationX = 0;

    /**
     * rotationY of container instance
     * @memberof dom.Container
     * @instance
     * @var {Number} rotationY
     */
    this.rotationY = 0;

    /**
     * rotationZ of container instance
     * @memberof dom.Container
     * @instance
     * @var {Number} rotationZ
     */
    this.rotationZ = 0;

    /**
     * scaleX of container instance
     * @memberof dom.Container
     * @instance
     * @var {Number} scaleX
     */
    this.scaleX = 1;

    /**
     * scaleY of container instance
     * @memberof dom.Container
     * @instance
     * @var {Number} scaleY
     */
    this.scaleY = 1;

    /**
     * opacity of container instance
     * @memberof dom.Container
     * @instance
     * @var {Number} opacity
     */
    this.opacity = 1;


    // SPECIAL CONTAINER PROPERTIES
    // ----------------------------

    /**
     * container name, gets regenerated if data-name was detected
     * @memberof dom.Container
     * @instance
     * @var {String} name
     */
    this.name = 'container_' + storedContainerID;

    /**
     * stored container id
     * @memberof dom.Container
     * @instance
     * @var {String|Number} _containerID
     */
    this._containerID = storedContainerID;

    /**
     * stored dynamically assigned children
     * @memberof dom.Container
     * @instance
     * @var {object} dynamicChildren
     */
    this.dynamicChildren = {};


    // TRAVERSAL PROPERTIES
    // --------------------

    /**
     * cached jquery stage instance (for dom containers should always be <body>)
     * @memberof dom.Container
     * @instance
     * @var {jQuery} $stage
     */
    this.$stage = null;

    /**
     * cached stage instance (for dom containers should always be <body>)
     * @memberof dom.Container
     * @instance
     * @var {jQuery} stage
     */
    this.stage = null;

    /**
     * parent container object
     * @memberof dom.Container
     * @instance
     * @var {dom.Container} parent
     */
    this.parent = null;

    /**
     * stored children, simple array in order of appearance
     * @memberof dom.Container
     * @instance
     * @var {Array} children
     */
    this.children = [];


    // CONFIGURATION PROPERTIES
    // ------------------------

    /**
     * mouseEnabled wheter mouse events are enabled on container, defaults to true
     * @memberof dom.Container
     * @instance
     * @var {Boolean} mouseEnabled
     */
    this.mouseEnabled = sys.setDefaultValue(this.mouseEnabled, true);

    /**
     * autoPaint transformations to css every frame, defaults to false
     * @memberof dom.Container
     * @instance
     * @var {Boolean} autoPaint
     */
    this.autoPaint = sys.setDefaultValue(this.autoPaint, false);

    /**
     * automatically dispatch update events every frame for use in child classes, defaults to false
     * @memberof dom.Container
     * @instance
     * @var {Boolean} autoUpdate
     */
    this.autoUpdate = sys.setDefaultValue(this.autoUpdate, false);

    // store container painting to prevent double paints
    this._painted = false;

    // call parent constructor
    //if (Parent) Parent.call(this);

    // if options were passed: run through them and overwrite container properties
    if (options) {
      for (var k in options) {
        if (this.hasOwnProperty(k)) {
          this[k] = options[k];
        }
      }
    }

    // store data if any was passed
    if (data) {
      this.data = data;
    }

    // store data if any was passed
    if (template) {
      // assume template was a plain html string
      var html = template;

      // if template was a handlebars template -> compile it by using passed data
      if (typeof template === 'function') {
        html = template(data);
      }

      // cache dom element as jquery object
      this.$el = $(html);

      // check if only one main node was passed
      if (this.$el.size() > 1) {
        throw new Error('Container must only contain 1 target html element, not a list of dom elements');
      }

      // reference $ in this container element to find items inside the element
      this.$ = this.$el.find;

      // cache plain html dom element
      this.el = this.$el[0];

      // reference container instance in html element
      this.el.container = this;

      // get container name if any is set
      var elName = this.el.getAttribute('data-name');

      if (elName) {
        this.name = elName;
      } else {
        elName = this.el.className;
        if (elName) {
          elName = elName.replace(/\s/g, '').replace(/\-/g, '');
          this.name = elName;
        } else {
          elName = this.$el.tagName;
          if (elName) {
            this.name = elName;
          }
        }
      }

      var _this = this;

      // traverse all dom children and auto-fetch containers, set parent etc.
      var childContainers = _this.el.getAttribute('data-children');
      childContainers = ! (childContainers && childContainers.toString().toLowerCase() === 'false');

      if (childContainers) {
        this.$el.children().each(function(){
          var child = Container.fetch($(this));

          child.parent = _this;
          child.stage = _this.stage;
          child.$stage = _this.$stage;
          _this.children.push(child);
          child._added();
        });
      }
    } else {
      throw new Error('Container needs a template (Handlebars, html string, jquery element)');
    }

    // listen to dom added event
    this.addEventListener('addedToStage', _render.bind(this));
    this.addEventListener('removedFromStage', _dispose.bind(this));
  }

  var p = sys.extend(Container, createjs.EventDispatcher);

  // mix in context so we can bind functions accordingly
  Context.mixin(Container);

  /**
   * defines if mouse is enabled on element or not
   *
   * @method setMouseEnabled
   * @memberof dom.Container
   * @public
   * @instance
   * @param {Boolean} value true or false
   **/
  p.setMouseEnabled = function(value){
    this.mouseEnabled = value;
    var _this = this;

    this.el.removeEventListener('mousedown', this.__bind(_preventMouseEvent), true);
    this.el.removeEventListener('mouseup', this.__bind(_preventMouseEvent), true);
    this.el.removeEventListener('click', this.__bind(_preventMouseEvent), true);
    this.el.removeEventListener('tap', this.__bind(_preventMouseEvent), true);

    if (value === false) {
      this.el.addEventListener('mousedown', this.__bind(_preventMouseEvent), true);
      this.el.addEventListener('mouseup', this.__bind(_preventMouseEvent), true);
      this.el.addEventListener('click', this.__bind(_preventMouseEvent), true);
      this.el.addEventListener('tap', this.__bind(_preventMouseEvent), true);
    }
  };

  /**
   * sets autoUpate on container
   *
   * @method setAutoUpdate
   * @memberof dom.Container
   * @public
   * @instance
   * @param {Boolean} value true or false
   **/
  p.setAutoUpdate = function(value){
    this.autoUpdate = value;
    _checkRendering.call(this);
  };

  /**
   * sets autoPaint on container
   *
   * @method setAutoPaint
   * @memberof dom.Container
   * @public
   * @instance
   * @param {Boolean} value true or false
   **/
  p.setAutoPaint = function(value){
    this.autoPaint = value;
    _checkRendering.call(this);
  };

  /**
   * sets zIndex of a child and automatically re-assigns z-indices of its siblings
   *
   * @method setChildIndex
   * @memberof dom.Container
   * @public
   * @instance
   * @param {Container} child the child that needs a new index
   * @param {Number} index the preferred index
   **/
  p.setChildIndex = function(child, index){
    var kids = this.children, _len = kids.length, i;
    if (child.parent !== this || index < 0 || index >= _len) {
      return;
    }

    for (i = 0; i < _len; i++) {
      if (kids[i] === child) {
        break;
      }
    }

    if (i === _len || i === index) {
      return;
    }

    // resorts children array
    kids.splice(i, 1);
    kids.splice(index, 0, child);

    // set zIndex by looping through indices
    for (i = 0; i < _len; i++) {
      kids[i].el.style.zIndex = i;
    }
  };

  /**
   * removes the dom container at a specific index
   * returns removed child for future use
   *
   * @method removeChildAt
   * @memberof dom.Container
   * @public
   * @instance
   * @param {Number} index of the dom element to be removed
   **/
  p.removeChildAt = function(index) {
    var kids = this.children;

    if (kids[index]) {
      var child = kids[index];

      if (! (child && child.$el)) {
        throw new Error('removeChildAt expects child to be a container');
      }

      this.children.splice(index, 1);
      child.$el.remove();
      child._removed();

      return child;
    }

    return false;
  };

  /**
   * removes all children.
   * **NOTE**: this is not the same than calling $el.html('');
   * it runs through all children and dispatches appropriate events
   *
   * @method removeAllChildren
   * @memberof dom.Container
   * @public
   * @instance
   **/
  p.removeAllChildren = function() {
    var kids = this.children;
    while (kids.length) {
      this.removeChildAt(0);
    }
  };

  /**
   * gets child at a specific index from children list
   *
   * @method getChildAt
   * @memberof dom.Container
   * @public
   * @instance
   * @param {Number} index of the dom element to be removed
   **/
  p.getChildAt = function(index) {
    return this.children[index];
  };

  /**
   * determines the index of a container in a child list
   *
   * @method getChildIndex
   * @memberof dom.Container
   * @public
   * @instance
   * @param {Container} child the container from which the index needs to be determined
   **/
  p.getChildIndex = function(child) {
    return createjs.indexOf(this.children, child);
  };

  /**
   * returns the number of children in a container
   *
   * @method getNumChildren
   * @public
   * @memberof dom.Container
   **/
  p.getNumChildren = function() {
    return this.children.length;
  };

  /**
   * adds a child container to the current one
   * calls added event and checks for stage later on
   *
   * @method addChild
   * @memberof dom.Container
   * @public
   * @instance
   * @param {Container} child the container that should be added
   * @param {Boolean} prepend or append the child?
   **/
  p.addChild = function(child, prepend){
    if (! (child && child.$el)) {
      throw new Error('addChild expects child to be a container');
    }

    child.parent = this;

    if (prepend) {
      this.children.unshift(child);
      this.$el.prepend(child.$el);
    } else {
      this.children.push(child);
      this.$el.append(child.$el);
    }

    child._added();
  };

  /**
   * prepends a child to the current one
   *
   * @method prependChild
   * @memberof dom.Container
   * @public
   * @instance
   * @param {Container} child the container that should be added
   **/
  p.prependChild = function(child){
    this.addChild(child, true);
  };

  /**
   * removes a child container from the current one
   * calls removed and removedFromStage event and unsets stage and parent property
   *
   * @method removeChild
   * @memberof dom.Container
   * @public
   * @instance
   * @param {Container} child the container that should be removed
   **/
  p.removeChild = function(child){
    if (! (child && child.$el)) {
      throw new Error('removeChild expects child to be a container');
    }

    var index = this.getChildIndex(child);

    if (index >= 0) {
      var removedChild = this.removeChildAt(index);

      if (removedChild) {
        return removedChild;
      }
    }

    console.warn('child was not found');

    return false;
  };

  /**
   * finds stage if it's already present on child container
   *
   * @method getStage
   * @memberof dom.Container
   * @public
   * @instance
   **/
  p.getStage = function(){
    var node = this.el;
    var tmpNode = node;

    while (true) {
      tmpNode = tmpNode.parentNode;
      if (! tmpNode) break;
      node = tmpNode;
    }

    if (node.toString().indexOf('HTMLDocument') !== -1) {
      return node.body;
    }

    //if (document.body.contains(this.el)) {
    //  return document.body;
    //}

    return false;
  };

  /**
   * paints current transformations to css style via cached dom element
   *
   * @method paint
   * @memberof dom.Container
   * @public
   * @instance
   **/
  p.paint = function(){
    // if container was not already painted from a function call outside -> paint again
    // saves performance by not letting container be painted twice on one rendered frame
    if (! this.autoPaint || ! this._painted) {
      this._painted = true;

      _containerTransform = 'translate3d(' + _correctUnit(this.x) + ',' + _correctUnit(this.y) + ',' + _correctUnit(this.z) + ')';
      _containerTransform += ' scale(' + this.scaleX + ', ' + this.scaleY + ')';
      _containerTransform += ' rotateX(' + this.rotationX + 'deg)';
      _containerTransform += ' rotateY(' + this.rotationY + 'deg)';
      _containerTransform += ' rotateZ(' + (this.rotationZ + this.rotation) + 'deg)';

      this.el.style[css3.transformStylePrefix] = _containerTransform;
      this.el.style.opacity = this.opacity;
    }
  };

  /**
   * automatically assigns name of child to parent container
   * automatically creates a list of childs if there was more than one child with the same name (i.e. <li> elements)
   * dispatches added event and checks for stage
   *
   * @method _added
   * @memberof dom.Container
   * @protected
   * @instance
   **/
  p._added = function(){
    // if container has a name and a parent container
    if (this.name && this.parent) {
      // if the name is an unused property in parent container
      if (! this.parent[this.name]) {
        // assing container to parent by using container's name
        this.parent[this.name] = this;
        this.parent.dynamicChildren[this.name] = this;
      } else {
        // if name was already set in parent container, but was actually not a reserved name,
        // but an already dynamically added child (i.e. if it was a child list <li> or similar)
        if (this.parent.dynamicChildren[this.name]) {
          // convert property to an array and re-assign children correctly
          var oldChild = this.parent.dynamicChildren[this.name];

          if (! Array.isArray(this.parent.dynamicChildren[this.name])) {
            this.parent.dynamicChildren[this.name] = [];
            this.parent.dynamicChildren[this.name].push(oldChild);

            this.parent[this.name] = [];
            this.parent[this.name].push(oldChild);
          }

          this.parent.dynamicChildren[this.name].push(this);
          this.parent[this.name].push(this);
        } else {
          // if the added child was already assigned manually to the parent container it's ok
          // i.e. via: Main.navigation = new Navigation()
          // and navigation template defines data-name="navigation"
          if (this.parent[this.name] !== this) {
            // container name was a reserved property -> not allowed
            throw new Error('child name  > ' + this.name + ' <  is a reserved name in  > Container <');
          }
        }
      }
    }

    this._checkAddedToStage();
    this.dispatchEvent(new createjs.Event('added', false));
  };

  /**
   * automatically unsets name of child in parent container
   * automatically uncreates array list if only one more child with that name was found in parent container
   * dispatches removed event and removedFromStage event
   *
   * @method _removed
   * @memberof dom.Container
   * @protected
   * @instance
   **/
  p._removed = function() {
    // first dispatch removed event, then unbind parent (we could use parent in callback)
    this.dispatchEvent(new createjs.Event('removed', false));

    // if container had a name and a parent
    if (this.name && this.parent) {
      // assume the property doesn't need to be deleted
      var deletesProperty = false;

      // if the parent container really had the child's name assigned
      if (this.parent[this.name]) {
        // if child had siblings / if child's name was a list in parent container
        if (Array.isArray(this.parent[this.name])) {
          // remove child from array list.
          for (var i = 0, _len = this.parent[this.name].length; i < _len; i++) {
            if (this.parent[this.name][i] === this) {
              this.parent[this.name].splice(i, 1);
              this.parent.dynamicChildren[this.name].splice(i, 1);
              break;
            }
          }

          // if child list only contains one more item
          if (this.parent[this.name].length === 1) {
            // convert array to a simple assignemt of remaining child
            this.parent[this.name] = this.parent[this.name][0];
            this.parent.dynamicChildren[this.name] = this.parent.dynamicChildren[this.name][0];
          } else if (this.parent[this.name].length === 0) {
            // or if it was the only left child -> delete property
            deletesProperty = true;
          }
        } else {
          // or if it was not an array list of childs -> delete property
          deletesProperty = true;
        }

        if (deletesProperty) {
          delete this.parent[this.name];
          delete this.parent.dynamicChildren[this.name];
        }
      }
    }

    this.parent = null;

    this._childrenRemovedStage();
  };

  /**
   * explicitly dispatches removedFromStage events in all child containers
   * **NOTE**: when calling container.removeChild(child) child containers of child only dispatch removedFromStage, not removed
   * removed only gets dispatched when a child gets removed explicitly from its parent
   *
   * @method _childrenRemovedStage
   * @memberof dom.Container
   * @protected
   * @instance
   **/
  p._childrenRemovedStage = function(){
    if (this.children) {
      var kids = this.children;
      for (var i = 0, _len = kids.length; i < _len; i++) {
        if (kids[i]._childrenRemovedStage) {
          kids[i]._childrenRemovedStage();
        }
      }
    }

    if (this.stage) {
      this.dispatchEvent(new createjs.Event('removedFromStage', false));
      this.stage = null;
      this.$stage = null;
    }
  };

  /**
   * checks if child was already added to stage
   * if so: dispatch event in child and all sub-children
   *
   * @method _checkAddedToStage
   * @memberof dom.Container
   * @protected
   * @instance
   **/
  p._checkAddedToStage = function(){
    var stage = this.getStage();
    var dispatchAddedToStage = false;

    if (stage) {
      if (! this.stage) {
        this.stage = stage;
        this.$stage = $(stage);
        dispatchAddedToStage = true;
      }
    }

    if (this.children) {
      var kids = this.children;
      for (var i = 0, _len = kids.length; i < _len; i++) {
        if (kids[i]._checkAddedToStage) {
          kids[i]._checkAddedToStage();
        }
      }
    }

    if (dispatchAddedToStage) {
      this.dispatchEvent(new createjs.Event('addedToStage', false));
    }
  };

  /**
   * checks whether the container needs to be auto updated or autoPainted on each frame
   * function gets called automatically when added or when setAutoPaint or setAutoUpdate is called
   *
   * @method _checkRendering
   * @memberof dom.Container
   * @private
   * @instance
   **/
  var _checkRendering = function(){
    delete _autoUpdateContainers[this._containerID];
    delete _autoPaintContainers[this._containerID];

    if (this.autoUpdate || this.autoPaint) _autoUpdateContainers[this._containerID] = this;
    if (this.autoPaint) _autoPaintContainers[this._containerID] = this;
  };

  /**
   * prevents all mouse events if mouseEnabled is set to false
   *
   * @method _preventMouseEvent
   * @memberof dom.Container
   * @private
   * @instance
   **/
  var _preventMouseEvent = function(e){
    e.stopPropagation();
    e.stopImmediatePropagation();
    e.preventDefault();
  };

  /**
   * checks if element needs to autoPaint
   * listens to removedFromStage event to dispose rendering
   * unbinds addedToStage event as container should not be addedToStage again before removedFromStage first
   * automatically calls render on child class if available
   *
   * @method _render
   * @memberof dom.Container
   * @private
   * @instance
   **/
  var _render = function(){
    // check if needs auto rendering
    _checkRendering.call(this);
  };

  /**
   * unbinds fps tick event and re-listens for addedToStage event to render again
   * automatically calls dispose on child class if available
   *
   * @method _dispose
   * @memberof dom.Container
   * @private
   * @instance
   **/
  var _dispose = function(){
    // remove fps checker
    delete _autoUpdateContainers[this._containerID];
    delete _autoPaintContainers[this._containerID];
  };

  /**
   * fetches a container instance by passing in a jquery object
   *
   * automatically disables autoPaint on fetched container
   *
   * only used for simple dom traversal, not for real components
   *
   * gets used for child dom nodes when creating a new container
   *
   * automatically creates a new class instance based on data-class
   *
   * @example Container.fetch('<div name="mover" data-class="dom/MoveClip"></div>');
   *
   * @method fetch
   * @memberof dom.Container
   * @param {jQuery} $el the jquery object that the container should handle
   * @static
   **/
  Container.fetch = function($el){
    // fetch defined container class through data-class
    var className = $el[0].getAttribute('data-class');

    // assume it's a simple container
    var ClassTemplate = Container;

    // only tell normal containers that they should not autoPaint
    var options = {autoUpdate: false, autoPaint: false};

    // otherwise require class
    // NOTE: class has to be already in require registry
    if (className) {
      ClassTemplate = require(className);
      options = {};

      var opts = $el[0].getAttribute('data-options');

      if (opts) {
        options = JSON.parse(opts);
      }
    }

    // create new class instance and set autoPainting and autoUpdating to false by default to save some performance
    var ct = new ClassTemplate($el, null, options);

    if (! className) {
      ct.autoUpdate = false;
      ct.autoPaint = false;
    }

    return ct;
  };

  /**
   * creates a container instance based on an html string
   *
   * @method create
   * @memberof dom.Container
   * @param {String} html the dom string of which a container should be created
   * @static
   **/
  Container.create = function(html){
    var $el = $(html);
    return Container.fetch($el);
  };

  /**
   * adds 'px' to a value if no unit is set
   *
   * @method _correctUnit
   * @memberof dom.Container
   * @private
   * @instance
   **/
  var _correctUnit = function(value){
    if (parseFloat(value).toString() === value.toString()) {
      return value + 'px';
    }

    return value;
  };

  return Container;
});
