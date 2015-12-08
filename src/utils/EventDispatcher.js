/*
 * EventDispatcher.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define(function() {

  /**
   * simple event dispatcher useful for any custom object
   *
   * @example
   *
   * var MyObject = {};
   * MyObject.prototype.doSomething = function(){};
   * EventDispatcher.mixin(MyObject);
   *
   * var instance = new MyObject();
   * instance.on('someEvent', instance.doSomething);
   *
   * @class EventDispatcher
   * @memberof utils
   **/
  function EventDispatcher(){
    this._listeners = {};
  }

  var p = EventDispatcher.prototype;

  /**
   * gets all listeners attached to an instance.<br>
   * optionally filterd by type
   *
   * @method getListeners
   * @instance
   * @public
   * @memberof utils.EventDispatcher
   * @param {String} type of event (optional)
   **/
  p.getListeners = function(type){
    this._listeners = this._listeners || {};

    if (type) {
      return this._listeners[type] || [];
    }

    return this._listeners;
  };

  /**
   * removes all event listeners of an object, so no more callbacks will fire on event dispatching
   *
   * @method removeAllEventListeners
   * @memberof utils.EventDispatcher
   * @instance
   * @public
   **/
  p.removeAllEventListeners = function(){
    this._listeners = {};
  };

  /**
   * adds a single event listener of a specific type to the instance object
   *
   * @method addEventListener
   * @memberof utils.EventDispatcher
   * @instance
   * @public
   * @param {String} type of event
   * @param {Function} listener a callback that will fire when events get dispatched
   **/
  p.addEventListener = function(type, listener){
    this.on(type, listener, listener);
  };

  /**
   * checks if instance has one or more listeners of a specific event type.<br>
   * optionally can filter if a specific listeners is already listening for that event type
   *
   * @method hasEventListener
   * @memberof utils.EventDispatcher
   * @instance
   * @public
   * @param {String} type of event
   * @param {Function} listener to check for (optional)
   **/
  p.hasEventListener = function(type, listener){
    var listeners = this.getListeners(type);

    if (listener) {
      for (var i = 0, _len = listeners.length; i < _len; i++) {
        if (listeners[i].listener === listener) {
          return true;
        }
      }

      return false;
    }

    return listeners.length !== 0;
  };

  /**
   * removes an event listener from the instance object
   *
   * @method removeEventListener
   * @memberof utils.EventDispatcher
   * @instance
   * @public
   * @param {String} type of event
   * @param {Function} listener that should be removed (optional, if null removes all listeners of that type)
   **/
  p.removeEventListener = function(type, listener){
    this.off(type, listener, listener);
  };

  /**
   * shorthand for removeEventListener.
   *
   * @method off
   * @memberof utils.EventDispatcher
   * @instance
   * @public
   * @param {String} type of event
   * @param {Function} listener that should be removed (optional, if null removes all listeners of that type)
   **/
  p.off = function(type, listener, scope){
    scope = scope || this;

    var listeners = this.getListeners(type);

    if (listener) {
      for (var i = 0, _len = listeners.length; i < _len; i++) {
        if (listeners[i].listener === listener && listeners[i].scope === scope) {
          listeners.splice(i, 1);
          break;
        }
      }

      this._listeners[type] = this._listeners[type] || [];
      if (this._listeners[type].length === 0) delete this._listeners[type];
    } else {
      delete this._listeners[type];
    }
  };

  /**
   * shorthand for addEventListener.<br>
   * can define a specific scope for the callback function. (defaults to instance itself so no function binding required)
   *
   * @method on
   * @memberof utils.EventDispatcher
   * @instance
   * @public
   * @param {String} type of event
   * @param {Function} listener a callback that will fire when events get dispatched
   * @param {object} scope of callback function
   **/
  p.on = function(type, listener, scope){
    // prevent double event listeners on an item
    this.off(type, listener);

    var event = {};
    event.type = type;
    event.listener = listener;
    event.scope = scope || this;

    this._listeners[type] = this._listeners[type] || [];
    this._listeners[type].push(event);
  };

  /**
   * dispatches an event on the instance object.<br>
   * all listeners will be dispatched in order of appearance.<br>
   * event parameter can either be a string or an object in the form {type: 'myCustomEvent', ...data}.<br>
   * if an object is used, all the object data will get passed on to the first argument of the callback function
   *
   * @method dispatchEvent
   * @memberof utils.EventDispatcher
   * @instance
   * @public
   * @param {String|Object} event that should be dispatched
   **/
  p.dispatchEvent = function(event){
    if (typeof event === 'string') {
      event = {type: event};
    }

    event.target = this;
    event.currentTarget = this;

    var listeners = this.getListeners(event.type).concat();

    for (var i = 0, _len = listeners.length; i < _len; i++) {
      listeners[i].listener.call(listeners[i].scope, event);
    }
  };

  /**
   * mixes in EventDispatcher functionality to a specific object
   *
   * @method mixin
   * @memberof utils.EventDispatcher
   * @static
   * @param {object} instance that should mix in EventDispatcher
   **/
  EventDispatcher.mixin = function(instance){
    for (var k in p) {
      if (p.hasOwnProperty(k)) {
        instance.prototype[k] = p[k];
      }
    }
  };

  return EventDispatcher;
});
