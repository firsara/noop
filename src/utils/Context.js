/*
 * Context.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define(function(){
  /**
   * helper class for handling event contexts
   * @namespace Context
   * @memberof utils
   */
  var Context = {};

  /**
   * mixes context values in to defined class
   *
   * @method mixin
   * @memberof utils.Context
   * @param {class} target where context should be mixed in
   **/
  Context.mixin = function(target){
    // cache class prototype
    var p = target.prototype;

    // if already mixed in return
    if (p.__bind) return;

    /**
     * binds a function to the target
     *
     * @method __bind
     * @memberof utils.Context
     * @param {function} fct that should be bound
     **/
    p.__bind = function(fct){
      var i, _len, bound;

      // initialize context storage if not found yet
      if (! this.__context) {
        /**
         * stored bound function contexts
         * @memberof utils.Context
         * @instance
         * @public
         * @var {Array} __context
         **/
        this.__context = [];
      }

      // find stored method
      for (i = 0, _len = this.__context.length; i < _len; i++) {
        if (this.__context[i].src === fct || this.__context[i].bound === fct) {
          return this.__context[i].bound;
        }
      }

      bound = fct.bind(this);

      this.__context.push({src: fct, bound: bound});

      return bound;
    };

    /**
     * delays a function call on the target instance
     *
     * @method delay
     * @memberof utils.Context
     * @param {function} fct that should be called after the delay
     * @param {Number} timeout after which function should be called
     * @param {Array} params that should be called on callback after invocation
     **/
    p.delay = function(fct, timeout, params){
      if (! this.__delays) {
        /**
         * stored delays
         * @memberof utils.Context
         * @instance
         * @public
         * @var {Array} __delays
         **/
        this.__delays = [];
      }

      this.stopDelay(fct);

      var bound = this.__bind(fct);
      var _this = this;

      var callback = function(){
        _this.stopDelay(fct);
        bound.apply(_this, params);
      };

      var timeoutId = setTimeout(callback, timeout);
      this.__delays.push({fct: bound, uid: timeoutId});

      return timeoutId;
    };

    /**
     * throttles a function by a delay (i.e. function will only be called every timeout time)
     *
     * @method choke
     * @memberof utils.Context
     * @param {function} fct that should be called after the delay
     * @param {Number} timeout after which function should be called
     * @param {Array} params that should be called on callback after invocation
     **/
    p.choke = function(fct, timeout, params){
      var timeoutId = this.hasDelay(fct);
      if (timeoutId) return timeoutId;
      return this.delay(fct, timeout, params);
    };

    /**
     * stops the delay of a specific function call on the target instance.<br>
     * if no fct is defined automatically stops all delays
     *
     * @method stopDelay
     * @memberof utils.Context
     * @param {function} fct that should be called after the delay (optional)
     **/
    p.stopDelay = function(fct){
      if (this.__delays) {
        var i, _len;

        if (fct) {
          var bound = this.__bind(fct);

          for (i = 0, _len = this.__delays.length; i < _len; i++) {
            if (this.__delays[i].fct === bound) {
              clearTimeout(this.__delays[i].uid);
              this.__delays.splice(i, 1);
              break;
            }
          }
        } else {
          for (i = 0, _len = this.__delays.length; i < _len; i++) {
            clearTimeout(this.__delays[i].uid);
          }

          this.__delays = [];
        }
      }
    };

    /**
     * checks wheter or not has a delay function for a specific function
     *
     * @method hasDelay
     * @memberof utils.Context
     * @param {function} fct that should be checked for
     **/
    p.hasDelay = function(fct){
      if (this.__delays) {
        var i, _len;

        if (fct) {
          var bound = this.__bind(fct);

          for (i = 0, _len = this.__delays.length; i < _len; i++) {
            if (this.__delays[i].fct === bound) {
              return this.__delays[i].uid;
              break;
            }
          }
        }
      }

      return false;
    };
  };

  return Context;
});
