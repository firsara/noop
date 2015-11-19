/*
 * Moveable.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define([
  '../sys',
  './EventTracker',
  '../display/Transformable',
  '../display/Moveable'
],
function(
  sys,
  EventTracker,
  Transformable,
  BaseMoveable
) {
  /**
   * @see display.base.BaseMoveable
   *
   * @class Moveable
   * @memberof dom
   * @extends dom.EventTracker
   * @mixes display.base.BaseTransformable
   * @mixes display.base.BaseMoveable
   *
   * @param {Handlebars} template should be a compiled handlebars template. alternatively can be a plain string or jquery object
   * @param {object} data the data to pass through the template, optional
   * @param {object} options optional options to overwrite container properties before inheriting
   **/
  function Moveable(template, data, options){
    EventTracker.call(this, template, data, options);
    Transformable.call(this);
    BaseMoveable.call(this);
  }

  sys.extend(Moveable, EventTracker);
  sys.mixin(Moveable, Transformable);
  sys.mixin(Moveable, BaseMoveable);

  return Moveable;
});
