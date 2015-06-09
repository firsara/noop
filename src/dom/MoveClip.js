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
   * @memberof dom
   * @extends dom.EventTracker
   * @mixes display.base.BaseTransformable
   * @mixes display.base.BaseMoveClip
   *
   * @param {Handlebars} template should be a compiled handlebars template. alternatively can be a plain string or jquery object
   * @param {object} data the data to pass through the template, optional
   * @param {object} options optional options to overwrite container properties before inheriting
   **/
  function MoveClip(template, data, options){
    EventTracker.call(this, template, data, options);
    Transformable.call(this);
    BaseMoveClip.call(this);
  }

  sys.extend(MoveClip, EventTracker);
  sys.mixin(MoveClip, Transformable);
  sys.mixin(MoveClip, BaseMoveClip);

  return MoveClip;
});
