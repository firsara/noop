/*
 * templating.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 *
 * templating helper scripts
 * used for bootstrapping "dom/Container" creation
 * includes handlebars helpers
 */
define(['jquery', 'handlebars', './dom/Container'], function($, Handlebars, Container) {
  /*
   * used by "dom/Container" to simplify appending dom elements
   *
   * @plugin addChild
   */
  $.fn.addChild = function(child){
    if (child && child.$el) {
      $(this).append(child.$el);
      child._added();
    }
  };

  /*
   * used by "dom/Container" to simplify removing dom elements
   *
   * @plugin removeChild
   */
  $.fn.removeChild = function(child){
    if (child && child.$el && child.$el.remove) {
      child.$el.remove();
      child._removed();
    }
  };

  /*
   * helper function to create a "dom/Container" out of a simple jQuery element
   *
   * @plugin container
   */
  $.fn.container = function(){
    return Container.fetch($(this));
  };

  /*
   * converts a point object {x: 0, y: 0}
   * to local coordinates in a container
   *
   * @plugin globalToLocal
   * @param {object} global coordinates that should be converted
   */
  $.fn.globalToLocal = function(global){
    var position = $(this).offset();

    return {
      x: Math.floor(global.x - position.left),
      y: Math.floor(global.y - position.top)
    };
  };

  /*
   * converts a point object {x: 0, y: 0} position in a local container
   * to global page coordinates
   *
   * @plugin localToGlobal
   * @param {object} local coordinates that should be converted
   */
  $.fn.localToGlobal = function(local){
    var position = $(this).offset();

    return {
      x: Math.floor(local.x + position.left),
      y: Math.floor(local.y + position.top)
    };
  };

  /*
   * alternative to $.fn.bind
   *
   * @plugin addEventListener
   */
  /*
  $.fn.addEventListener = function(evt, fct){
    $(this).bind(evt, fct);
  };
  */

  /*
   * alternative to $.fn.unbind
   *
   * @plugin removeEventListener
   */
  /*
  $.fn.removeEventListener = function(evt, fct){
    $(this).unbind(evt, fct);
  };
  */


  /*
   * increments the given value by 1.
   * used for outputting a numeric list in an each loop
   * usage: {{inc @index}}
   *
   * @helper inc
   */
  Handlebars.registerHelper('inc', function(value, options){
    return parseInt(value) + 1;
  });

  /*
   * increments the given value by 1, only if the key is numeric.
   * used for outputting a numeric list in an each loop for arrays, not objects
   * usage: {{inc_key @key}}
   *
   * example:
   * persons = {
   *   first: {
   *     children: [
   *       {},
   *       {}
   *     ]
   *   },
   *   second: {},
   * }
   * {{#each persons}}
   *   {{inc_key @key}} // outputs 'first', 'second'
   *   {{#each children}}
   *     {{inc_key @key}} // outputs '1', '2'
   *   {{/each}}
   * {{/each}}
   *
   * @helper inc_key
   */
  Handlebars.registerHelper('inc_key', function(value, options){
    if (isNaN(value)) return value;
    return parseInt(value) + 1;
  });

  /*
   * Logs given value through window console
   * usage: {{console_log @key}}
   *
   * @helper console_log
   */
  Handlebars.registerHelper('console_log', function(value, options){
    console.log(value);
  });

  /*
   * Logs given value through window console
   * usage: {{#if_isset value}}output{{else}}other_output{{/if_isset}}
   *
   * @helper if_isset
   */
  Handlebars.registerHelper('if_isset', function(value, options){
    if (value && value.length > 0) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  /*
   * checks if key is included in value
   * usage: {{#if_includes values "mykey"}}output{{else}}other_output{{/if_includes}}
   *
   * @helper if_includes
   */
  Handlebars.registerHelper('if_includes', function(value, key, options){
    if (value && key && value.indexOf(key) !== -1) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  /*
   * checks if a specific condition applies
   * usage: {{#if_cond var1 "===" var2}}output{{else}}other_output{{/if_cond}}
   *
   * @helper if_cond
   */
  Handlebars.registerHelper('if_cond', function(v1, operator, v2, options){
    switch (operator) {
      case '==':
        return (v1 == v2) ? options.fn(this) : options.inverse(this);
      case '===':
        return (v1 === v2) ? options.fn(this) : options.inverse(this);
      case '<':
        return (v1 < v2) ? options.fn(this) : options.inverse(this);
      case '<=':
        return (v1 <= v2) ? options.fn(this) : options.inverse(this);
      case '>':
        return (v1 > v2) ? options.fn(this) : options.inverse(this);
      case '>=':
        return (v1 >= v2) ? options.fn(this) : options.inverse(this);
      case '&&':
        return (v1 && v2) ? options.fn(this) : options.inverse(this);
      case '||':
        return (v1 || v2) ? options.fn(this) : options.inverse(this);
      default:
        return options.inverse(this);
    }
  });

});
