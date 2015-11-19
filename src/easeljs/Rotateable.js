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
   * @memberof easeljs
   * @extends easeljs.EventTracker
   * @mixes display.base.BaseTransformable
   * @mixes display.base.BaseRotateable
   **/
  function Rotateable(){
    EventTracker.call(this);
    Transformable.call(this);
    BaseRotateable.call(this);
  }

  sys.extend(Rotateable, EventTracker);
  sys.mixin(Rotateable, Transformable);
  sys.mixin(Rotateable, BaseRotateable);

  return Rotateable;
});
