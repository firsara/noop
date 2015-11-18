/*
 * EventDispatcher.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define(function() {
  // TODO: write docs
  function EventDispatcher(){
    this._listeners = {};
  }

  var p = EventDispatcher.prototype;

  p.getListeners = function(type){
    this._listeners = this._listeners || {};

    if (type) {
      this._listeners[type] = this._listeners[type] || [];
      return this._listeners[type];
    }

    return this._listeners;
  };

  p.removeAllEventListeners = function(){
    this._listeners = {};
  };

  p.addEventListener = function(type, listener){
    this.on(type, listener, listener);
  };

  p.hasEventListener = function(type, listener){
    var listeners = this.getListeners(type);

    if (listener) {
      for (var i = 0, _len = listeners.length; i < _len; i++) {
        if (listeners[i].listener === listener) {
          return true;
          break;
        }
      }

      return false;
    }

    return listeners.length !== -1;
  };

  p.removeEventListener = function(type, listener){
    this.off(type, listener);
  };

  p.off = function(type, listener){
    var listeners = this.getListeners(type);

    for (var i = 0, _len = listeners.length; i < _len; i++) {
      if (listeners[i].listener === listener) {
        listeners.splice(i, 1);
        break;
      }
    }
  };

  p.on = function(type, listener, scope){
    // prevent double event listeners on an item
    this.off(type, listener);

    var event = {};
    event.type = type;
    event.listener = listener;
    event.scope = scope || this;

    this._listeners[type].push(event);
  };

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

  return EventDispatcher;
});
