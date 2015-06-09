/*
 * MoveClip.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define([
  '../sys',
  './EventTracker',
  '../display/Transformable',
  '../display/MoveClip'
],
function(
  sys,
  EventTracker,
  Transformable,
  BaseMoveClip
) {
  /**
   * @see display.base.BaseMoveClip
   *
   * @class MoveClip
   * @memberof easeljs
   * @extends easeljs.EventTracker
   * @mixes display.base.BaseTransformable
   * @mixes display.base.BaseMoveClip
   **/
  function MoveClip(){
    EventTracker.call(this);
    Transformable.call(this);
    BaseMoveClip.call(this);
  }

  sys.extend(MoveClip, EventTracker);
  sys.mixin(MoveClip, Transformable);
  sys.mixin(MoveClip, BaseMoveClip);

  return MoveClip;
});
