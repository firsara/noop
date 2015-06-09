/*
 * ScaleClip.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define([
  '../sys',
  './EventTracker',
  '../display/Transformable',
  '../display/ScaleClip'
],
function(
  sys,
  EventTracker,
  Transformable,
  BaseScaleClip
) {
  /**
   * @see display.base.BaseScaleClip
   *
   * @class ScaleClip
   * @memberof dom
   * @extends dom.EventTracker
   * @mixes display.base.BaseTransformable
   * @mixes display.base.BaseScaleClip
   *
   * @param {Handlebars} template should be a compiled handlebars template. alternatively can be a plain string or jquery object
   * @param {object} data the data to pass through the template, optional
   * @param {object} options optional options to overwrite container properties before inheriting
   **/
  function ScaleClip(template, data, options){
    EventTracker.call(this, template, data, options);
    Transformable.call(this);
    BaseScaleClip.call(this);
  }

  sys.extend(ScaleClip, EventTracker);
  sys.mixin(ScaleClip, Transformable);
  sys.mixin(ScaleClip, BaseScaleClip);

  return ScaleClip;
});
