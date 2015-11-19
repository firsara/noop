/*
 * Scaleable.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define([
  '../sys',
  './EventTracker',
  '../display/Transformable',
  '../display/Scaleable'
],
function(
  sys,
  EventTracker,
  Transformable,
  BaseScaleable
) {
  /**
   * @see display.base.BaseScaleable
   *
   * @class Scaleable
   * @memberof dom
   * @extends dom.EventTracker
   * @mixes display.base.BaseTransformable
   * @mixes display.base.BaseScaleable
   *
   * @param {Handlebars} template should be a compiled handlebars template. alternatively can be a plain string or jquery object
   * @param {object} data the data to pass through the template, optional
   * @param {object} options optional options to overwrite container properties before inheriting
   **/
  function Scaleable(template, data, options){
    EventTracker.call(this, template, data, options);
    Transformable.call(this);
    BaseScaleable.call(this);
  }

  sys.extend(Scaleable, EventTracker);
  sys.mixin(Scaleable, Transformable);
  sys.mixin(Scaleable, BaseScaleable);

  return Scaleable;
});
