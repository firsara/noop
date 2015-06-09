/*
 * RotateClip.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define([
  '../sys',
  './EventTracker',
  '../display/Transformable',
  '../display/RotateClip'
],
function(
  sys,
  EventTracker,
  Transformable,
  BaseRotateClip
) {
  /**
   * @see display.base.BaseRotateClip
   *
   * @class RotateClip
   * @memberof dom
   * @extends dom.EventTracker
   * @mixes display.base.BaseTransformable
   * @mixes display.base.BaseRotateClip
   *
   * @param {Handlebars} template should be a compiled handlebars template. alternatively can be a plain string or jquery object
   * @param {object} data the data to pass through the template, optional
   * @param {object} options optional options to overwrite container properties before inheriting
   **/
  function RotateClip(template, data, options){
    EventTracker.call(this, template, data, options);
    Transformable.call(this);
    BaseRotateClip.call(this);
  }

  sys.extend(RotateClip, EventTracker);
  sys.mixin(RotateClip, Transformable);
  sys.mixin(RotateClip, BaseRotateClip);

  return RotateClip;
});
