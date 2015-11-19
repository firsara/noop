/*
 * TransformableComponent.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define([
  '../sys',
  './Transformable',
  './Component'
],
function(
  sys,
  Transformable,
  Component
) {
  /**
   * a component that's not only a container but a transformable one (scaling, rotating, moving)<br>
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
   * @class TransformableComponent
   * @memberof dom
   * @extends dom.Transformable
   * @mixes dom.Component
   *
   * @param {Handlebars} template should be a compiled handlebars template. alternatively can be a plain string or jquery object
   * @param {object} data the data to pass through the template, optional
   * @param {object} options optional options to overwrite container properties before inheriting
   **/
  function TransformableComponent(template, data, options){
    // call super constructor
    Transformable.call(this, template, data, options);

    // mix in component class
    Component.call(this);
  }

  sys.extend(TransformableComponent, Transformable);
  sys.mixin(TransformableComponent, Component);

  return TransformableComponent;
});
