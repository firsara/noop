/*
 * TransformClip.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define([
  '../sys',
  './EventTracker',
  '../display/Transformable',
  '../display/MoveClip',
  '../display/ScaleClip',
  '../display/RotateClip'
],
function(
  sys,
  EventTracker,
  Transformable,
  BaseMoveClip,
  BaseScaleClip,
  BaseRotateClip
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
   * * Parent.call(this, template, data);
   *
   * @class TransformClip
   * @memberof dom
   * @extends dom.EventTracker
   * @mixes display.base.BaseTransformable
   * @mixes display.base.BaseMoveClip
   * @mixes display.base.BaseScaleClip
   * @mixes display.base.BaseRotateClip
   *
   * @param {Handlebars} template should be a compiled handlebars template. alternatively can be a plain string or jquery object
   * @param {object} data the data to pass through the template, optional
   * @param {object} options optional options to overwrite container properties before inheriting
   **/
  function TransformClip(template, data, options){
    // set all transformations to be default = true
    // can be overriden in child classes by setting desired property to true before calling parent constructor
    this._moves = sys.setDefaultValue(this._moves, true);
    this._rotates = sys.setDefaultValue(this._rotates, true);
    this._scales = sys.setDefaultValue(this._scales, true);

    // extend from base class
    EventTracker.call(this, template, data, options);
    Transformable.call(this);

    // mix in other transformables
    if (this._moves) BaseMoveClip.call(this);
    if (this._scales) BaseScaleClip.call(this);
    if (this._rotates) BaseRotateClip.call(this);
  }

  sys.extend(TransformClip, EventTracker);

  sys.mixin(TransformClip, Transformable);

  sys.mixin(TransformClip, BaseMoveClip);
  sys.mixin(TransformClip, BaseScaleClip);
  sys.mixin(TransformClip, BaseRotateClip);

  return TransformClip;
});
