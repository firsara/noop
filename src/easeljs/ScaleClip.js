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
   * @memberof easeljs
   * @extends easeljs.EventTracker
   * @mixes display.base.BaseTransformable
   * @mixes display.base.BaseScaleClip
   **/
  function ScaleClip(){
    EventTracker.call(this);
    Transformable.call(this);
    BaseScaleClip.call(this);
  }

  sys.extend(ScaleClip, EventTracker);
  sys.mixin(ScaleClip, Transformable);
  sys.mixin(ScaleClip, BaseScaleClip);

  return ScaleClip;
});
