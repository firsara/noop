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
   * @memberof easeljs
   * @extends easeljs.EventTracker
   * @mixes display.base.BaseTransformable
   * @mixes display.base.BaseMoveable
   **/
  function Moveable(){
    EventTracker.call(this);
    Transformable.call(this);
    BaseMoveable.call(this);
  }

  sys.extend(Moveable, EventTracker);
  sys.mixin(Moveable, Transformable);
  sys.mixin(Moveable, BaseMoveable);

  return Moveable;
});
