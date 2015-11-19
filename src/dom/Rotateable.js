/*
 * Rotateable.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define([
  '../sys',
  './EventTracker',
  '../display/Transformable',
  '../display/Rotateable'
],
function(
  sys,
  EventTracker,
  Transformable,
  BaseRotateable
) {
  /**
   * @see display.base.BaseRotateable
   *
   * @class Rotateable
   * @memberof dom
   * @extends dom.EventTracker
   * @mixes display.base.BaseTransformable
   * @mixes display.base.BaseRotateable
   *
   * @param {Handlebars} template should be a compiled handlebars template. alternatively can be a plain string or jquery object
   * @param {object} data the data to pass through the template, optional
   * @param {object} options optional options to overwrite container properties before inheriting
   **/
  function Rotateable(template, data, options){
    EventTracker.call(this, template, data, options);
    Transformable.call(this);
    BaseRotateable.call(this);
  }

  sys.extend(Rotateable, EventTracker);
  sys.mixin(Rotateable, Transformable);
  sys.mixin(Rotateable, BaseRotateable);

  return Rotateable;
});
