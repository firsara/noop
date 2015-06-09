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
     * @param {class} target where context should be mixed in
     **/
    p.__bind = function(fct){
      // initialize context storage if not found yet
      if (! this.__context) {
        /**
         * stored bound function contexts
         * @memberof utils.Context
         * @instance
         * @public
         * @var {String} __context
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
  };

  return Context;
});
