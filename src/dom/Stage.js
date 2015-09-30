/*
 * Stage.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 */
define([
  '../sys',
  './Container'
],
function(
  sys,
  Container
) {
  /**
   * @class Stage
   * @memberof dom
   * @extends dom.Container
   *
   * @param {Handlebars} template should be a compiled handlebars template. alternatively can be a plain string or jquery object
   * @param {object} data the data to pass through the template, optional
   * @param {object} options optional options to overwrite container properties before inheriting
   **/
  function Stage(template, data, options){
    this.isStage = true;
    Container.call(this, template, data, options);
    this.stage = this.el;
    this.$stage = $(this.stage);
  }

  sys.extend(Stage, Container);

  return Stage;
});
