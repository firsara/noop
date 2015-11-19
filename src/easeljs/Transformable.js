/*
 * Transformable.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define([
  '../sys',
  './EventTracker',
  '../display/Transformable',
  '../display/Moveable',
  '../display/Scaleable',
  '../display/Rotateable'
],
function(
  sys,
  EventTracker,
  BaseTransformable,
  BaseMoveable,
  BaseScaleable,
  BaseRotateable
) {
  /**
   * implements all transformations (move, scale, rotate)<br>
   * can exclude individual transformations by unsetting:
   *
   * * this._moves = false
   * * this._rotates = false
   * * this._scales = false
   *
   * to false before calling parent constructor
   *
   * * Parent.call(this);
   *
   * @class Transformable
   * @memberof easeljs
   * @extends easeljs.EventTracker
   * @mixes display.base.BaseTransformable
   * @mixes display.base.BaseMoveable
   * @mixes display.base.BaseScaleable
   * @mixes display.base.BaseRotateable
   **/
  function Transformable(){
    // set all transformations to be default = true
    // can be overriden in child classes by setting desired property to true before calling parent constructor
    this._moves = sys.setDefaultValue(this._moves, true);
    this._rotates = sys.setDefaultValue(this._rotates, true);
    this._scales = sys.setDefaultValue(this._scales, true);

    // extend from base class
    EventTracker.call(this);
    BaseTransformable.call(this);

    // mix in other transformables
    if (this._moves) BaseMoveable.call(this);
    if (this._scales) BaseScaleable.call(this);
    if (this._rotates) BaseRotateable.call(this);
  }

  sys.extend(Transformable, EventTracker);

  sys.mixin(Transformable, BaseTransformable);

  sys.mixin(Transformable, BaseMoveable);
  sys.mixin(Transformable, BaseScaleable);
  sys.mixin(Transformable, BaseRotateable);

  return Transformable;
});
