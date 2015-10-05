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
    var i, _len, bound;

    /**
     * binds a function to the target
     *
     * @method __bind
     * @memberof utils.Context
     * @param {function} fct that should be bound
     **/
    p.__bind = function(fct){
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
        if (this.__context[i].src === fct) {
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
     **/
    p.delay = function(fct, timeout){
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
      this.__delays.push({fct: fct, uid: setTimeout(bound, timeout)});
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
  };

  return Context;
});
