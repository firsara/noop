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
   * @memberof easeljs
   * @extends easeljs.EventTracker
   * @mixes display.base.BaseTransformable
   * @mixes display.base.BaseScaleable
   **/
  function Scaleable(){
    EventTracker.call(this);
    Transformable.call(this);
    BaseScaleable.call(this);
  }

  sys.extend(Scaleable, EventTracker);
  sys.mixin(Scaleable, Transformable);
  sys.mixin(Scaleable, BaseScaleable);

  return Scaleable;
});
