/*
 * router.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define(['./uri'], function(uri){
  // cache current domain for link checks
  var currentDomain = uri(window.location.href.toString()).join(['protocol', 'domain', 'port']);

  /**
   * handles routes defined as javascript object and maps them to specific controllers and their according action
   *
   * @example
   *
   * var controller = {layout: ...};
   * var router = new Router(controller, {...routes})
   * router.parse(controller.layout);
   * router.route();
   *
   * @class Router
   * @memberof utils
   * @param {Object} controller an object that gets passed on to every controller when route changes are detected
   * @param {Object} routes a list of routes, see example for configuration
   **/
  function Router(controller, routes){
    /**
     * action to call before routes are executed<br>
     * action gets passed in callback as first parameter and needs to call it when finished
     * @memberof Router
     * @instance
     * @public
     * @var {Function} before
     */
    this.before = null;

    /**
     * action to call after routes are executed<br>
     * action gets passed in callback as first parameter and needs to call it when finished
     * @memberof Router
     * @instance
     * @public
     * @var {Function} after
     */
    this.after = null;

    // store controller instance
    this.controller = controller;

    // store routes
    this.routes = routes;

    // store link elements
    this.linkElements = [];

    // bind url change function to instance
    this._urlChange = _urlChange.bind(this);

    // bind clicked function to instance
    this._clicked = _clicked.bind(this);

    // add event listener to window, listen for url changes
    window.addEventListener('popstate', this._urlChange);
  }

  /**
   * wheter urls should be rewritten or not (if not uses query string ?route=path/to/route)
   * @memberof Router
   * @instance
   * @static
   * @var {Boolean} rewrite
   */
  Router.rewrite = true;

  /**
   * Base subpath if app is not running on root
   * @memberof Router
   * @instance
   * @static
   * @var {String} base
   */
  Router.base = '/';

  /**
   * destroy current router instance
   * @method destroy
   * @memberof Router
   * @instance
   **/
  Router.prototype.destroy = function(){
    window.removeEventListener('popstate', this._urlChange);

    for (var i = 0, _len = this.linkElements.length; i < _len; i++) {
      this.linkElements[i].removeEventListener('click', this._clicked);
    }
  };

  /**
   * parses a dom container for href's, and binds click events to internal links
   * @method parse
   * @memberof Router
   * @instance
   * @param {DOMElement} container
   **/
  Router.prototype.parse = function(container){
    var links = _findInternalLinks(container);

    for (var i = 0, _len = links.length; i < _len; i++) {
      var alreadyParsed = false;

      for (var j = 0, _len2 = this.linkElements.length; j < _len2; j++) {
        if (this.linkElements[j] === links[i]) {
          alreadyParsed = true;
          break;
        }
      }

      if (! alreadyParsed) {
        this.linkElements.push(links[i]);
        links[i].removeEventListener('click', this._clicked);
        links[i].addEventListener('click', this._clicked);
      }
    }
  };

  /**
   * unbinds events on container elements
   * @method unbind
   * @memberof Router
   * @instance
   * @param {DOMElement} container
   **/
  Router.prototype.unbind = function(container){
    var links = _findInternalLinks(container);

    for (var i = 0, _len = links.length; i < _len; i++) {
      links[i].removeEventListener('click', this._clicked);

      for (var j = 0, _len2 = this.linkElements.length; j < _len2; j++) {
        if (this.linkElements[j] === links[i]) {
          this.linkElements.splice(j, 1);
          j--;
        }
      }
    }
  };

  /**
   * fetches route and calls controller, should be called when first instantiating the router
   * @method route
   * @memberof Router
   * @instance
   **/
  Router.prototype.route = function(){
    _urlChange.call(this);
  };

  /**
   * switches to a specific path
   * @method to
   * @memberof Router
   * @instance
   * @param {String} path that should be switched to
   * @param {Boolean} silent if should route to controller or just set new path
   **/
  Router.prototype.to = function(path, silent){
    if (path.indexOf('http://') === -1 && path.indexOf('https://') === -1 && path.indexOf('file://') === -1) path = Router.generate(path);
    history.pushState(null, null, path);

    if (silent !== true) {
      this._urlChange();
    }
  };

  /**
   * switches to a specific path silently (i.e. don't calling appropriate controller)
   * @method silent
   * @memberof Router
   * @instance
   * @param {String} path that should be switched to
   **/
  Router.prototype.silent = function(path){
    this.to(path, true);
  };

  /**
   * finds internal links on a given Dom Container
   * @method to
   * @memberof Router
   * @instance
   * @param {DOMElement} container that should be checked for
   **/
  var _findInternalLinks = function(container){
    var elements = container.querySelectorAll('a[href]');
    var internalLinks = [];

    for (var i = 0, _len = elements.length; i < _len; i++) {
      var internalLink = true;
      var itemHref = elements[i].getAttribute('href');

      if (itemHref.indexOf('mailto:') !== -1) internalLink = false;
      if (elements[i].getAttribute('data-route') === 'false') internalLink = false;
      if (elements[i].getAttribute('target') === '_blank') internalLink = false;
      if (elements[i].getAttribute('data-href')) internalLink = true;
      if (itemHref.indexOf('http://') !== -1 || itemHref.indexOf('https://') !== -1 || itemHref.indexOf('file://') !== -1) {
        if (itemHref.indexOf(currentDomain) === -1) internalLink = false;
      }

      if (internalLink) {
        internalLinks.push(elements[i]);
      }
    }

    return internalLinks;
  };

  /**
   * prevents click events if not a new window needs to be shown
   * @method _clicked
   * @memberof Router
   * @instance
   * @private
   * @param {MouseEvent} event to prevent clicks
   **/
  var _clicked = function(event){
    if (event.ctrlKey ||
        event.shiftKey ||
        event.metaKey || // apple
       (event.button && event.button === 1) // middle click, >IE9 + everyone else
    ){
      event.stopPropagation();
      return false;
    }

    event.preventDefault();

    var itemHref = event.currentTarget.getAttribute('data-href') || event.currentTarget.getAttribute('href');
    var path = Router.get(itemHref);
    var route = Router.fetch(this.routes, path);

    if (route.path && this.routes[route.path] && this.routes[route.path].overwrite === false) {
      _route.call(this, path);
    } else {
      this.to(itemHref);
    }
  };

  /**
   * calls route when a url change has been detected
   * @method _urlChange
   * @memberof Router
   * @instance
   * @private
   **/
  var _urlChange = function(){
    _route.call(this, Router.get());
  };

  /**
   * finds current url path and calls controller's according action
   * @method _route
   * @memberof Router
   * @instance
   * @private
   **/
  var _route = function(path){
    var route = Router.fetch(this.routes, path);
    var definition = this.routes[route.path];

    if (! route.path) {
      if (this.routes.defaults) {
        if (this.routes.defaults.path) {
          route = Router.fetch(this.routes, this.routes.defaults.path);
          definition = this.routes[route.path];
        } else {
          definition = this.routes.defaults;
        }
      }
    }

    var _this = this;

    var executeRoute = function(){
      var action = definition.action || 'index';
      var InstanceClass = definition.controller;
      var instance = new InstanceClass(_this.controller, action);
      action = 'action' + action.substring(0, 1).toUpperCase() + action.substring(1);

      if (instance[action]) {
        instance[action].apply(instance, route.params);
      }

      if (_this.after) {
        _this.after();
      }
    };

    if (definition && definition.controller) {
      if (this.before) {
        this.before(executeRoute);
      } else {
        executeRoute();
      }
    }
  };

  /**
   * splits up path into individual parts and crops out empty items
   * @method _splitPath
   * @memberof Router
   * @instance
   * @private
   **/
  var _splitPath = function(url){
    var tmp = url.split('/');
    var path = [];

    for (var i = 0, _len = tmp.length; i < _len; i++) {
      if (tmp[i] !== '') {
        path.push(tmp[i]);
      }
    }

    return path;
  };

  /**
   * generates a full url to a specific route taking rewrite rules into account
   * @method generate
   * @memberof Router
   * @instance
   * @public
   * @static
   * @param {String} path for which a full url should be generated
   */
  Router.generate = function(path){
    var current = uri(window.location.href.toString());

    if (Router.rewrite) {
      current.path = Router.base + path;
      return current.join(['protocol', 'domain', 'port', 'path']);
    }

    current.path = Router.base;
    current.query = {path: path};
    return current.join(['protocol', 'domain', 'port', 'path', 'query']);
  };

  /**
   * generates the corresponding path of the current or a specified url, stripping out the domain and base path
   * @method get
   * @memberof Router
   * @instance
   * @public
   * @static
   * @param {String} url (optional)
   */
  Router.get = function(url){
    if (! url) url = window.location.href.toString();

    var current = uri(url);
    var path = current.query.path;

    if (Router.rewrite) {
      path = current.path.replace(Router.base, '');
      if (Router.base === '/') path = current.path.substring(1);
    }

    if (! path) path = '';

    return path;
  };

  /**
   * finds a specific path in defined routes
   * @method fetch
   * @memberof Router
   * @instance
   * @public
   * @static
   * @param {Object} routes
   * @param {String} path
   */
  Router.fetch = function(routes, path){
    var foundPath = null;
    var params = [];

    if (! path) path = Router.get();
    path = _splitPath(path);

    for (var k in routes) {
      if (routes.hasOwnProperty(k)) {
        var routePath = _splitPath(k);
        params = [];

        if (path.length !== routePath.length) continue;

        var allValid = true;

        for (var i = 0, _len = path.length; i < _len; i++) {
          if (routePath[i].indexOf('{') >= 0 && routePath[i].indexOf('}') >= 0) {
            params.push(path[i]);
          } else if (path[i] !== routePath[i]) {
            allValid = false;
          }
        }

        if (allValid) {
          foundPath = k;
          break;
        }
      }
    }

    return {path: foundPath, params: params};
  };

  return Router;
});
