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
   * @memberof easeljs
   * @extends easeljs.EventTracker
   * @mixes display.base.BaseTransformable
   * @mixes display.base.BaseRotateClip
   **/
  function RotateClip(){
    EventTracker.call(this);
    Transformable.call(this);
    BaseRotateClip.call(this);
  }

  sys.extend(RotateClip, EventTracker);
  sys.mixin(RotateClip, Transformable);
  sys.mixin(RotateClip, BaseRotateClip);

  return RotateClip;
});
