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

    this._resizeTimeout = null;
    this._doResize = this.__bind(_doResize);
    window.addEventListener('resize', this.__bind(_resize));
  }

  sys.extend(Stage, Container);

  var _resize = function(event){
    if (this._resizeTimeout) clearTimeout(this._resizeTimeout);
    this._resizeTimeout = setTimeout(this._doResize, 170);
  };

  var _doResize = function(){
    this.bubbleDispatch('resize', true);
  };

  return Stage;
});
